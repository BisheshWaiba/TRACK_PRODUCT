import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { money } from "../../lib/format";
import { useData } from "../../context/DataContext";

export default function Customers() {
  const { customers, getCustomerStats, createCustomer, updateCustomer, deleteCustomer, loading } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ name: "", contact: "", phone: "", address: "" });
  const [editForm, setEditForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const shown = customers.filter(
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.contact.toLowerCase().includes(query.toLowerCase())
  );

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await createCustomer(form);
    setSaving(false);
    setForm({ name: "", contact: "", phone: "", address: "" });
    setModalOpen(false);
  }

  function openEdit(e, c) {
    e.preventDefault();
    e.stopPropagation();
    setEditForm({ id: c.id, name: c.name, contact: c.contact, phone: c.phone, address: c.address });
  }

  async function handleEditSave(e) {
    e.preventDefault();
    setSaving(true);
    await updateCustomer(editForm.id, editForm);
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

      <div className="overflow-x-auto rounded-xl2 border border-border bg-surface">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Customer" width="max-w-[460px]">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex gap-3.5">
            <Field label="Business Name" placeholder="Annapurna Store" className="flex-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Field label="Contact Person" placeholder="Krishna Bhattarai" className="flex-1" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required />
          </div>
          <Field label="Phone" placeholder="98XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Field label="Address" placeholder="Lakeside, Pokhara" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save Customer"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editForm} onClose={() => setEditForm(null)} title="Edit Customer" width="max-w-[460px]">
        {editForm && (
          <form onSubmit={handleEditSave} className="flex flex-col gap-4">
            <div className="flex gap-3.5">
              <Field label="Business Name" className="flex-1" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              <Field label="Contact Person" className="flex-1" value={editForm.contact} onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })} required />
            </div>
            <Field label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
            <Field label="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} required />
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
