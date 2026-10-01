import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { ledgerLine, money } from "../../lib/format";
import { useFinance } from "../../context/FinanceContext";

const emptyForm = { name: "", contact: "", phone: "", address: "" };

export default function Suppliers() {
  const { suppliers, ledger, createSupplier, updateSupplier, deleteSupplier, loading } = useFinance();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [saving, setSaving] = useState(false);

  const shown = suppliers.filter((supplier) =>
    [supplier.name, supplier.contact, supplier.phone].some((value) => (value || "").toLowerCase().includes(query.toLowerCase()))
  );

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await createSupplier(form);
      setForm(emptyForm);
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateSupplier(editTarget.id, editTarget);
      setEditTarget(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteSupplier(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted">Loading suppliers…</div>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="field flex w-full items-center gap-2 sm:w-64">
          <Icon name="search" className="h-4 w-4 text-muted" strokeWidth={2} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search suppliers…" className="flex-1 border-none bg-transparent text-sm outline-none" />
        </div>
        <button onClick={() => { setForm(emptyForm); setModalOpen(true); }} className="btn-primary">
          <Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <div className="card"><span className="text-xs font-semibold text-muted">SUPPLIERS</span><div className="mt-1.5 font-display text-xl font-bold">{suppliers.length}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">TOTAL PAYABLE</span><div className="mt-1.5 font-display text-xl font-bold text-danger">{money(ledger.totalPayable)}</div></div>
      </div>

      <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
        <div className="grid min-w-[760px] grid-cols-[1.8fr_1.2fr_1.1fr_1.4fr_0.8fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11px] font-bold tracking-wide text-muted">
          <span>SUPPLIER / CONTACT</span><span>PHONE</span><span>CITY</span><span>PAYABLE</span><span>ACTIONS</span>
        </div>
        {shown.map((supplier) => {
          const entry = ledger.byParty.get(supplier.id);
          const line = ledgerLine(entry);
          return <div key={supplier.id} className="grid min-w-[760px] grid-cols-[1.8fr_1.2fr_1.1fr_1.4fr_0.8fr] items-center gap-2 border-t border-border px-5 py-4 text-[13px] hover:bg-bg">
            <Link to={`/suppliers/${supplier.id}`} className="min-w-0 hover:text-accent"><div className="font-semibold">{supplier.name}</div><div className="text-[11.5px] text-muted">{supplier.contact}</div></Link>
            <span>{supplier.phone}</span><span>{supplier.city || "—"}</span><Badge tone={line.tone}>{money(Math.max(entry?.payable || 0, 0))}</Badge>
            <div className="flex gap-1.5"><button onClick={(event) => { event.preventDefault(); event.stopPropagation(); setEditTarget({ ...supplier }); }} title="Edit supplier" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-2"><Icon name="edit" className="h-[13px] w-[13px] text-ink-soft" strokeWidth={1.7} /></button><button onClick={(event) => { event.preventDefault(); event.stopPropagation(); setDeleteError(""); setDeleteTarget(supplier); }} title="Delete supplier" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-2"><Icon name="trash" className="h-[13px] w-[13px] text-danger" strokeWidth={1.7} /></button></div>
          </div>;
        })}
        {shown.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted">No suppliers found.</div>}
      </div>

      <div className="flex flex-col gap-2 sm:hidden">
        {shown.map((supplier) => {
          const entry = ledger.byParty.get(supplier.id);
          return <div key={supplier.id} className="flex items-center justify-between rounded-xl2 border border-border bg-surface p-3">
            <Link to={`/suppliers/${supplier.id}`} className="min-w-0 hover:text-accent"><div className="truncate font-semibold">{supplier.name}</div><div className="truncate text-[12px] text-muted">{supplier.contact || supplier.phone || "No contact details"}</div></Link>
            <div className="flex flex-shrink-0 items-center gap-2"><span className="text-[13px] font-semibold text-danger">{money(Math.max(entry?.payable || 0, 0))}</span><button onClick={(event) => { event.preventDefault(); event.stopPropagation(); setEditTarget({ ...supplier }); }} title="Edit supplier" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2"><Icon name="edit" className="h-[14px] w-[14px] text-ink-soft" strokeWidth={1.7} /></button><button onClick={(event) => { event.preventDefault(); event.stopPropagation(); setDeleteError(""); setDeleteTarget(supplier); }} title="Delete supplier" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2"><Icon name="trash" className="h-[14px] w-[14px] text-danger" strokeWidth={1.7} /></button></div>
          </div>;
        })}
        {shown.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-8 text-center text-sm text-muted">No suppliers found.</div>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Supplier" width="max-w-[460px]">
        <form onSubmit={handleCreate} className="flex flex-col gap-4"><Field label="Business Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><Field label="Contact Person" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} /><Field label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /><Field label="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /><button disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Saving…" : "Save Supplier"}</button></form>
      </Modal>

      <Modal open={Boolean(editTarget)} onClose={() => setEditTarget(null)} title="Edit Supplier" width="max-w-[460px]">
        {editTarget && <form onSubmit={handleEdit} className="flex flex-col gap-4"><Field label="Business Name" value={editTarget.name} onChange={(event) => setEditTarget({ ...editTarget, name: event.target.value })} required /><Field label="Contact Person" value={editTarget.contact} onChange={(event) => setEditTarget({ ...editTarget, contact: event.target.value })} /><Field label="Phone" value={editTarget.phone} onChange={(event) => setEditTarget({ ...editTarget, phone: event.target.value })} /><Field label="Address" value={editTarget.address} onChange={(event) => setEditTarget({ ...editTarget, address: event.target.value })} /><button disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Saving…" : "Update Supplier"}</button></form>}
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete Supplier" width="max-w-[420px]">
        <div className="flex flex-col gap-4"><p className="text-sm text-ink-soft">Delete {deleteTarget?.name}? Suppliers with purchase or payment history cannot be deleted.</p>{deleteError && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-dark">{deleteError}</p>}<div className="flex gap-2.5"><button onClick={() => setDeleteTarget(null)} className="btn-ghost flex-1">Cancel</button><button onClick={handleDelete} disabled={saving} className="flex-1 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Deleting…" : "Delete"}</button></div></div>
      </Modal>
    </div>
  );
}
