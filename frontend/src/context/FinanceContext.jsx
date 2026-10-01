import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useData } from "./DataContext";
import { accountBalances, dayBook, partyBalances, profitAndLoss, receivedAndPaid } from "../lib/finance";

// The books. Kept apart from DataContext deliberately: that one is about
// what was sold and shipped, this one is about what it did to the money,
// and joining them would make a 700-line provider nobody wants to read.
// The two meet in exactly one place - the customer ledger mirrors sales
// and payments, which the database does with triggers, not this file.
const FinanceContext = createContext(null);

function mapAccount(a) {
  return {
    id: a.id, name: a.name, bankName: a.bank_name, accountNumber: a.account_number,
    accountHolderName: a.account_holder_name, address: a.address, createdAt: a.created_at,
  };
}
function mapCategory(c) {
  return { id: c.id, name: c.name, createdAt: c.created_at };
}
function mapItem(i) {
  return { id: i.id, name: i.name, rate: i.rate == null ? null : Number(i.rate), createdAt: i.created_at };
}
function mapTransaction(t) {
  return {
    id: t.id, type: t.type, amount: Number(t.amount), note: t.note,
    partyName: t.party_name, partyId: t.party_id, billNo: t.bill_no, billDate: t.bill_date,
    items: t.items || [], discountAmount: Number(t.discount_amount || 0), vatAmount: Number(t.vat_amount || 0),
    expenseCategoryId: t.expense_category_id, paymentMode: t.payment_mode, bankAccountId: t.bank_account_id,
    sourceType: t.source_type, sourceId: t.source_id, createdAt: t.created_at,
  };
}
function mapCustomerEntry(e) {
  return {
    id: e.id, customerId: e.customer_id, entryType: e.entry_type, amount: Number(e.amount), note: e.note,
    source: e.source, sourceType: e.source_type, sourceId: e.source_id, bankAccountId: e.bank_account_id,
    entryDate: e.entry_date, receiptNo: e.receipt_no, createdAt: e.created_at,
  };
}
function mapVendorEntry(e) {
  return {
    id: e.id, vendorId: e.vendor_id, entryType: e.entry_type, amount: Number(e.amount), note: e.note,
    source: e.source, sourceType: e.source_type, sourceId: e.source_id, bankAccountId: e.bank_account_id,
    entryDate: e.entry_date, receiptNo: e.receipt_no, createdAt: e.created_at,
  };
}
function mapTransfer(t) {
  return {
    id: t.id, fromAccountId: t.from_account_id, toAccountId: t.to_account_id,
    amount: Number(t.amount), note: t.note, transferDate: t.transfer_date, createdAt: t.created_at,
  };
}

export function today() {
  const d = new Date();
  // Local, not toISOString - that is UTC, and it puts a late-evening
  // entry in Nepal on the following day.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function FinanceProvider({ children }) {
  const { customers, sales, saleTotal } = useData();

  const [bankAccounts, setBankAccounts] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [financeItems, setFinanceItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customerEntries, setCustomerEntries] = useState([]);
  const [vendorEntries, setVendorEntries] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [ba, ec, fi, bt, cl, vl, at] = await Promise.all([
      supabase.from("bank_accounts").select("*").order("name"),
      supabase.from("expense_categories").select("*").order("name"),
      supabase.from("finance_items").select("*").order("name"),
      supabase.from("business_transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("customer_ledger_entries").select("*").order("created_at", { ascending: false }),
      supabase.from("vendor_ledger_entries").select("*").order("created_at", { ascending: false }),
      supabase.from("account_transfers").select("*").order("transfer_date", { ascending: false }),
    ]);
    const err = ba.error || ec.error || fi.error || bt.error || cl.error || vl.error || at.error;
    setError(err ? err.message : null);
    setBankAccounts((ba.data || []).map(mapAccount));
    setExpenseCategories((ec.data || []).map(mapCategory));
    setFinanceItems((fi.data || []).map(mapItem));
    setTransactions((bt.data || []).map(mapTransaction));
    setCustomerEntries((cl.data || []).map(mapCustomerEntry));
    setVendorEntries((vl.data || []).map(mapVendorEntry));
    setTransfers((at.data || []).map(mapTransfer));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Same live-sync approach as DataContext. It matters more here: a sale
  // recorded on another device writes a ledger entry through a database
  // trigger, so this client never sees that insert as its own mutation -
  // realtime is the only way it arrives.
  useEffect(() => {
    function applyChange(setState, mapFn, payload) {
      if (payload.eventType === "INSERT") {
        const mapped = mapFn(payload.new);
        setState((prev) => (prev.some((r) => r.id === mapped.id) ? prev : [...prev, mapped]));
      } else if (payload.eventType === "UPDATE") {
        const mapped = mapFn(payload.new);
        setState((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
      } else if (payload.eventType === "DELETE") {
        setState((prev) => prev.filter((r) => r.id !== payload.old.id));
      }
    }

    const channel = supabase
      .channel("finance-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bank_accounts" }, (p) => applyChange(setBankAccounts, mapAccount, p))
      .on("postgres_changes", { event: "*", schema: "public", table: "expense_categories" }, (p) => applyChange(setExpenseCategories, mapCategory, p))
      .on("postgres_changes", { event: "*", schema: "public", table: "finance_items" }, (p) => applyChange(setFinanceItems, mapItem, p))
      .on("postgres_changes", { event: "*", schema: "public", table: "business_transactions" }, (p) => applyChange(setTransactions, mapTransaction, p))
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_ledger_entries" }, (p) => applyChange(setCustomerEntries, mapCustomerEntry, p))
      .on("postgres_changes", { event: "*", schema: "public", table: "vendor_ledger_entries" }, (p) => applyChange(setVendorEntries, mapVendorEntry, p))
      .on("postgres_changes", { event: "*", schema: "public", table: "account_transfers" }, (p) => applyChange(setTransfers, mapTransfer, p))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Everything the screens read, worked out once. `parties` is the
  // customers table - the same rows serve as suppliers when we are the
  // ones buying.
  const book = useMemo(
    () => ({ transactions, customerEntries, vendorEntries, transfers, accounts: bankAccounts, parties: customers }),
    [transactions, customerEntries, vendorEntries, transfers, bankAccounts, customers]
  );

  const balances = useMemo(() => accountBalances(book), [book]);
  const ledger = useMemo(() => partyBalances(customerEntries, vendorEntries), [customerEntries, vendorEntries]);

  const saleValues = useMemo(
    () => sales.map((s) => ({ date: s.date, value: saleTotal(s) })),
    // saleTotal closes over products, which change with sales rarely
    // enough that recomputing on the sales list is the right trade.
    [sales, saleTotal]
  );

  function report(range) {
    return {
      ...profitAndLoss({ sales: saleValues, transactions }, range),
      ...receivedAndPaid(book, range),
    };
  }

  function book_(day) {
    return dayBook(book, day);
  }

  // ---- writes -------------------------------------------------------
  // Trigger-written rows (source 'booking') are refused by RLS, so the
  // screens must not offer to edit them; canEdit says which is which.
  const canEdit = (entry) => entry.source === "manual";

  async function recordReceipt({ customerId, amount, date, receiptNo, note, bankAccountId }) {
    const { error: err } = await supabase.from("customer_ledger_entries").insert({
      customer_id: customerId, entry_type: "credit", amount: Number(amount), note: note || null,
      source: "manual", bank_account_id: bankAccountId || null, entry_date: date || today(),
      receipt_no: receiptNo || null,
    });
    if (err) throw err;
    await refresh();
  }

  async function recordPayout({ vendorId, amount, date, receiptNo, note, bankAccountId }) {
    const { error: err } = await supabase.from("vendor_ledger_entries").insert({
      vendor_id: vendorId, entry_type: "credit", amount: Number(amount), note: note || null,
      source: "manual", bank_account_id: bankAccountId || null, entry_date: date || today(),
      receipt_no: receiptNo || null,
    });
    if (err) throw err;
    await refresh();
  }

  async function saveTransaction(input, id) {
    const row = {
      type: input.type,
      amount: Number(input.amount),
      note: input.note || null,
      party_name: input.partyName || null,
      party_id: input.partyId || null,
      bill_no: input.billNo || null,
      bill_date: input.billDate || today(),
      items: input.items || [],
      discount_amount: Number(input.discountAmount || 0),
      vat_amount: Number(input.vatAmount || 0),
      expense_category_id: input.expenseCategoryId || null,
      // A bill is a debt until it is settled, so it carries no account.
      // An expense is paid on the spot, so it does.
      payment_mode: input.type === "expense" && input.bankAccountId ? "bank" : "cash",
      bank_account_id: input.type === "expense" ? input.bankAccountId || null : null,
    };
    const q = id
      ? supabase.from("business_transactions").update(row).eq("id", id)
      : supabase.from("business_transactions").insert(row);
    const { error: err } = await q;
    if (err) throw err;
    await refresh();
  }

  async function updateEntry(table, id, patch) {
    const { error: err } = await supabase.from(table).update(patch).eq("id", id);
    if (err) throw err;
    await refresh();
  }

  async function deleteRow(table, id) {
    const { error: err } = await supabase.from(table).delete().eq("id", id);
    if (err) throw err;
    await refresh();
  }

  async function createExpenseCategory(name) {
    const { data, error: err } = await supabase.from("expense_categories").insert({ name }).select().single();
    if (err) throw err;
    await refresh();
    return data.id;
  }

  async function createBankAccount(input) {
    const { error: err } = await supabase.from("bank_accounts").insert({
      name: input.name, bank_name: input.bankName || null, account_number: input.accountNumber || null,
      account_holder_name: input.accountHolderName || null, address: input.address || null,
    });
    if (err) throw err;
    await refresh();
  }

  async function createTransfer({ fromAccountId, toAccountId, amount, date, note }) {
    const { error: err } = await supabase.from("account_transfers").insert({
      from_account_id: fromAccountId || null, to_account_id: toAccountId || null,
      amount: Number(amount), transfer_date: date || today(), note: note || null,
    });
    if (err) throw err;
    await refresh();
  }

  // Ascending off the highest number already used in this direction, so
  // Receipt No. and Payment No. count independently. Falling back to the
  // row count keeps it moving when older entries were never numbered.
  function nextNumber(entries) {
    const nums = entries
      .filter((e) => e.source === "manual" && e.entryType === "credit")
      .map((e) => Number(String(e.receiptNo || "").replace(/\D/g, "")))
      .filter((n) => Number.isFinite(n) && n > 0);
    const manual = entries.filter((e) => e.source === "manual" && e.entryType === "credit").length;
    return String((nums.length ? Math.max(...nums) : manual) + 1).padStart(3, "0");
  }

  const value = {
    bankAccounts, expenseCategories, financeItems, transactions,
    customerEntries, vendorEntries, transfers,
    loading, error, refresh,
    balances, ledger, report, dayBookFor: book_, canEdit,
    nextReceiptNo: () => nextNumber(customerEntries),
    nextPaymentNo: () => nextNumber(vendorEntries),
    recordReceipt, recordPayout, saveTransaction, updateEntry, deleteRow,
    createBankAccount, createTransfer, createExpenseCategory,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
