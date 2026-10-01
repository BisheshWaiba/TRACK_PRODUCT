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
          {form.status === "Partial" && <Field label="Amount Paid Now" type="number" min="0.01" step="0.01" max={total} value={form.partialAmount} onChange={(event) => setForm({ ...form, partialAmount: event.target.value })} required />}
          <div className="flex gap-2.5"><button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancel</button><button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving..." : "Save Invoice"}</button></div>
        </form>
      </Modal>
    </div>
  );
}
