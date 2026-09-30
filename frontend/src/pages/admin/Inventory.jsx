import { useState } from "react";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { useData } from "../../context/DataContext";

export default function Inventory() {
  const { products, stockMovements: movements, productById, dashboardTotals, stockStatus, createStockMovement, loading } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", type: "in", qty: "", reference: "" });
  const [saving, setSaving] = useState(false);

  const totals = dashboardTotals();
  const today = new Date().toISOString().slice(0, 10);

  function openModal() {
    setForm({ productId: products[0]?.id || "", type: "in", qty: "", reference: "" });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    const qty = Number(form.qty) || 0;
    if (qty <= 0) return;
    setSaving(true);
    await createStockMovement(form);
    setSaving(false);
    setModalOpen(false);
  }

  if (loading) return <div className="p-8 text-sm text-muted">Loading inventory…</div>;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex justify-end">
        <button onClick={openModal} className="btn-primary">
          <Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} />
          Record Stock Movement
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <div className="card"><span className="text-xs font-semibold text-muted">TOTAL STOCK</span><div className="mt-1.5 font-display text-2xl font-bold">{totals.totalStock}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">AVAILABLE</span><div className="mt-1.5 font-display text-2xl font-bold text-teal">{totals.totalAvailable}</div></div>
        <div className="card border-danger/60 bg-danger-soft"><span className="text-xs font-semibold text-danger-dark">LOW STOCK</span><div className="mt-1.5 font-display text-2xl font-bold text-danger-dark">{totals.lowStock}</div></div>
        <div className="card border-ink/60"><span className="text-xs font-semibold text-muted">OUT OF STOCK</span><div className="mt-1.5 font-display text-2xl font-bold">{totals.outOfStock}</div></div>
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-[15px] font-semibold">Current stock levels</span>
        <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
          <div className="grid min-w-[700px] grid-cols-[2fr_1fr_1fr_1.4fr_1fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11.5px] font-bold tracking-wide text-muted">
            <span>PRODUCT</span><span>AVAILABLE</span><span>REORDER AT</span><span>LEVEL</span><span>STATUS</span>
          </div>
          {products.map((p) => {
            const available = p.stockTotal - p.stockTaken;
            const status = stockStatus(p);
            return (
              <div key={p.id} className="grid min-w-[700px] grid-cols-[2fr_1fr_1fr_1.4fr_1fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13.5px] hover:bg-bg">
                <span className="font-semibold">{p.name}</span>
                <span className={available <= p.reorderAt ? "font-semibold text-danger" : "font-semibold text-teal"}>{available}</span>
                <span className="text-muted">{p.reorderAt}</span>
                <ProgressBar percent={(available / p.stockTotal) * 100} tone={status.tone === "danger" ? "danger" : status.tone === "ink" ? "ink" : "teal"} />
                <Badge tone={status.tone === "danger" ? "danger" : status.tone === "ink" ? "ink" : status.tone === "accent" ? "accent" : "teal"}>{status.label}</Badge>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 sm:hidden">
          {products.map((p) => {
            const available = p.stockTotal - p.stockTaken;
            const status = stockStatus(p);
            return (
              <div key={p.id} className="flex flex-col gap-2.5 rounded-xl2 border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{p.name}</span>
                  <Badge tone={status.tone === "danger" ? "danger" : status.tone === "ink" ? "ink" : status.tone === "accent" ? "accent" : "teal"}>{status.label}</Badge>
                </div>
                <ProgressBar percent={(available / p.stockTotal) * 100} tone={status.tone === "danger" ? "danger" : status.tone === "ink" ? "ink" : "teal"} />
                <div className="flex items-center justify-between text-[12.5px] text-muted">
                  <span className={available <= p.reorderAt ? "font-semibold text-danger" : "font-semibold text-teal"}>{available} available</span>
                  <span>Reorder at {p.reorderAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-[15px] font-semibold">Recent stock movements</span>
        <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
          <div className="grid min-w-[700px] grid-cols-[1fr_1.8fr_0.9fr_0.7fr_1.4fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11.5px] font-bold tracking-wide text-muted">
            <span>DATE</span><span>PRODUCT</span><span>TYPE</span><span>QTY</span><span>REFERENCE</span>
          </div>
          {movements.map((m) => {
            const product = productById(m.productId);
            return (
              <div key={m.id} className="grid min-w-[700px] grid-cols-[1fr_1.8fr_0.9fr_0.7fr_1.4fr] items-center gap-2 border-t border-border px-5 py-3 text-[13px] hover:bg-bg">
                <span className="text-ink-soft">{m.date}</span>
                <span>{product?.name}</span>
                <Badge tone={m.type === "in" ? "teal" : "accent"} icon={<Icon name={m.type === "in" ? "arrowDown" : "arrowUp"} className="h-[11px] w-[11px]" strokeWidth={2.2} />}>
                  {m.type === "in" ? "In" : "Out"}
                </Badge>
                <span>{m.type === "in" ? "+" : "-"}{m.qty}</span>
                <span className="text-muted">{m.reference}</span>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-2.5 sm:hidden">
          {movements.map((m) => {
            const product = productById(m.productId);
            return (
              <div key={m.id} className="flex flex-col gap-1.5 rounded-xl2 border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{product?.name}</span>
                  <Badge tone={m.type === "in" ? "teal" : "accent"} icon={<Icon name={m.type === "in" ? "arrowDown" : "arrowUp"} className="h-[11px] w-[11px]" strokeWidth={2.2} />}>
                    {m.type === "in" ? "In" : "Out"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[12.5px] text-muted">
                  <span>{m.date} · {m.reference}</span>
                  <span className="font-semibold text-ink">{m.type === "in" ? "+" : "-"}{m.qty}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Stock Movement">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold">Product</span>
            <select className="field" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setForm({ ...form, type: "in" })} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-3 text-[13.5px] font-semibold ${form.type === "in" ? "border-[1.5px] border-teal bg-teal-soft text-teal" : "border-border"}`}>
              <Icon name="arrowDown" className="h-3.5 w-3.5" strokeWidth={2.2} />
              Stock In
            </button>
            <button type="button" onClick={() => setForm({ ...form, type: "out" })} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-3 text-[13.5px] font-semibold ${form.type === "out" ? "border-[1.5px] border-accent bg-accent-soft text-accent-text" : "border-border"}`}>
              <Icon name="arrowUp" className="h-3.5 w-3.5" strokeWidth={2.2} />
              Stock Out
            </button>
          </div>
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Field label="Quantity" placeholder="100" className="flex-1" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} required />
            <Field label="Date" defaultValue={today} type="date" className="flex-1" />
          </div>
          <Field label="Reference / Reason" placeholder="Supplier restock #RS-119" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save Movement"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
