import { useState } from "react";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import {
  sales,
  payments as initialPayments,
  customerById,
  saleTotal,
  money,
} from "../../data/mockData";

const TABS = ["All", "Paid", "Partial", "Pending"];

export default function Payments() {
  const [payments, setPayments] = useState(initialPayments);
  const [tab, setTab] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSaleId, setActiveSaleId] = useState(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");

  function paidFor(saleId) {
    return payments.filter((p) => p.saleId === saleId).reduce((s, p) => s + p.amount, 0);
  }
  function statusFor(sale) {
    const paid = paidFor(sale.id);
    const total = saleTotal(sale);
    if (paid <= 0) return "Pending";
    if (paid < total) return "Partial";
    return "Paid";
  }

  const rows = sales.filter((s) => tab === "All" || statusFor(s) === tab);
  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
  const totalSales = sales.reduce((s, sale) => s + saleTotal(sale), 0);
  const partial = sales.filter((s) => statusFor(s) === "Partial").reduce((s, sale) => s + paidFor(sale.id), 0);
  const pending = totalSales - totalReceived;

  function openRecord(saleId) {
    setActiveSaleId(saleId);
    const sale = sales.find((s) => s.id === saleId);
    setAmount(String(saleTotal(sale) - paidFor(saleId)));
    setModalOpen(true);
  }

  function handleSave(e) {
    e.preventDefault();
    const amt = Number(amount) || 0;
    if (amt > 0 && activeSaleId) {
      setPayments((prev) => [...prev, { id: "PM-" + Date.now(), date: new Date().toISOString().slice(0, 10), saleId: activeSaleId, amount: amt, method }]);
    }
    setModalOpen(false);
  }

  const activeSale = sales.find((s) => s.id === activeSaleId);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card"><span className="text-xs font-semibold text-muted">TOTAL RECEIVED</span><div className="mt-1.5 font-display text-2xl font-bold text-teal">{money(totalReceived)}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">PARTIALLY PAID</span><div className="mt-1.5 font-display text-2xl font-bold text-slate">{money(partial)}</div></div>
        <div className="card border-danger/60 bg-danger-soft"><span className="text-xs font-semibold text-danger-dark">PENDING</span><div className="mt-1.5 font-display text-2xl font-bold text-danger-dark">{money(pending)}</div></div>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4.5 py-2 text-[13.5px] font-semibold transition-colors ${tab === t ? "bg-ink text-white" : "bg-surface-2 hover:bg-border"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-border bg-surface">
        <div className="grid min-w-[900px] grid-cols-[0.8fr_1.3fr_0.8fr_1fr_1fr_1fr_1fr_0.9fr] gap-2 bg-surface-2 px-5 py-3.5 text-[10.5px] font-bold tracking-wide text-muted">
          <span>DATE</span><span>CUSTOMER</span><span>SALE REF</span><span>TOTAL</span><span>PAID</span><span>BALANCE</span><span>STATUS</span><span>ACTION</span>
        </div>
        {rows.map((s) => {
          const customer = customerById(s.customerId);
          const total = saleTotal(s);
          const paid = paidFor(s.id);
          const balance = total - paid;
          const status = statusFor(s);
          return (
            <div key={s.id} className="grid min-w-[900px] grid-cols-[0.8fr_1.3fr_0.8fr_1fr_1fr_1fr_1fr_0.9fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg">
              <span className="text-ink-soft">{s.date}</span>
              <span>{customer?.name}</span>
              <span className="font-mono text-muted">{s.id}</span>
              <span>{money(total)}</span>
              <span className="font-semibold">{money(paid)}</span>
              <span className={balance > 0 ? "font-semibold text-danger" : ""}>{money(balance)}</span>
              <Badge tone={status === "Paid" ? "teal" : status === "Partial" ? "slate" : "accent"}>{status}</Badge>
              {balance > 0 ? (
                <button onClick={() => openRecord(s.id)} className="text-left font-semibold text-accent hover:underline">
                  Add Payment
                </button>
              ) : (
                <span className="text-muted">—</span>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment">
        {activeSale && (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Field label="Customer / Sale Reference" disabled value={`${customerById(activeSale.customerId)?.name} — ${activeSale.id}`} />
            <div className="flex gap-3.5 rounded-xl bg-surface-2 p-4">
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-muted">TOTAL AMOUNT</div>
                <div className="mt-0.5 text-[15px] font-bold">{money(saleTotal(activeSale))}</div>
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-muted">ALREADY PAID</div>
                <div className="mt-0.5 text-[15px] font-bold">{money(paidFor(activeSale.id))}</div>
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-accent-text">BALANCE DUE</div>
                <div className="mt-0.5 text-[15px] font-bold text-accent-text">{money(saleTotal(activeSale) - paidFor(activeSale.id))}</div>
              </div>
            </div>
            <div className="flex gap-3.5">
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
              <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Save Payment</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
