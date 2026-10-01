import { useState } from "react";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { money } from "../../lib/format";
import { groupSalesByInvoice } from "../../lib/calculations";
import { useData } from "../../context/DataContext";

const TABS = ["All Sales", "Paid", "Partial", "Pending"];
const blankLine = (productId = "") => ({ productId, qty: 1 });

function tone(status) {
  return status === "Paid" ? "teal" : status === "Partial" ? "slate" : "accent";
}

export default function Sales() {
  const { sales, invoices, products, customers, customerById, productById, saleTotal, salePaidAmount, salePaymentStatus, invoiceTotal, invoicePaidAmount, invoicePaymentStatus, createInvoice, loading } = useData();
  const [tab, setTab] = useState("All Sales");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ customerId: "", lines: [blankLine()], discountAmount: "", vatAmount: "", status: "Paid", partialAmount: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const groups = groupSalesByInvoice(sales, invoices).map((invoice) => ({
    ...invoice,
    total: invoice.legacy ? saleTotal(invoice.lines[0]) : invoiceTotal(invoice),
    paid: invoice.legacy ? salePaidAmount(invoice.lines[0].id) : invoicePaidAmount(invoice.id),
    status: invoice.legacy ? salePaymentStatus(invoice.lines[0]) : invoicePaymentStatus(invoice),
  }));
  const shown = groups.filter((invoice) => tab === "All Sales" || invoice.status === tab);
  const subtotal = form.lines.reduce((sum, line) => {
    const product = productById(line.productId);
    return sum + (product ? product.price * (Number(line.qty) || 0) : 0);
  }, 0);
  const total = Math.max(0, subtotal - (Number(form.discountAmount) || 0) + (Number(form.vatAmount) || 0));

  function openModal() {
    setForm({ customerId: customers[0]?.id || "", lines: [blankLine(products[0]?.id || "")], discountAmount: "", vatAmount: "", status: "Paid", partialAmount: "" });
    setError("");
    setModalOpen(true);
  }
  function updateLine(index, patch) {
    setForm((current) => ({ ...current, lines: current.lines.map((line, i) => i === index ? { ...line, ...patch } : line) }));
  }
  function pickStatus(status) {
    setForm((current) => ({ ...current, status, partialAmount: status === "Partial" && !current.partialAmount ? String(Math.round(total / 2)) : current.partialAmount }));
  }
  async function handleSave(event) {
    event.preventDefault();
    setError("");
    const partial = Number(form.partialAmount) || 0;
    if (form.status === "Partial" && (partial <= 0 || partial > total)) {
      setError("Partial payment must be greater than zero and no more than the final total.");
      return;
    }
    setSaving(true);
    try {
      await createInvoice({ customerId: form.customerId, lines: form.lines, discountAmount: form.discountAmount, vatAmount: form.vatAmount, paymentStatus: form.status, partialAmount: form.partialAmount });
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Could not save invoice.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted">Loading sales...</div>;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end"><button onClick={openModal} className="btn-primary"><Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} />Record New Invoice</button></div>
      <div className="flex flex-wrap gap-2">{TABS.map((tabName) => <button key={tabName} onClick={() => setTab(tabName)} className={`rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors ${tab === tabName ? "bg-ink text-white" : "bg-surface-2 hover:bg-border"}`}>{tabName}</button>)}</div>
      <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
        <div className="grid min-w-[900px] grid-cols-[0.9fr_1.3fr_1.5fr_0.7fr_1fr_1fr_1fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11px] font-bold tracking-wide text-muted"><span>DATE</span><span>CUSTOMER</span><span>INVOICE</span><span>LINES</span><span>TOTAL</span><span>PAID</span><span>STATUS</span></div>
        {shown.map((invoice) => <div key={invoice.id} className="grid min-w-[900px] grid-cols-[0.9fr_1.3fr_1.5fr_0.7fr_1fr_1fr_1fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg"><span className="text-ink-soft">{invoice.date}</span><span>{customerById(invoice.customerId)?.name}</span><span className="font-mono text-muted">{invoice.id}</span><span>{invoice.lines.length}</span><span className="font-semibold">{money(invoice.total)}</span><span>{money(invoice.paid)}</span><Badge tone={tone(invoice.status)}>{invoice.status}</Badge></div>)}
      </div>
      <div className="flex flex-col gap-2 sm:hidden">{shown.map((invoice) => <div key={invoice.id} className="flex flex-col gap-2 rounded-xl2 border border-border bg-surface p-3"><div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{customerById(invoice.customerId)?.name}</div><div className="text-[12px] text-muted">{invoice.date} · <span className="font-mono">{invoice.id}</span></div></div><Badge tone={tone(invoice.status)}>{invoice.status}</Badge></div><div className="flex items-center justify-between text-[12.5px]"><span className="text-muted">{invoice.lines.length} line{invoice.lines.length === 1 ? "" : "s"}</span><span className="font-semibold">{money(invoice.total)} total · {money(invoice.paid)} paid</span></div></div>)}{shown.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-8 text-center text-sm text-muted">No invoices match.</div>}</div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record New Invoice" width="max-w-[600px]">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {error && <div className="rounded-lg border-[1.5px] border-danger bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger-dark">{error}</div>}
          <label className="flex flex-col gap-2"><span className="text-[13px] font-semibold">Customer</span><select className="field" value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
          <div className="flex flex-col gap-2"><div className="flex items-center justify-between"><span className="text-[13px] font-semibold">Products</span><button type="button" onClick={() => setForm({ ...form, lines: [...form.lines, blankLine(products[0]?.id || "")] })} className="text-[12.5px] font-semibold text-accent">+ Add product</button></div>
            {form.lines.map((line, index) => { const product = productById(line.productId); const available = product ? product.stockTotal - product.stockTaken : 0; return <div key={index} className="flex items-end gap-2 rounded-lg border border-border p-2.5"><label className="flex min-w-0 flex-1 flex-col gap-1.5"><span className="text-[11px] font-semibold text-muted">PRODUCT</span><select className="field" value={line.productId} onChange={(event) => updateLine(index, { productId: event.target.value })}>{products.map((option) => <option key={option.id} value={option.id}>{option.name} ({Math.max(0, option.stockTotal - option.stockTaken)} available)</option>)}</select></label><label className="flex w-20 flex-shrink-0 flex-col gap-1.5"><span className="text-[11px] font-semibold text-muted">QTY</span><input className="field" type="number" min="1" max={available || undefined} value={line.qty} onChange={(event) => updateLine(index, { qty: event.target.value })} /></label><div className="w-24 flex-shrink-0 pb-2 text-right text-[12px]">{product ? money(product.price * (Number(line.qty) || 0)) : money(0)}</div>{form.lines.length > 1 && <button type="button" title="Remove product" onClick={() => setForm({ ...form, lines: form.lines.filter((_, i) => i !== index) })} className="mb-1 flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2"><Icon name="trash" className="h-4 w-4 text-danger" strokeWidth={1.7} /></button>}</div>; })}
          </div>
          <div className="grid grid-cols-2 gap-3"><Field label="Discount" type="number" min="0" value={form.discountAmount} onChange={(event) => setForm({ ...form, discountAmount: event.target.value })} /><Field label="VAT" type="number" min="0" value={form.vatAmount} onChange={(event) => setForm({ ...form, vatAmount: event.target.value })} /></div>
          <div className="rounded-lg bg-surface-2 px-3.5 py-3 text-right"><div className="text-[11px] font-semibold text-muted">SUBTOTAL {money(subtotal)}</div><div className="mt-0.5 font-display text-xl font-bold">{money(total)}</div></div>
          <div className="flex flex-col gap-2"><span className="text-[13px] font-semibold">Payment Status</span><div className="flex gap-2.5">{["Paid", "Partial", "Pending"].map((status) => <button key={status} type="button" onClick={() => pickStatus(status)} className={`flex-1 rounded-lg border py-2.5 text-[13px] font-semibold ${form.status === status ? "border-[1.5px] border-teal bg-teal-soft text-teal" : "border-border"}`}>{status}</button>)}</div></div>
          {form.status === "Partial" && <Field label="Amount Paid Now" type="number" min="0.01" max={total} value={form.partialAmount} onChange={(event) => setForm({ ...form, partialAmount: event.target.value })} required />}
          <div className="flex gap-2.5"><button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancel</button><button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving..." : "Save Invoice"}</button></div>
        </form>
      </Modal>
    </div>
  );
}/* import { useState } from "react";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { money } from "../../lib/format";
import { groupSalesByInvoice } from "../../lib/calculations";
import { useData } from "../../context/DataContext";

const TABS = ["All Sales", "Paid", "Partial", "Pending"];
const blankLine = (productId = "") => ({ productId, qty: 1 });

function tone(status) {
  return status === "Paid" ? "teal" : status === "Partial" ? "slate" : "accent";
}

export default function Sales() {
  const { sales, invoices, products, customers, customerById, productById, saleTotal, invoiceTotal, invoicePaidAmount, invoicePaymentStatus, createInvoice, loading } = useData();
  const [tab, setTab] = useState("All Sales");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ customerId: "", lines: [blankLine()], discountAmount: "", vatAmount: "", status: "Paid", partialAmount: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const groups = groupSalesByInvoice(sales, invoices).map((invoice) => ({
    ...invoice,
    total: invoice.legacy ? saleTotal(invoice.lines[0]) : invoiceTotal(invoice),
    paid: invoice.legacy ? 0 : invoicePaidAmount(invoice.id),
    status: invoice.legacy ? "Pending" : invoicePaymentStatus(invoice),
  }));
  const shown = groups.filter((invoice) => tab === "All Sales" || invoice.status === tab);

  const subtotal = form.lines.reduce((sum, line) => {
    const product = productById(line.productId);
    return sum + (product ? product.price * (Number(line.qty) || 0) : 0);
  }, 0);
  const total = Math.max(0, subtotal - (Number(form.discountAmount) || 0) + (Number(form.vatAmount) || 0));

  function openModal() {
    setForm({ customerId: customers[0]?.id || "", lines: [blankLine(products[0]?.id || "")], discountAmount: "", vatAmount: "", status: "Paid", partialAmount: "" });
    setError("");
    setModalOpen(true);
  }

  function updateLine(index, patch) {
    setForm((current) => ({ ...current, lines: current.lines.map((line, i) => i === index ? { ...line, ...patch } : line) }));
  }

  function pickStatus(status) {
    setForm((current) => ({ ...current, status, partialAmount: status === "Partial" && !current.partialAmount ? String(Math.round(total / 2)) : current.partialAmount }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    const partial = Number(form.partialAmount) || 0;
    if (form.status === "Partial" && (partial <= 0 || partial > total)) {
      setError("Partial payment must be greater than zero and no more than the final total.");
      return;
    }
    setSaving(true);
    try {
      await createInvoice({ customerId: form.customerId, lines: form.lines, discountAmount: form.discountAmount, vatAmount: form.vatAmount, paymentStatus: form.status, partialAmount: form.partialAmount });
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Could not save invoice.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted">Loading sales...</div>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end"><button onClick={openModal} className="btn-primary"><Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} />Record New Invoice</button></div>
      <div className="flex flex-wrap gap-2">{TABS.map((tabName) => <button key={tabName} onClick={() => setTab(tabName)} className={`rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors ${tab === tabName ? "bg-ink text-white" : "bg-surface-2 hover:bg-border"}`}>{tabName}</button>)}</div>

      <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
        <div className="grid min-w-[900px] grid-cols-[0.9fr_1.3fr_1.5fr_0.7fr_1fr_1fr_1fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11px] font-bold tracking-wide text-muted"><span>DATE</span><span>CUSTOMER</span><span>INVOICE</span><span>LINES</span><span>TOTAL</span><span>PAID</span><span>STATUS</span></div>
        {shown.map((invoice) => <div key={invoice.id} className="grid min-w-[900px] grid-cols-[0.9fr_1.3fr_1.5fr_0.7fr_1fr_1fr_1fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg"><span className="text-ink-soft">{invoice.date}</span><span>{customerById(invoice.customerId)?.name}</span><span className="font-mono text-muted">{invoice.id}</span><span>{invoice.lines.length}</span><span className="font-semibold">{money(invoice.total)}</span><span>{money(invoice.paid)}</span><Badge tone={tone(invoice.status)}>{invoice.status}</Badge></div>)}
      </div>

      <div className="flex flex-col gap-2 sm:hidden">{shown.map((invoice) => <div key={invoice.id} className="flex flex-col gap-2 rounded-xl2 border border-border bg-surface p-3"><div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{customerById(invoice.customerId)?.name}</div><div className="text-[12px] text-muted">{invoice.date} · <span className="font-mono">{invoice.id}</span></div></div><Badge tone={tone(invoice.status)}>{invoice.status}</Badge></div><div className="flex items-center justify-between text-[12.5px]"><span className="text-muted">{invoice.lines.length} line{invoice.lines.length === 1 ? "" : "s"}</span><span className="font-semibold">{money(invoice.total)} total · {money(invoice.paid)} paid</span></div></div>)}{shown.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-8 text-center text-sm text-muted">No invoices match.</div>}</div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record New Invoice" width="max-w-[600px]">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {error && <div className="rounded-lg border-[1.5px] border-danger bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger-dark">{error}</div>}
          <label className="flex flex-col gap-2"><span className="text-[13px] font-semibold">Customer</span><select className="field" value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
          <div className="flex flex-col gap-2"><div className="flex items-center justify-between"><span className="text-[13px] font-semibold">Products</span><button type="button" onClick={() => setForm({ ...form, lines: [...form.lines, blankLine(products[0]?.id || "")] })} className="text-[12.5px] font-semibold text-accent">+ Add product</button></div>
            {form.lines.map((line, index) => { const product = productById(line.productId); const available = product ? product.stockTotal - product.stockTaken : 0; return <div key={index} className="flex items-end gap-2 rounded-lg border border-border p-2.5"><label className="flex min-w-0 flex-1 flex-col gap-1.5"><span className="text-[11px] font-semibold text-muted">PRODUCT</span><select className="field" value={line.productId} onChange={(event) => updateLine(index, { productId: event.target.value })}>{products.map((option) => <option key={option.id} value={option.id}>{option.name} ({Math.max(0, option.stockTotal - option.stockTaken)} available)</option>)}</select></label><label className="flex w-20 flex-shrink-0 flex-col gap-1.5"><span className="text-[11px] font-semibold text-muted">QTY</span><input className="field" type="number" min="1" max={available || undefined} value={line.qty} onChange={(event) => updateLine(index, { qty: event.target.value })} /></label><div className="w-24 flex-shrink-0 pb-2 text-right text-[12px]">{product ? money(product.price * (Number(line.qty) || 0)) : money(0)}</div>{form.lines.length > 1 && <button type="button" title="Remove product" onClick={() => setForm({ ...form, lines: form.lines.filter((_, i) => i !== index) })} className="mb-1 flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2"><Icon name="trash" className="h-4 w-4 text-danger" strokeWidth={1.7} /></button>}</div>; })}
          </div>
          <div className="grid grid-cols-2 gap-3"><Field label="Discount" type="number" min="0" value={form.discountAmount} onChange={(event) => setForm({ ...form, discountAmount: event.target.value })} /><Field label="VAT" type="number" min="0" value={form.vatAmount} onChange={(event) => setForm({ ...form, vatAmount: event.target.value })} /></div>
          <div className="rounded-lg bg-surface-2 px-3.5 py-3 text-right"><div className="text-[11px] font-semibold text-muted">SUBTOTAL {money(subtotal)}</div><div className="mt-0.5 font-display text-xl font-bold">{money(total)}</div></div>
          <div className="flex flex-col gap-2"><span className="text-[13px] font-semibold">Payment Status</span><div className="flex gap-2.5">{["Paid", "Partial", "Pending"].map((status) => <button key={status} type="button" onClick={() => pickStatus(status)} className={`flex-1 rounded-lg border py-2.5 text-[13px] font-semibold ${form.status === status ? "border-[1.5px] border-teal bg-teal-soft text-teal" : "border-border"}`}>{status}</button>)}</div></div>
          {form.status === "Partial" && <Field label="Amount Paid Now" type="number" min="0.01" max={total} value={form.partialAmount} onChange={(event) => setForm({ ...form, partialAmount: event.target.value })} required />}
          <div className="flex gap-2.5"><button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancel</button><button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving..." : "Save Invoice"}</button></div>
        </form>
      </Modal>
    </div>
  );
}import { useState } from "react";
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

      // Desktop table
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

      // Mobile cards
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
} */
