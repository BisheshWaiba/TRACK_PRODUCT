import { useState } from "react";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { money } from "../../lib/format";
import { groupSalesByInvoice } from "../../lib/calculations";
import { useData } from "../../context/DataContext";

const TABS = ["All", "Paid", "Partial", "Pending"];

export default function Payments() {
  const { sales, invoices, payments, customerById, saleTotal, invoiceTotal, invoicePaidAmount, createPayment, updatePayment, loading } = useData();
  const [tab, setTab] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSaleId, setActiveSaleId] = useState(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [editPayment, setEditPayment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const rows = groupSalesByInvoice(sales, invoices).map((invoice) => {
    const paid = invoice.legacy ? payments.filter((p) => p.saleId === invoice.lines[0].id).reduce((sum, p) => sum + p.amount, 0) : invoicePaidAmount(invoice.id);
    return { ...invoice, total: invoice.legacy ? saleTotal(invoice.lines[0]) : invoiceTotal(invoice), paid, status: paid <= 0 ? "Pending" : paid < (invoice.legacy ? saleTotal(invoice.lines[0]) : invoiceTotal(invoice)) ? "Partial" : "Paid" };
  }).filter((invoice) => tab === "All" || invoice.status === tab);
  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
  const totalSales = rows.reduce((sum, invoice) => sum + invoice.total, 0);
  const partial = rows.filter((invoice) => invoice.status === "Partial").reduce((sum, invoice) => sum + invoice.paid, 0);
  const pending = totalSales - totalReceived;

  function latestPaymentFor(invoice) {
    return payments.filter((p) => invoice.invoiceId ? p.invoiceId === invoice.invoiceId : p.saleId === invoice.lines[0].id)[0] || null;
  }

  function openRecord(invoiceId) {
    setActiveSaleId(invoiceId);
    const invoice = rows.find((row) => row.id === invoiceId);
    setAmount(String(invoice.total - invoice.paid));
    setJustSaved(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setJustSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    const amt = Number(amount) || 0;
    if (amt <= 0 || !activeSaleId) return;
    setSaving(true);
    const invoice = rows.find((row) => row.id === activeSaleId);
    await createPayment({ invoiceId: invoice.invoiceId, saleId: invoice.legacy ? invoice.lines[0].id : null, amount: amt, method });
    setSaving(false);
    // Fully paid - nothing left to do, close. Still a balance (a partial
    // payment, or a follow-up on one) - stay open with what's left
    // pre-filled, so correcting or adding a second payment doesn't mean
    // reopening this and re-picking the sale.
    const remaining = activeSale.total - (activeSale.paid + amt);
    if (remaining <= 0) {
      setModalOpen(false);
    } else {
      setAmount(String(remaining));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 4000);
    }
  }

  function openEditPayment(invoiceId) {
    const invoice = rows.find((row) => row.id === invoiceId);
    const existing = latestPaymentFor(invoice);
    if (!existing) return;
    setEditPayment({ id: existing.id, invoiceId, amount: String(existing.amount), method: existing.method, date: existing.date });
  }

  async function handleEditPaymentSave(e) {
    e.preventDefault();
    setSaving(true);
    await updatePayment(editPayment.id, editPayment);
    setSaving(false);
    setEditPayment(null);
  }

  const activeSale = rows.find((invoice) => invoice.id === activeSaleId);
  const editSale = editPayment ? rows.find((invoice) => invoice.id === editPayment.invoiceId) : null;
  const editOtherPaid = editPayment && editSale ? editSale.paid - Number(latestPaymentFor(editSale)?.amount || 0) : 0;
  const editNewBalance = editSale ? editSale.total - editOtherPaid - (Number(editPayment?.amount) || 0) : 0;

  if (loading) return <div className="p-8 text-sm text-muted">Loading payments…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:gap-5 sm:grid-cols-3">
        <div className="card"><span className="text-xs font-semibold text-muted">TOTAL RECEIVED</span><div className="mt-1.5 font-display text-2xl font-bold text-teal">{money(totalReceived)}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">PARTIALLY PAID</span><div className="mt-1.5 font-display text-2xl font-bold text-slate">{money(partial)}</div></div>
        <div className="card border-danger/60 bg-danger-soft"><span className="text-xs font-semibold text-danger-dark">PENDING</span><div className="mt-1.5 font-display text-2xl font-bold text-danger-dark">{money(pending)}</div></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors ${tab === t ? "bg-ink text-white" : "bg-surface-2 hover:bg-border"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
        <div className="grid min-w-[960px] grid-cols-[0.8fr_1.2fr_0.8fr_1fr_1fr_1fr_1fr_1.1fr] gap-2 bg-surface-2 px-5 py-3.5 text-[10.5px] font-bold tracking-wide text-muted">
          <span>DATE</span><span>CUSTOMER</span><span>SALE REF</span><span>TOTAL</span><span>PAID</span><span>BALANCE</span><span>STATUS</span><span>ACTION</span>
        </div>
        {rows.map((s) => {
          const customer = customerById(s.customerId);
          const total = s.total;
          const paid = s.paid;
          const balance = total - paid;
          const status = s.status;
          return (
            <div key={s.id} className="grid min-w-[960px] grid-cols-[0.8fr_1.2fr_0.8fr_1fr_1fr_1fr_1fr_1.1fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg">
              <span className="text-ink-soft">{s.date}</span>
              <span>{customer?.name}</span>
              <span className="font-mono text-muted">{s.id}</span>
              <span>{money(total)}</span>
              <span className="font-semibold">{money(paid)}</span>
              <span className={balance > 0 ? "font-semibold text-danger" : ""}>{money(balance)}</span>
              <Badge tone={status === "Paid" ? "teal" : status === "Partial" ? "slate" : "accent"}>{status}</Badge>
              <div className="flex items-center gap-2">
                {paid > 0 && (
                  <button onClick={() => openEditPayment(s.id)} title="Edit payment" className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md hover:bg-surface-2">
                    <Icon name="edit" className="h-[13px] w-[13px] text-ink-soft" strokeWidth={1.7} />
                  </button>
                )}
                {balance > 0 && (
                  <button onClick={() => openRecord(s.id)} className="text-left text-[12.5px] font-semibold text-accent hover:underline">
                    {paid > 0 ? "Add More" : "Add Payment"}
                  </button>
                )}
                {paid === 0 && balance === 0 && <span className="text-muted">—</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {rows.map((s) => {
          const customer = customerById(s.customerId);
          const total = s.total;
          const paid = s.paid;
          const balance = total - paid;
          const status = s.status;
          return (
            <div key={s.id} className="flex flex-col gap-2 rounded-xl2 border border-border bg-surface p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{customer?.name}</div>
                  <div className="text-[12px] text-muted">{s.date} · <span className="font-mono">{s.id}</span></div>
                </div>
                <Badge tone={status === "Paid" ? "teal" : status === "Partial" ? "slate" : "accent"}>{status}</Badge>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted">{money(total)} total · <span className="font-semibold text-ink">{money(paid)} paid</span></span>
                {balance > 0 && <span className="font-semibold text-danger">{money(balance)} due</span>}
              </div>
              <div className="flex items-center gap-3 border-t border-border pt-2.5">
                {paid > 0 && (
                  <button onClick={() => openEditPayment(s.id)} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-soft">
                    <Icon name="edit" className="h-[12px] w-[12px]" strokeWidth={1.7} />
                    Edit Payment
                  </button>
                )}
                {balance > 0 && (
                  <button onClick={() => openRecord(s.id)} className="text-[12.5px] font-semibold text-accent">
                    {paid > 0 ? "Add More" : "Add Payment"}
                  </button>
                )}
                {paid === 0 && balance === 0 && <span className="text-[12.5px] text-muted">Nothing due</span>}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-8 text-center text-sm text-muted">No matching sales.</div>}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title="Record Payment">
        {activeSale && (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {justSaved && (
              <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-teal bg-teal-soft px-3.5 py-2.5 text-[13px] font-semibold text-teal">
                <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
                Payment saved — balance still due is pre-filled below.
              </div>
            )}
            <Field label="Customer / Sale Reference" disabled value={`${customerById(activeSale.customerId)?.name} — ${activeSale.id}`} />
            <div className="flex flex-col gap-3.5 rounded-xl bg-surface-2 p-4 sm:flex-row">
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-muted">TOTAL AMOUNT</div>
                <div className="mt-0.5 text-[15px] font-bold">{money(activeSale.total)}</div>
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-muted">ALREADY PAID</div>
                <div className="mt-0.5 text-[15px] font-bold">{money(activeSale.paid)}</div>
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-accent-text">BALANCE DUE</div>
                <div className="mt-0.5 text-[15px] font-bold text-accent-text">{money(activeSale.total - activeSale.paid)}</div>
              </div>
            </div>
            <div className="flex flex-col gap-3.5 sm:flex-row">
              <Field label="Amount Received" className="flex-1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              <label className="flex flex-1 flex-col gap-2">
                <span className="text-[13px] font-semibold">Method</span>
                <select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option>Bank Transfer</option>
                  <option>Cash on Delivery</option>
                  <option>Digital Wallet</option>
                </select>
              </label>
            </div>
            <div className="flex gap-2.5">
              <button type="button" onClick={closeModal} className="btn-ghost flex-1">{justSaved ? "Done" : "Cancel"}</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save Payment"}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!editPayment} onClose={() => setEditPayment(null)} title="Edit Payment">
        {editPayment && editSale && (
          <form onSubmit={handleEditPaymentSave} className="flex flex-col gap-4">
            <Field label="Customer / Sale Reference" disabled value={`${customerById(editSale.customerId)?.name} — ${editSale.id}`} />
            <div className="flex flex-col gap-3.5 rounded-xl bg-surface-2 p-4 sm:flex-row">
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-muted">TOTAL AMOUNT</div>
                <div className="mt-0.5 text-[15px] font-bold">{money(editSale.total)}</div>
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-accent-text">NEW BALANCE</div>
                <div className={`mt-0.5 text-[15px] font-bold ${editNewBalance > 0 ? "text-accent-text" : "text-teal"}`}>{money(Math.max(editNewBalance, 0))}</div>
              </div>
            </div>
            <div className="flex flex-col gap-3.5 sm:flex-row">
              <Field label="Amount Paid" className="flex-1" value={editPayment.amount} onChange={(e) => setEditPayment({ ...editPayment, amount: e.target.value })} required />
              <label className="flex flex-1 flex-col gap-2">
                <span className="text-[13px] font-semibold">Method</span>
                <select className="field" value={editPayment.method} onChange={(e) => setEditPayment({ ...editPayment, method: e.target.value })}>
                  <option>Bank Transfer</option>
                  <option>Cash on Delivery</option>
                  <option>Digital Wallet</option>
                </select>
              </label>
            </div>
            <Field label="Date" type="date" value={editPayment.date} onChange={(e) => setEditPayment({ ...editPayment, date: e.target.value })} required />
            <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-muted">
              <Icon name="check" className="h-3.5 w-3.5 text-teal" strokeWidth={2} />
              {editNewBalance <= 0 ? "This will mark the sale as fully Paid." : `Sale will show as Partial with ${money(editNewBalance)} still due.`}
            </div>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setEditPayment(null)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
