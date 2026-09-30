import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { money } from "../../lib/format";
import { useData } from "../../context/DataContext";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customerById, salesForCustomer, productById, products, saleTotal, salePaymentStatus, getCustomerStats, payments, updateCustomer, deleteCustomer, createSale, loading } = useData();
  const customer = customerById(id);
  const [editForm, setEditForm] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  if (loading) {
    return <div className="p-8 text-sm text-muted">Loading customer…</div>;
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-base font-semibold">Customer not found</p>
        <Link to="/customers" className="btn-primary">Back to Customers</Link>
      </div>
    );
  }

  const stats = getCustomerStats(customer.id);
  const custSales = salesForCustomer(customer.id);
  const custPayments = payments.filter((p) => custSales.some((s) => s.id === p.saleId));
  const status = stats.outstanding <= 0 ? "Paid Up" : stats.outstanding < stats.totalPurchases * 0.3 ? "Partial" : "Pending";
  const initials = customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  function openEdit() {
    setEditForm({ name: customer.name, contact: customer.contact, phone: customer.phone, address: customer.address, productId: "", qty: 1, paymentStatus: "Paid" });
  }

  async function handleEditSave(e) {
    e.preventDefault();
    setSaving(true);
    await updateCustomer(customer.id, editForm);
    if (editForm.productId && Number(editForm.qty) > 0) {
      await createSale({ customerId: customer.id, productId: editForm.productId, qty: editForm.qty, paymentStatus: editForm.paymentStatus });
    }
    setSaving(false);
    setEditForm(null);
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteCustomer(customer.id);
      navigate("/customers", { replace: true });
    } catch (err) {
      setDeleteError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-[13px]">
        <Link to="/customers" className="font-semibold text-muted hover:text-ink">Customers</Link>
        <span className="text-muted">/</span>
        <span className="font-bold">{customer.name}</span>
      </div>

      <div className="card flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-ink-soft">
            {initials}
          </div>
          <div>
            <div className="font-display text-lg font-bold">{customer.name}</div>
            <div className="mt-1.5 flex flex-wrap gap-4 text-[13px] text-ink-soft">
              <span className="flex items-center gap-1.5"><Icon name="user" className="h-3.5 w-3.5 text-muted" strokeWidth={1.8} />{customer.contact}</span>
              <span className="flex items-center gap-1.5"><Icon name="phone" className="h-3.5 w-3.5 text-muted" strokeWidth={1.8} />{customer.phone}</span>
              <span className="flex items-center gap-1.5"><Icon name="pin" className="h-3.5 w-3.5 text-muted" strokeWidth={1.8} />{customer.address}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge tone={status === "Paid Up" ? "teal" : status === "Partial" ? "slate" : "accent"}>{status}</Badge>
          <button onClick={openEdit} title="Edit customer" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2">
            <Icon name="edit" className="h-[14px] w-[14px] text-ink-soft" strokeWidth={1.7} />
          </button>
          <button onClick={() => { setDeleteError(""); setDeleteOpen(true); }} title="Delete customer" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2">
            <Icon name="trash" className="h-[14px] w-[14px] text-danger" strokeWidth={1.7} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <div className="card"><span className="text-xs font-semibold text-muted">TOTAL PURCHASES</span><div className="mt-1.5 font-display text-xl font-bold">{money(stats.totalPurchases)}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">TOTAL PAID</span><div className="mt-1.5 font-display text-xl font-bold text-teal">{money(stats.totalPaid)}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">OUTSTANDING BALANCE</span><div className={`mt-1.5 font-display text-xl font-bold ${stats.outstanding > 0 ? "text-danger" : ""}`}>{money(stats.outstanding)}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">UNITS TAKEN</span><div className="mt-1.5 font-display text-xl font-bold">{stats.unitsTaken}</div></div>
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-[15px] font-semibold">Purchase history</span>
        <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
          <div className="grid min-w-[700px] grid-cols-[1fr_1.6fr_0.6fr_1fr_1fr_1fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11.5px] font-bold tracking-wide text-muted">
            <span>DATE</span><span>PRODUCT</span><span>QTY</span><span>UNIT PRICE</span><span>TOTAL</span><span>PAYMENT</span>
          </div>
          {custSales.map((s) => {
            const product = productById(s.productId);
            const payStatus = salePaymentStatus(s);
            return (
              <div key={s.id} className="grid min-w-[700px] grid-cols-[1fr_1.6fr_0.6fr_1fr_1fr_1fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg">
                <span className="text-ink-soft">{s.date}</span>
                <span>{product?.name}</span>
                <span>{s.qty}</span>
                <span>{money(product.price)}</span>
                <span className="font-semibold">{money(saleTotal(s))}</span>
                <Badge tone={payStatus === "Paid" ? "teal" : payStatus === "Partial" ? "slate" : "accent"}>{payStatus}</Badge>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 sm:hidden">
          {custSales.map((s) => {
            const product = productById(s.productId);
            const payStatus = salePaymentStatus(s);
            return (
              <div key={s.id} className="flex flex-col gap-1.5 rounded-xl2 border border-border bg-surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{product?.name}</span>
                  <Badge tone={payStatus === "Paid" ? "teal" : payStatus === "Partial" ? "slate" : "accent"}>{payStatus}</Badge>
                </div>
                <div className="flex items-center justify-between text-[12.5px] text-muted">
                  <span>{s.date} · {s.qty} × {money(product.price)}</span>
                  <span className="font-semibold text-ink">{money(saleTotal(s))}</span>
                </div>
              </div>
            );
          })}
          {custSales.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-6 text-center text-sm text-muted">No purchases yet.</div>}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-[15px] font-semibold">Payment history</span>
        <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
          <div className="grid min-w-[600px] grid-cols-[1fr_1.4fr_1fr_1fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11.5px] font-bold tracking-wide text-muted">
            <span>DATE</span><span>METHOD</span><span>AMOUNT</span><span>SALE REF</span>
          </div>
          {custPayments.map((p) => (
            <div key={p.id} className="grid min-w-[600px] grid-cols-[1fr_1.4fr_1fr_1fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg">
              <span className="text-ink-soft">{p.date}</span>
              <span>{p.method}</span>
              <span className="font-semibold">{money(p.amount)}</span>
              <span className="font-mono text-muted">{p.saleId}</span>
            </div>
          ))}
          {custPayments.length === 0 && <div className="px-5 py-6 text-center text-sm text-muted">No payments recorded yet.</div>}
        </div>
        <div className="flex flex-col gap-2 sm:hidden">
          {custPayments.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl2 border border-border bg-surface p-3">
              <div>
                <div className="text-[13px] font-semibold">{p.method}</div>
                <div className="text-[12px] text-muted">{p.date} · <span className="font-mono">{p.saleId}</span></div>
              </div>
              <span className="font-semibold">{money(p.amount)}</span>
            </div>
          ))}
          {custPayments.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-6 text-center text-sm text-muted">No payments recorded yet.</div>}
        </div>
      </div>

      <Modal open={!!editForm} onClose={() => setEditForm(null)} title="Edit Customer" width="max-w-[460px]">
        {editForm && (() => {
          const editProduct = productById(editForm.productId);
          const editAvailable = editProduct ? editProduct.stockTotal - editProduct.stockTaken : 0;
          const editTotal = editProduct ? editProduct.price * editForm.qty : 0;
          return (
            <form onSubmit={handleEditSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-3.5 sm:flex-row">
                <Field label="Business Name" className="flex-1" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                <Field label="Contact Person" className="flex-1" value={editForm.contact} onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })} required />
              </div>
              <Field label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
              <Field label="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} required />

              <div className="flex flex-col gap-2 rounded-xl border border-border p-3.5">
                <span className="text-[13px] font-semibold">Record a new product taken (optional)</span>
                <select className="field" value={editForm.productId} onChange={(e) => setEditForm({ ...editForm, productId: e.target.value, qty: 1 })}>
                  <option value="">No new purchase</option>
                  {products.map((p) => {
                    const avail = p.stockTotal - p.stockTaken;
                    return <option key={p.id} value={p.id} disabled={avail <= 0}>{p.name} — {money(p.price)} ({avail} available)</option>;
                  })}
                </select>
                {editForm.productId && (
                  <div className="flex items-end gap-3.5 pt-1">
                    <label className="flex flex-1 flex-col gap-2">
                      <span className="text-[13px] font-semibold">Quantity</span>
                      <div className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                        <button type="button" onClick={() => setEditForm({ ...editForm, qty: Math.max(1, editForm.qty - 1) })} className="flex h-6 w-6 items-center justify-center rounded-md text-base font-semibold hover:bg-surface-2">–</button>
                        <span className="flex-1 text-center text-sm font-semibold">{editForm.qty}</span>
                        <button type="button" onClick={() => setEditForm({ ...editForm, qty: Math.min(editAvailable, editForm.qty + 1) })} className="flex h-6 w-6 items-center justify-center rounded-md text-base font-semibold hover:bg-surface-2">+</button>
                      </div>
                    </label>
                    <div className="flex-[1.4] rounded-lg bg-surface-2 px-3.5 py-3">
                      <div className="text-[11px] font-semibold text-muted">TOTAL</div>
                      <div className="mt-0.5 font-display text-lg font-bold">{money(editTotal)}</div>
                    </div>
                  </div>
                )}
                {editForm.productId && (
                  <div className="flex flex-col gap-2 pt-1">
                    <span className="text-[13px] font-semibold">Payment Status</span>
                    <div className="flex gap-2.5">
                      {["Paid", "Partial", "Pending"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, paymentStatus: s })}
                          className={`flex-1 rounded-lg border py-2.5 text-[13px] font-semibold ${
                            editForm.paymentStatus === s ? "border-[1.5px] border-teal bg-teal-soft text-teal" : "border-border"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5">
                <button type="button" onClick={() => setEditForm(null)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button>
              </div>
            </form>
          );
        })()}
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete customer?" width="max-w-[400px]">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-soft">
            This removes <span className="font-semibold text-ink">{customer.name}</span> permanently. This can't be undone.
          </p>
          {deleteError && (
            <div className="rounded-lg border-[1.5px] border-danger bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger-dark">
              {deleteError}
            </div>
          )}
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setDeleteOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleDelete} disabled={saving} className="flex-1 rounded-lg bg-danger py-3 text-[13.5px] font-semibold text-white disabled:opacity-60">
              {saving ? "Deleting…" : "Delete Customer"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
