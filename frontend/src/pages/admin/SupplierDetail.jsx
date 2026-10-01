import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { ledgerLine, money } from "../../lib/format";
import { useFinance } from "../../context/FinanceContext";

function dateOf(value) {
  return value || "-";
}

function itemSummary(items) {
  if (!Array.isArray(items) || items.length === 0) return { text: "No item details", count: 0 };
  const names = items.map((item) => {
    const description = item.description || item.name || "Item";
    const qty = item.qty == null ? "" : ` x ${item.qty}`;
    return `${description}${qty}`;
  });
  return { text: names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2} more` : ""), count: names.length };
}

function sourceLabel(source) {
  return source === "booking" ? "Booking" : "Manual";
}

function purchaseSource(purchase, entries) {
  const linkedEntry = entries.find((entry) => entry.sourceType === "business_transaction" && entry.sourceId === purchase.id);
  return purchase.source || linkedEntry?.source || "manual";
}

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { suppliers, transactions, vendorEntries, bankAccounts, ledger, updateSupplier, deleteSupplier, loading } = useFinance();
  const [editForm, setEditForm] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) return <div className="p-8 text-sm text-muted">Loading supplier...</div>;

  const supplier = suppliers.find((item) => item.id === id);
  if (!supplier) return <div className="flex flex-col items-center gap-4 py-24 text-center"><p className="text-base font-semibold">Supplier not found</p><Link to="/suppliers" className="btn-primary">Back to Suppliers</Link></div>;

  const purchases = transactions.filter((transaction) => transaction.type === "purchase" && transaction.supplierId === supplier.id).sort((a, b) => dateOf(b.billDate).localeCompare(dateOf(a.billDate)) || dateOf(b.createdAt).localeCompare(dateOf(a.createdAt)));
  const payments = vendorEntries.filter((entry) => (entry.supplierId || entry.vendorId) === supplier.id && entry.entryType === "credit").sort((a, b) => dateOf(b.entryDate || b.createdAt).localeCompare(dateOf(a.entryDate || a.createdAt)));
  const entries = vendorEntries.filter((entry) => (entry.supplierId || entry.vendorId) === supplier.id).sort((a, b) => dateOf(a.entryDate || a.createdAt).localeCompare(dateOf(b.entryDate || b.createdAt)) || dateOf(a.createdAt).localeCompare(dateOf(b.createdAt)));
  const partyEntry = ledger.byParty.get(supplier.id);
  const line = ledgerLine(partyEntry);
  const totalPurchases = purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const payable = Math.max(Number(partyEntry?.payable || 0), 0);
  const initials = supplier.name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase();
  const accountName = (accountId) => bankAccounts.find((account) => account.id === accountId)?.name || "Cash / account not specified";

  function openEdit() {
    setEditForm({ name: supplier.name, contact: supplier.contact, phone: supplier.phone, address: supplier.address });
  }

  async function handleEdit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateSupplier(supplier.id, editForm);
      setEditForm(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteSupplier(supplier.id);
      navigate("/suppliers", { replace: true });
    } catch (error) {
      setDeleteError(error.message);
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-[13px]"><Link to="/suppliers" className="font-semibold text-muted hover:text-ink">Suppliers</Link><span className="text-muted">/</span><span className="font-bold">{supplier.name}</span></div>
      <div className="card flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-ink-soft">{initials}</div><div><div className="font-display text-lg font-bold">{supplier.name}</div><div className="mt-1.5 flex flex-wrap gap-4 text-[13px] text-ink-soft"><span className="flex items-center gap-1.5"><Icon name="user" className="h-3.5 w-3.5 text-muted" strokeWidth={1.8} />{supplier.contact || "No contact person"}</span><span className="flex items-center gap-1.5"><Icon name="phone" className="h-3.5 w-3.5 text-muted" strokeWidth={1.8} />{supplier.phone || "No phone"}</span><span className="flex items-center gap-1.5"><Icon name="pin" className="h-3.5 w-3.5 text-muted" strokeWidth={1.8} />{supplier.address || "No address"}</span></div></div></div><div className="flex items-center gap-2.5"><Badge tone={line.tone}>{payable > 0 ? `Payable ${money(payable)}` : line.label}</Badge><button onClick={openEdit} title="Edit supplier" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2"><Icon name="edit" className="h-[14px] w-[14px] text-ink-soft" strokeWidth={1.7} /></button><button onClick={() => { setDeleteError(""); setDeleteOpen(true); }} title="Delete supplier" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2"><Icon name="trash" className="h-[14px] w-[14px] text-danger" strokeWidth={1.7} /></button></div></div>
      <div className="flex flex-wrap gap-2.5"><Link to="/purchases?add=1" className="btn-primary"><Icon name="cart" className="h-[15px] w-[15px]" strokeWidth={1.8} /> New Purchase</Link><Link to="/received-payments?direction=payment_out" className="btn-ghost"><Icon name="arrowUp" className="h-[15px] w-[15px]" strokeWidth={1.8} /> Record Payment</Link></div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5"><div className="card"><span className="text-xs font-semibold text-muted">TOTAL PURCHASES</span><div className="mt-1.5 font-display text-xl font-bold">{money(totalPurchases)}</div></div><div className="card"><span className="text-xs font-semibold text-muted">TOTAL PAID</span><div className="mt-1.5 font-display text-xl font-bold text-teal">{money(totalPaid)}</div></div><div className="card"><span className="text-xs font-semibold text-muted">OUTSTANDING</span><div className="mt-1.5 font-display text-xl font-bold text-danger">{money(payable)}</div></div><div className="card"><span className="text-xs font-semibold text-muted">PURCHASE BILLS</span><div className="mt-1.5 font-display text-xl font-bold">{purchases.length}</div></div><div className="card"><span className="text-xs font-semibold text-muted">PAYMENT RECORDS</span><div className="mt-1.5 font-display text-xl font-bold">{payments.length}</div></div></div>

      <section className="flex flex-col gap-4"><span className="text-[15px] font-semibold">Purchase history</span><div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block"><div className="grid min-w-[950px] grid-cols-[0.8fr_0.9fr_2fr_0.8fr_0.8fr_1fr_0.8fr] gap-2 bg-surface-2 px-5 py-3.5 text-[10.5px] font-bold tracking-wide text-muted"><span>DATE</span><span>BILL #</span><span>ITEMS</span><span>DISCOUNT</span><span>VAT</span><span>AMOUNT</span><span>SOURCE</span></div>{purchases.map((purchase) => { const summary = itemSummary(purchase.items); const source = purchaseSource(purchase, vendorEntries); return <div key={purchase.id} className="grid min-w-[950px] grid-cols-[0.8fr_0.9fr_2fr_0.8fr_0.8fr_1fr_0.8fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px]"><span className="text-ink-soft">{dateOf(purchase.billDate)}</span><span className="font-mono">{purchase.billNo || "-"}</span><span className="min-w-0"><span className="block truncate">{summary.text}</span><span className="text-[11px] text-muted">{summary.count} line{summary.count === 1 ? "" : "s"}</span></span><span>{money(purchase.discountAmount)}</span><span>{money(purchase.vatAmount)}</span><span className="font-semibold">{money(purchase.amount)}</span><Badge tone={source === "booking" ? "slate" : "muted"}>{sourceLabel(source)}</Badge></div>; })}{purchases.length === 0 && <div className="px-5 py-6 text-center text-sm text-muted">No purchases recorded yet.</div>}</div><div className="flex flex-col gap-2 sm:hidden">{purchases.map((purchase) => { const summary = itemSummary(purchase.items); const source = purchaseSource(purchase, vendorEntries); return <div key={purchase.id} className="flex flex-col gap-2 rounded-xl2 border border-border bg-surface p-3"><div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{purchase.billNo || "Purchase bill"}</div><div className="text-[12px] text-muted">{dateOf(purchase.billDate)} · {summary.count} line{summary.count === 1 ? "" : "s"}</div></div><Badge tone={source === "booking" ? "slate" : "muted"}>{sourceLabel(source)}</Badge></div><div className="text-[12.5px] text-ink-soft">{summary.text}</div><div className="flex flex-wrap justify-between gap-2 text-[12px] text-muted"><span>Discount {money(purchase.discountAmount)}</span><span>VAT {money(purchase.vatAmount)}</span><span className="font-semibold text-ink">{money(purchase.amount)}</span></div></div>; })}{purchases.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-6 text-center text-sm text-muted">No purchases recorded yet.</div>}</div></section>

      <section className="flex flex-col gap-4"><span className="text-[15px] font-semibold">Payment history</span><div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block"><div className="grid min-w-[850px] grid-cols-[0.9fr_1fr_1fr_1.2fr_1.8fr] gap-2 bg-surface-2 px-5 py-3.5 text-[10.5px] font-bold tracking-wide text-muted"><span>DATE</span><span>PAYMENT #</span><span>AMOUNT</span><span>SOURCE / ACCOUNT</span><span>NOTE</span></div>{payments.map((payment) => <div key={payment.id} className="grid min-w-[850px] grid-cols-[0.9fr_1fr_1fr_1.2fr_1.8fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px]"><span className="text-ink-soft">{dateOf(payment.entryDate || payment.createdAt?.slice(0, 10))}</span><span className="font-mono">{payment.receiptNo || "-"}</span><span className="font-semibold text-teal">{money(payment.amount)}</span><span>{sourceLabel(payment.source)} · {accountName(payment.bankAccountId)}</span><span className="truncate text-ink-soft">{payment.note || "-"}</span></div>)}{payments.length === 0 && <div className="px-5 py-6 text-center text-sm text-muted">No payments recorded yet.</div>}</div><div className="flex flex-col gap-2 sm:hidden">{payments.map((payment) => <div key={payment.id} className="flex items-center justify-between gap-3 rounded-xl2 border border-border bg-surface p-3"><div className="min-w-0"><div className="font-semibold">{payment.receiptNo || "Payment"} · {sourceLabel(payment.source)}</div><div className="truncate text-[12px] text-muted">{dateOf(payment.entryDate || payment.createdAt?.slice(0, 10))} · {accountName(payment.bankAccountId)}{payment.note ? ` · ${payment.note}` : ""}</div></div><span className="flex-shrink-0 font-semibold text-teal">{money(payment.amount)}</span></div>)}{payments.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-6 text-center text-sm text-muted">No payments recorded yet.</div>}</div></section>

      <section className="flex flex-col gap-4"><span className="text-[15px] font-semibold">Account ledger</span><div className="flex flex-col gap-2">{entries.map((entry) => { const credit = entry.entryType === "credit"; return <div key={entry.id} className="flex items-center justify-between gap-4 rounded-xl2 border border-border bg-surface px-4 py-3 text-[13px]"><div className="min-w-0"><div className="font-semibold">{credit ? "Paid to supplier" : "Purchase booked"}{entry.note ? ` · ${entry.note}` : ""}</div><div className="text-[11.5px] text-muted">{dateOf(entry.entryDate || entry.createdAt?.slice(0, 10))}{entry.receiptNo ? ` · ${credit ? "Payment" : "Receipt"} #${entry.receiptNo}` : ""} · {sourceLabel(entry.source)}</div></div><span className={`flex-shrink-0 font-semibold ${credit ? "text-teal" : "text-danger"}`}>{credit ? "-" : "+"}{money(entry.amount)}</span></div>; })}{entries.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-6 text-center text-sm text-muted">No ledger activity yet.</div>}</div></section>

      <Modal open={Boolean(editForm)} onClose={() => setEditForm(null)} title="Edit Supplier" width="max-w-[460px]">{editForm && <form onSubmit={handleEdit} className="flex flex-col gap-4"><Field label="Business Name" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} required /><Field label="Contact Person" value={editForm.contact} onChange={(event) => setEditForm({ ...editForm, contact: event.target.value })} /><Field label="Phone" value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} /><Field label="Address" value={editForm.address} onChange={(event) => setEditForm({ ...editForm, address: event.target.value })} /><button disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Saving..." : "Update Supplier"}</button></form>}</Modal>
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Supplier" width="max-w-[420px]"><div className="flex flex-col gap-4"><p className="text-sm text-ink-soft">Delete {supplier.name}? Suppliers with purchase or payment history cannot be deleted.</p>{deleteError && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-dark">{deleteError}</p>}<div className="flex gap-2.5"><button onClick={() => setDeleteOpen(false)} className="btn-ghost flex-1">Cancel</button><button onClick={handleDelete} disabled={saving} className="flex-1 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Deleting..." : "Delete"}</button></div></div></Modal>
    </div>
  );
}