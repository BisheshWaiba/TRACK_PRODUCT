import { useState } from "react";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { money } from "../../lib/format";
import { useData } from "../../context/DataContext";

const TABS = ["All Sales", "Paid", "Partial", "Pending"];

export default function Sales() {
  const { sales, products, customers, customerById, productById, saleTotal, salePaymentStatus, createSale, loading } = useData();
  const [tab, setTab] = useState("All Sales");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ customerId: "", productId: "", qty: 1, status: "Paid", partialAmount: "" });
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const shown = sales.filter((s) => tab === "All Sales" || salePaymentStatus(s) === tab);
  const product = productById(form.productId);
  const total = product ? product.price * form.qty : 0;
  const available = product ? product.stockTotal - product.stockTaken : 0;

  function openModal() {
    setForm({ customerId: customers[0]?.id || "", productId: products[0]?.id || "", qty: 1, status: "Paid", partialAmount: "" });
    setJustSaved(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setJustSaved(false);
  }

  function pickStatus(s) {
    setForm({ ...form, status: s, partialAmount: s === "Partial" && !form.partialAmount ? String(Math.round(total / 2)) : form.partialAmount });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await createSale({ customerId: form.customerId, productId: form.productId, qty: form.qty, paymentStatus: form.status, partialAmount: form.partialAmount });
    setSaving(false);
    // Stays open - ringing up several orders in a row shouldn't mean
    // reopening this every time. Payment status carries over (most walk-ins
    // in a session pay the same way); customer/product/qty reset since the
    // next sale is rarely the same one.
    setForm((f) => ({ customerId: customers[0]?.id || "", productId: products[0]?.id || "", qty: 1, status: f.status, partialAmount: "" }));
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 4000);
  }

  if (loading) return <div className="p-8 text-sm text-muted">Loading sales…</div>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button onClick={openModal} className="btn-primary">
          <Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} />
          Record New Sale
        </button>
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
        <div className="grid min-w-[900px] grid-cols-[0.9fr_1.3fr_1.6fr_0.6fr_1fr_1fr_1fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11px] font-bold tracking-wide text-muted">
          <span>DATE</span><span>CUSTOMER</span><span>PRODUCT</span><span>QTY</span><span>TOTAL</span><span>PAYMENT</span><span>REF #</span>
        </div>
        {shown.map((s) => {
          const customer = customerById(s.customerId);
          const product = productById(s.productId);
          const status = salePaymentStatus(s);
          return (
            <div key={s.id} className="grid min-w-[900px] grid-cols-[0.9fr_1.3fr_1.6fr_0.6fr_1fr_1fr_1fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg">
              <span className="text-ink-soft">{s.date}</span>
              <span>{customer?.name}</span>
              <span>{product?.name}</span>
              <span>{s.qty}</span>
              <span className="font-semibold">{money(saleTotal(s))}</span>
              <Badge tone={status === "Paid" ? "teal" : status === "Partial" ? "slate" : "accent"}>{status}</Badge>
              <span className="font-mono text-muted">{s.id}</span>
            </div>
          );
        })}
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {shown.map((s) => {
          const customer = customerById(s.customerId);
          const product = productById(s.productId);
          const status = salePaymentStatus(s);
          return (
            <div key={s.id} className="flex flex-col gap-2 rounded-xl2 border border-border bg-surface p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{customer?.name}</div>
                  <div className="text-[12.5px] text-muted">{product?.name} × {s.qty}</div>
                </div>
                <Badge tone={status === "Paid" ? "teal" : status === "Partial" ? "slate" : "accent"}>{status}</Badge>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-muted">{s.date} · <span className="font-mono">{s.id}</span></span>
                <span className="font-semibold text-ink">{money(saleTotal(s))}</span>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-8 text-center text-sm text-muted">No sales match.</div>}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title="Record New Sale" width="max-w-[500px]">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {justSaved && (
            <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-teal bg-teal-soft px-3.5 py-2.5 text-[13px] font-semibold text-teal">
              <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
              Sale saved — add another below, or close when done.
            </div>
          )}
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold">Customer</span>
            <select className="field" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold">Product</span>
            <select className="field" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              {products.map((p) => {
                const avail = p.stockTotal - p.stockTaken;
                return <option key={p.id} value={p.id} disabled={avail <= 0}>{p.name} — {money(p.price)} ({avail} available)</option>;
              })}
            </select>
          </label>
          <div className="flex items-end gap-3.5">
            <label className="flex flex-1 flex-col gap-2">
              <span className="text-[13px] font-semibold">Quantity</span>
              <div className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                <button type="button" onClick={() => setForm({ ...form, qty: Math.max(1, form.qty - 1) })} className="flex h-6 w-6 items-center justify-center rounded-md text-base font-semibold hover:bg-surface-2">–</button>
                <span className="flex-1 text-center text-sm font-semibold">{form.qty}</span>
                <button type="button" onClick={() => setForm({ ...form, qty: Math.min(available, form.qty + 1) })} className="flex h-6 w-6 items-center justify-center rounded-md text-base font-semibold hover:bg-surface-2">+</button>
              </div>
            </label>
            <div className="flex-[1.4] rounded-lg bg-surface-2 px-3.5 py-3">
              <div className="text-[11px] font-semibold text-muted">TOTAL (AUTO-CALCULATED)</div>
              <div className="mt-0.5 font-display text-lg font-bold">{money(total)}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold">Payment Status</span>
            <div className="flex gap-2.5">
              {["Paid", "Partial", "Pending"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => pickStatus(s)}
                  className={`flex-1 rounded-lg border py-2.5 text-[13px] font-semibold ${
                    form.status === s ? "border-[1.5px] border-teal bg-teal-soft text-teal" : "border-border"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {form.status === "Partial" && (
            <Field
              label="Amount Paid Now"
              value={form.partialAmount}
              onChange={(e) => setForm({ ...form, partialAmount: e.target.value })}
              required
            />
          )}
          <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-muted">
            <Icon name="check" className="h-3.5 w-3.5 text-teal" strokeWidth={2} />
            Inventory will update automatically — {Math.max(available - form.qty, 0)} units will remain after this sale.
          </div>
          <div className="flex gap-2.5">
            <button type="button" onClick={closeModal} className="btn-ghost flex-1">Done</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save & Add Another"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
