import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { money } from "../../lib/format";
import { useData } from "../../context/DataContext";

const emptyForm = { name: "", contact: "", phone: "", address: "", productId: "", qty: 1 };

export default function Customers() {
  const { customers, products, productById, getCustomerStats, createCustomer, updateCustomer, deleteCustomer, createSale, loading } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const shown = customers.filter(
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.contact.toLowerCase().includes(query.toLowerCase())
  );

  const newProduct = productById(form.productId);
  const newAvailable = newProduct ? newProduct.stockTotal - newProduct.stockTaken : 0;
  const newTotal = newProduct ? newProduct.price * form.qty : 0;

  const editProduct = editForm ? productById(editForm.productId) : null;
  const editAvailable = editProduct ? editProduct.stockTotal - editProduct.stockTaken : 0;
  const editTotal = editProduct ? editProduct.price * editForm.qty : 0;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const newId = await createCustomer(form);
    if (form.productId && Number(form.qty) > 0) {
      await createSale({ customerId: newId, productId: form.productId, qty: form.qty, paymentStatus: "Pending" });
    }
    setSaving(false);
    setForm(emptyForm);
    setModalOpen(false);
  }

  function openEdit(e, c) {
    e.preventDefault();
    e.stopPropagation();
    setEditForm({ id: c.id, name: c.name, contact: c.contact, phone: c.phone, address: c.address, productId: "", qty: 1 });
  }

  async function handleEditSave(e) {
    e.preventDefault();
    setSaving(true);
    await updateCustomer(editForm.id, editForm);
    if (editForm.productId && Number(editForm.qty) > 0) {
      await createSale({ customerId: editForm.id, productId: editForm.productId, qty: editForm.qty, paymentStatus: "Pending" });
    }
    setSaving(false);
    setEditForm(null);
  }

  function openDelete(e, c) {
    e.preventDefault();
    e.stopPropagation();
    setDeleteError("");
    setDeleteTarget(c);
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted">Loading customers…</div>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="field flex w-full items-center gap-2 sm:w-64">
          <Icon name="search" className="h-4 w-4 text-muted" strokeWidth={2} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…" className="flex-1 border-none bg-transparent text-sm outline-none" />
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} />
          Add Customer
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
        <div className="grid min-w-[980px] grid-cols-[1.7fr_1.1fr_1fr_1fr_1fr_0.9fr_0.8fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11px] font-bold tracking-wide text-muted">
          <span>BUSINESS / CONTACT</span><span>PHONE</span><span>UNITS TAKEN</span><span>TOTAL PURCHASES</span><span>OUTSTANDING</span><span>STATUS</span><span>ACTIONS</span>
        </div>
        {shown.map((c) => {
          const stats = getCustomerStats(c.id);
          const status = stats.outstanding <= 0 ? "Paid Up" : stats.outstanding < stats.totalPurchases * 0.3 ? "Partial" : "Pending";
          const initials = c.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
          return (
            <Link
              to={`/customers/${c.id}`}
              key={c.id}
              className="grid min-w-[980px] grid-cols-[1.7fr_1.1fr_1fr_1fr_1fr_0.9fr_0.8fr] items-center gap-2 border-t border-border px-5 py-4 text-[13px] hover:bg-bg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-[13px] font-bold text-ink-soft">
                  {initials}
                </div>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-[11.5px] text-muted">{c.contact} · {c.city}</div>
                </div>
              </div>
              <span>{c.phone}</span>
              <span className="font-semibold">{stats.unitsTaken} units</span>
              <span className="font-semibold">{money(stats.totalPurchases)}</span>
              <span className={stats.outstanding > 0 ? "font-semibold text-danger" : "font-semibold text-teal"}>{money(stats.outstanding)}</span>
              <Badge tone={status === "Paid Up" ? "teal" : status === "Partial" ? "slate" : "accent"}>{status}</Badge>
              <div className="flex gap-1.5">
                <button onClick={(e) => openEdit(e, c)} title="Edit customer" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-2">
                  <Icon name="edit" className="h-[13px] w-[13px] text-ink-soft" strokeWidth={1.7} />
                </button>
                <button onClick={(e) => openDelete(e, c)} title="Delete customer" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-2">
                  <Icon name="trash" className="h-[13px] w-[13px] text-danger" strokeWidth={1.7} />
                </button>
              </div>
            </Link>
          );
        })}
        {shown.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted">No customers found.</div>}
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {shown.map((c) => {
          const stats = getCustomerStats(c.id);
          const status = stats.outstanding <= 0 ? "Paid Up" : stats.outstanding < stats.totalPurchases * 0.3 ? "Partial" : "Pending";
          const initials = c.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
          return (
            <Link to={`/customers/${c.id}`} key={c.id} className="flex flex-col gap-2 rounded-xl2 border border-border bg-surface p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-2 text-[13px] font-bold text-ink-soft">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{c.name}</div>
                    <div className="truncate text-[11.5px] text-muted">{c.contact} · {c.phone}</div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  <button onClick={(e) => openEdit(e, c)} title="Edit customer" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2">
                    <Icon name="edit" className="h-[14px] w-[14px] text-ink-soft" strokeWidth={1.7} />
                  </button>
                  <button onClick={(e) => openDelete(e, c)} title="Delete customer" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2">
                    <Icon name="trash" className="h-[14px] w-[14px] text-danger" strokeWidth={1.7} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted">{stats.unitsTaken} units · {money(stats.totalPurchases)}</span>
                <div className="flex items-center gap-2">
                  <span className={stats.outstanding > 0 ? "font-semibold text-danger" : "font-semibold text-teal"}>{money(stats.outstanding)}</span>
                  <Badge tone={status === "Paid Up" ? "teal" : status === "Partial" ? "slate" : "accent"}>{status}</Badge>
                </div>
              </div>
            </Link>
          );
        })}
        {shown.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-8 text-center text-sm text-muted">No customers found.</div>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Customer" width="max-w-[460px]">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Field label="Business Name" placeholder="Annapurna Store" className="flex-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Field label="Contact Person" placeholder="Krishna Bhattarai" className="flex-1" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required />
          </div>
          <Field label="Phone" placeholder="98XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Field label="Address" placeholder="Lakeside, Pokhara" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />

          <div className="flex flex-col gap-2 rounded-xl border border-border p-3.5">
            <span className="text-[13px] font-semibold">Product taken (optional)</span>
            <select className="field" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value, qty: 1 })}>
              <option value="">No product — just add the customer</option>
              {products.map((p) => {
                const avail = p.stockTotal - p.stockTaken;
                return <option key={p.id} value={p.id} disabled={avail <= 0}>{p.name} — {money(p.price)} ({avail} available)</option>;
              })}
            </select>
            {form.productId && (
              <div className="flex items-end gap-3.5 pt-1">
                <label className="flex flex-1 flex-col gap-2">
                  <span className="text-[13px] font-semibold">Quantity</span>
                  <div className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                    <button type="button" onClick={() => setForm({ ...form, qty: Math.max(1, form.qty - 1) })} className="flex h-6 w-6 items-center justify-center rounded-md text-base font-semibold hover:bg-surface-2">–</button>
                    <span className="flex-1 text-center text-sm font-semibold">{form.qty}</span>
                    <button type="button" onClick={() => setForm({ ...form, qty: Math.min(newAvailable, form.qty + 1) })} className="flex h-6 w-6 items-center justify-center rounded-md text-base font-semibold hover:bg-surface-2">+</button>
                  </div>
                </label>
                <div className="flex-[1.4] rounded-lg bg-surface-2 px-3.5 py-3">
                  <div className="text-[11px] font-semibold text-muted">TOTAL</div>
                  <div className="mt-0.5 font-display text-lg font-bold">{money(newTotal)}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2.5">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save Customer"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editForm} onClose={() => setEditForm(null)} title="Edit Customer" width="max-w-[460px]">
        {editForm && (
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
            </div>

            <div className="flex gap-2.5">
              <button type="button" onClick={() => setEditForm(null)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete customer?" width="max-w-[400px]">
        {deleteTarget && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-soft">
              This removes <span className="font-semibold text-ink">{deleteTarget.name}</span> permanently. This can't be undone.
            </p>
            {deleteError && (
              <div className="rounded-lg border-[1.5px] border-danger bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger-dark">
                {deleteError}
              </div>
            )}
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setDeleteTarget(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 rounded-lg bg-danger py-3 text-[13.5px] font-semibold text-white disabled:opacity-60">
                {saving ? "Deleting…" : "Delete Customer"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
