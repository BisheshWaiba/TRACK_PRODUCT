// Every money figure in the app comes from here.
//
// The temptation is to work each number out on the page that shows it -
// it is only a reduce, after all. Do that and the Dashboard and the Day
// Book quietly disagree about what today's cash was, and neither is
// obviously wrong. So: one definition each, used everywhere.
//
// Four rules the whole module rests on:
//
//   1. A sale is not money. It records that a customer now owes us; the
//      cash arrives later as a payment. A 12,000 sale moves "to receive"
//      by 12,000 and the bank balance by nothing.
//   2. An expense IS money. It is paid on the spot, so it is cash out
//      the moment it is recorded.
//   3. A bill with no party is money. A walk-in has no ledger to settle
//      later, so its cash moved when it was recorded - see settledOnSpot.
//   4. Cash in hand is bankAccountId == null. Not a row in bankAccounts.
//      Everything buckets null as "cash".

/** The day an entry is FOR, which is not always the day it was typed. */
export function onDate(row) {
  return row.entryDate || row.billDate || row.transferDate || String(row.createdAt).slice(0, 10);
}

/** A sale or purchase bill with nobody to bill it to: no ledger will
 *  ever settle it, so the money moved there and then. */
export function settledOnSpot(t) {
  return (t.type === "sale" || t.type === "purchase") && !t.partyId && !t.supplierId;
}

// Mirrors invoicePaidAmount/invoicePaymentStatus on the customer side
// (lib/calculations.js) - the two can't share code because one reads
// `payments` keyed by invoiceId and the other reads `vendorEntries` keyed
// by businessTransactionId, but the shape of the answer is the same:
// a bill is Paid/Partial/Pending by how much of ITS amount has actually
// been paid, not by the supplier's aggregate running balance. A payment
// made without picking a bill (businessTransactionId null) still counts
// toward that balance - it just can't confirm any one bill as paid.
export function purchasePaidAmount(vendorEntries, purchaseId) {
  return vendorEntries
    .filter((e) => e.businessTransactionId === purchaseId && e.entryType === "credit")
    .reduce((sum, e) => sum + e.amount, 0);
}

export function purchasePaymentStatus(purchase, vendorEntries) {
  const paid = purchasePaidAmount(vendorEntries, purchase.id);
  if (paid <= 0) return "Pending";
  if (paid < purchase.amount) return "Partial";
  return "Paid";
}

const CASH = "cash";
const key = (bankAccountId) => bankAccountId || CASH;

// ---------------------------------------------------------------------
// What each party owes, and is owed
// ---------------------------------------------------------------------
// Two ledgers, opposite polarity, one party table. They are deliberately
// not netted: somebody who buys from us and also supplies us has two
// separate balances, and collapsing them into one signed number hides
// half of what is going on.
export function partyBalances(customerEntries, vendorEntries) {
  const byParty = new Map();
  const at = (id) => {
    let row = byParty.get(id);
    if (!row) byParty.set(id, (row = { receivable: 0, payable: 0 }));
    return row;
  };

  for (const e of customerEntries) {
    at(e.customerId).receivable += e.entryType === "debit" ? e.amount : -e.amount;
  }
  for (const e of vendorEntries) {
    const partyId = e.supplierId || e.vendorId;
    if (partyId) at(partyId).payable += e.entryType === "debit" ? e.amount : -e.amount;
  }

  // Only parties on the wrong side of zero count towards the totals, so
  // one customer in credit never quietly cancels another's debt.
  let totalReceivable = 0;
  let totalPayable = 0;
  for (const row of byParty.values()) {
    if (row.receivable > 0) totalReceivable += row.receivable;
    if (row.payable > 0) totalPayable += row.payable;
  }
  return { byParty, totalReceivable, totalPayable };
}

// ---------------------------------------------------------------------
// How much money we actually have
// ---------------------------------------------------------------------
// The one "cash position" figure. `upto` (exclusive) is what makes the
// Day Book's opening balance the same calculation as the balance itself,
// rather than a second one that drifts from it.
export function accountBalances({ transactions = [], customerEntries = [], vendorEntries = [], transfers = [], accounts = [] }, upto) {
  const before = (row) => !upto || onDate(row) < upto;
  const byAccount = { [CASH]: 0 };
  const activity = { [CASH]: [] };

  const add = (bankAccountId, amount, item) => {
    const k = key(bankAccountId);
    byAccount[k] = (byAccount[k] || 0) + amount;
    (activity[k] = activity[k] || []).push({ ...item, amount: Math.abs(amount), inflow: amount > 0 });
  };

  for (const t of transactions) {
    if (!before(t)) continue;
    if (settledOnSpot(t)) {
      const isSale = t.type === "sale";
      add(t.bankAccountId, isSale ? t.amount : -t.amount, {
        id: t.id, date: onDate(t), label: (isSale ? "Sale" : "Purchase") + (t.partyName ? " · " + t.partyName : ""),
      });
    }
    if (t.type === "expense") {
      add(t.bankAccountId, -t.amount, {
        id: t.id, date: onDate(t), label: t.partyName ? "Expense · " + t.partyName : "Expense",
      });
    }
  }

  for (const e of customerEntries) {
    if (!before(e)) continue;
    // A customer credit is money received - whether it was typed here or
    // mirrored from a payment against a sale.
    if (e.entryType === "credit") {
      add(e.bankAccountId, e.amount, { id: e.id, date: onDate(e), label: "Received" });
    } else if (e.source === "manual") {
      // A hand-entered debit is money going back out (a refund). A
      // booking debit is a sale - a debt, not a payment.
      add(e.bankAccountId, -e.amount, { id: e.id, date: onDate(e), label: "Paid out" });
    }
  }

  for (const e of vendorEntries) {
    if (!before(e)) continue;
    if (e.entryType === "credit") {
      add(e.bankAccountId, -e.amount, { id: e.id, date: onDate(e), label: "Paid supplier" });
    }
  }

  // Our own money moving between our own accounts: one side down, the
  // other up, total untouched.
  for (const t of transfers) {
    if (!before(t)) continue;
    add(t.fromAccountId, -t.amount, { id: t.id, date: onDate(t), label: "Transfer out" });
    add(t.toAccountId, t.amount, { id: t.id, date: onDate(t), label: "Transfer in" });
  }

  for (const list of Object.values(activity)) list.sort((a, b) => (a.date < b.date ? 1 : -1));

  const cash = byAccount[CASH] || 0;
  const perAccount = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    balance: byAccount[a.id] || 0,
    activity: activity[a.id] || [],
  }));
  return {
    cash,
    cashActivity: activity[CASH] || [],
    perAccount,
    total: cash + perAccount.reduce((sum, a) => sum + a.balance, 0),
  };
}

// ---------------------------------------------------------------------
// Money in and money out over a period
// ---------------------------------------------------------------------
export function receivedAndPaid(data, range = {}) {
  const { transactions = [], customerEntries = [], vendorEntries = [] } = data;
  const inRange = (row) => {
    const d = onDate(row);
    return (!range.from || d >= range.from) && (!range.to || d <= range.to);
  };

  let received = 0;
  let paid = 0;
  for (const t of transactions) {
    if (!inRange(t)) continue;
    if (t.type === "expense") paid += t.amount;
    if (settledOnSpot(t)) {
      if (t.type === "sale") received += t.amount;
      else paid += t.amount;
    }
  }
  for (const e of customerEntries) {
    if (!inRange(e)) continue;
    if (e.entryType === "credit") received += e.amount;
    else if (e.source === "manual") paid += e.amount;
  }
  for (const e of vendorEntries) {
    if (!inRange(e)) continue;
    if (e.entryType === "credit") paid += e.amount;
  }
  return { received, paid };
}

// Same definitions as receivedAndPaid, but the rows themselves rather than
// the sum - the Totals report lists these, each linking back to where it
// came from, instead of only showing a figure nobody can trace.
export function receivedAndPaidEntries(data, range = {}) {
  const { transactions = [], customerEntries = [], vendorEntries = [] } = data;
  const inRange = (row) => {
    const d = onDate(row);
    return (!range.from || d >= range.from) && (!range.to || d <= range.to);
  };
  const entries = [];
  for (const t of transactions) {
    if (!inRange(t)) continue;
    if (t.type === "expense") entries.push({ id: t.id, date: onDate(t), direction: "paid", label: t.partyName || "Expense", amount: t.amount, kind: "expense" });
    if (settledOnSpot(t)) {
      if (t.type === "sale") entries.push({ id: t.id, date: onDate(t), direction: "received", label: t.partyName || "Walk-in sale", amount: t.amount, kind: "sale" });
      else entries.push({ id: t.id, date: onDate(t), direction: "paid", label: t.partyName || "Walk-in purchase", amount: t.amount, kind: "purchase" });
    }
  }
  for (const e of customerEntries) {
    if (!inRange(e)) continue;
    if (e.entryType === "credit") entries.push({ id: e.id, date: onDate(e), direction: "received", label: "Received", amount: e.amount, kind: "customer", partyId: e.customerId });
    else if (e.source === "manual") entries.push({ id: e.id, date: onDate(e), direction: "paid", label: "Refund", amount: e.amount, kind: "customer", partyId: e.customerId });
  }
  for (const e of vendorEntries) {
    if (!inRange(e)) continue;
    if (e.entryType === "credit") entries.push({ id: e.id, date: onDate(e), direction: "paid", label: "Paid supplier", amount: e.amount, kind: "supplier", partyId: e.supplierId || e.vendorId });
  }
  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ---------------------------------------------------------------------
// Cash flow over time - in vs out, bucketed by day or by month. Same
// definitions as receivedAndPaid, bucketed instead of summed once.
// "Week" buckets the last 7 individual days (not an 8-week rolling
// aggregate) - checking cashflow means seeing each day's activity, not
// one bar per calendar week.
// ---------------------------------------------------------------------
export function cashflow(data, granularity = "week", count = granularity === "week" ? 7 : 6) {
  const { transactions = [], customerEntries = [], vendorEntries = [] } = data;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const buckets = [];
  if (granularity === "week") {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      buckets.push({ label: `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`, from: key, to: key, in: 0, out: 0 });
    }
  } else {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      buckets.push({
        label: d.toLocaleDateString("en", { month: "short" }),
        from: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`,
        to: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
        in: 0, out: 0,
      });
    }
  }
  const bucketFor = (date) => buckets.find((b) => date >= b.from && date <= b.to);

  for (const t of transactions) {
    const b = bucketFor(onDate(t));
    if (!b) continue;
    if (t.type === "expense") b.out += t.amount;
    if (settledOnSpot(t)) {
      if (t.type === "sale") b.in += t.amount;
      else b.out += t.amount;
    }
  }
  for (const e of customerEntries) {
    const b = bucketFor(onDate(e));
    if (!b) continue;
    if (e.entryType === "credit") b.in += e.amount;
    else if (e.source === "manual") b.out += e.amount;
  }
  for (const e of vendorEntries) {
    const b = bucketFor(onDate(e));
    if (!b) continue;
    if (e.entryType === "credit") b.out += e.amount;
  }
  return buckets;
}

// ---------------------------------------------------------------------
// Profit and loss
// ---------------------------------------------------------------------
// Billed, not collected. Show it next to the cash position or it reads
// as money in the bank, which it is not.
export function profitAndLoss({ sales = [], transactions = [] }, range = {}) {
  const inRange = (d) => (!range.from || d >= range.from) && (!range.to || d <= range.to);

  // Sales come through the sales table, not as bills, so they are
  // counted from there - at the price each was actually made at.
  let sale = 0;
  for (const s of sales) if (inRange(s.date)) sale += s.value;

  let purchase = 0;
  let expense = 0;
  for (const t of transactions) {
    if (!inRange(onDate(t))) continue;
    if (t.type === "sale") sale += t.amount;
    if (t.type === "purchase") purchase += t.amount;
    if (t.type === "expense") expense += t.amount;
  }

  const gross = sale - purchase;
  return { sale, purchase, expense, gross, net: gross - expense };
}

// ---------------------------------------------------------------------
// The day book
// ---------------------------------------------------------------------
// One day laid out like a paper cash book: what we started with, every
// movement in time order, what we ended with.
//
// Two kinds of row, and keeping them apart is the whole point:
//   - a DOCUMENT (a sale, a purchase bill) shows what was billed and
//     leaves the running balance alone;
//   - a CASH row (a payment, an expense, a supplier payment) moves it.
//
// A sale therefore appears once as a document, and again - later, and
// for whatever was actually collected - as a payment. Showing the
// mirrored ledger debit as well would count it twice, so it is skipped.
export function dayBook(data, day) {
  const { transactions = [], customerEntries = [], vendorEntries = [], transfers = [], accounts = [], parties = [], suppliers = [], invoices = [] } = data;

  const partyName = new Map([...parties, ...suppliers].map((p) => [p.id, p.name]));
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const invoiceById = new Map(invoices.map((i) => [i.id, i]));
  const via = (id) => (id ? accountName.get(id) || "Bank" : "Cash");
  const onDay = (row) => onDate(row) === day;

  const opening = accountBalances(data, day).total;
  const rows = [];
  // Invoice is the value before discount and VAT (spec 3.1); a legacy
  // sale never had either, so it equals the billed amount.
  const push = (row) => rows.push({ billed: null, cashIn: null, cashOut: null, balance: null, discount: null, invoice: row.billed ?? null, ...row });

  for (const e of customerEntries) {
    if (!onDay(e)) continue;
    if (e.entryType === "credit") {
      push({
        id: e.id, kind: "received", at: e.createdAt,
        title: "Received from " + (partyName.get(e.customerId) || "customer"),
        sub: [e.receiptNo && "Receipt #" + e.receiptNo, via(e.bankAccountId), e.note].filter(Boolean).join(" · "),
        cashIn: e.amount,
        locked: e.source !== "manual",
      });
    } else if (e.source === "manual") {
      push({
        id: e.id, kind: "paid", at: e.createdAt,
        title: "Paid to " + (partyName.get(e.customerId) || "customer"),
        sub: [via(e.bankAccountId), e.note].filter(Boolean).join(" · "),
        cashOut: e.amount,
      });
    } else if (e.sourceType === "sale" || e.sourceType === "invoice") {
      // The sale/invoice itself. Billed, not collected - no cash, no
      // balance. A multi-product invoice carries its own discount/VAT;
      // a legacy single-product sale never had either.
      const inv = e.sourceType === "invoice" ? invoiceById.get(e.sourceId) : null;
      const discount = inv?.discountAmount || 0;
      const vat = inv?.vatAmount || 0;
      push({
        id: e.id, kind: "sale", at: e.createdAt,
        title: "Sale to " + (partyName.get(e.customerId) || "customer"),
        sub: e.sourceId || "",
        billed: e.amount,
        discount: discount || null,
        invoice: e.amount + discount - vat,
        locked: true,
      });
    }
    // Anything else booking-sourced is a bill, shown from the bill below.
  }

  for (const e of vendorEntries) {
    if (!onDay(e) || e.entryType !== "credit") continue;
    push({
      id: e.id, kind: "paid", at: e.createdAt,
      title: "Paid to " + (partyName.get(e.supplierId || e.vendorId) || "supplier"),
      sub: [e.receiptNo && "Receipt #" + e.receiptNo, via(e.bankAccountId), e.note].filter(Boolean).join(" · "),
      cashOut: e.amount,
    });
  }

  for (const t of transactions) {
    if (!onDay(t)) continue;
    const isExpense = t.type === "expense";
    push({
      id: t.id,
      kind: isExpense ? "expense" : t.type,
      at: t.createdAt,
      title: isExpense ? t.partyName || "Expense" : t.partyName || (t.type === "sale" ? "Sale" : "Purchase"),
      sub: [t.billNo && "Bill #" + t.billNo, t.note, isExpense ? via(t.bankAccountId) : null].filter(Boolean).join(" · "),
      // An expense is cash; a bill is a debt until it is settled - unless
      // there is nobody to settle with, in which case it moved money now.
      billed: isExpense ? null : t.amount,
      discount: !isExpense ? t.discountAmount || null : null,
      invoice: !isExpense ? t.amount + (t.discountAmount || 0) - (t.vatAmount || 0) : null,
      cashIn: !isExpense && settledOnSpot(t) && t.type === "sale" ? t.amount : null,
      cashOut: isExpense ? t.amount : settledOnSpot(t) && t.type === "purchase" ? t.amount : null,
    });
  }

  for (const t of transfers) {
    if (!onDay(t)) continue;
    push({
      id: t.id, kind: "transfer", at: t.createdAt,
      title: via(t.fromAccountId) + " → " + via(t.toAccountId),
      sub: t.note || "",
      billed: t.amount,
    });
  }

  rows.sort((a, b) => String(a.at).localeCompare(String(b.at)));

  let running = opening;
  let totalIn = 0;
  let totalOut = 0;
  let billedSales = 0;
  let billedPurchases = 0;
  for (const r of rows) {
    if (r.cashIn != null || r.cashOut != null) {
      totalIn += r.cashIn || 0;
      totalOut += r.cashOut || 0;
      running += (r.cashIn || 0) - (r.cashOut || 0);
      r.balance = running;
    }
    if (r.kind === "sale") billedSales += r.billed || 0;
    if (r.kind === "purchase") billedPurchases += r.billed || 0;
  }

  return { rows, opening, totalIn, totalOut, closing: running, billedSales, billedPurchases };
}
