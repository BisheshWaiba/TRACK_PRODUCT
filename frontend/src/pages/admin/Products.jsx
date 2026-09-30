import { useMemo, useState } from "react";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { money } from "../../lib/format";
import { useData } from "../../context/DataContext";

function PhotoPicker({ preview, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-4">
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface-2 text-muted">
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon name="box" className="h-6 w-6" strokeWidth={1.4} />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold">Product Photo</span>
        <span className="text-[12px] text-muted">{preview ? "Click to change" : "Click to upload a photo"}</span>
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </label>
  );
}

export default function Products() {
  const { products, stockStatus, createProduct, updateProduct, deleteProduct, loading } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [form, setForm] = useState({ name: "", category: "", price: "", bundleSize: "", stock: "", imageFile: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const categories = useMemo(() => ["All", "Low / Out of Stock", ...new Set(products.map((p) => p.category))], [products]);

  const shown = products.filter((p) => {
    const available = p.stockTotal - p.stockTaken;
    const matchesCategory =
      category === "All" || (category === "Low / Out of Stock" ? available <= p.reorderAt : p.category === category);
    return matchesCategory && p.name.toLowerCase().includes(query.toLowerCase());
  });

  async function handleDelete(id) {
    await deleteProduct(id);
  }

  function pickNewImage(file) {
    setForm({ ...form, imageFile: file });
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  function pickEditImage(file) {
    setEditForm({ ...editForm, imageFile: file });
    setEditImagePreview(file ? URL.createObjectURL(file) : editForm.currentImageUrl);
  }

  function openEdit(p) {
    setEditForm({ id: p.id, name: p.name, category: p.category, price: p.price, bundleSize: p.bundleSize, stockTotal: p.stockTotal, reorderAt: p.reorderAt, imageFile: null, currentImageUrl: p.imageUrl });
    setEditImagePreview(p.imageUrl);
  }

  async function handleEditSave(e) {
    e.preventDefault();
    setSaving(true);
    await updateProduct(editForm.id, editForm);
    setSaving(false);
    setEditForm(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await createProduct(form);
    setSaving(false);
    setForm({ name: "", category: "", price: "", bundleSize: "", stock: "", imageFile: null });
    setImagePreview(null);
    setModalOpen(false);
  }

  if (loading) return <div className="p-8 text-sm text-muted">Loading products…</div>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} />
          Add Product
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                category === c ? "bg-ink text-white" : "bg-surface-2 hover:bg-border"
              }`}
            >
              {c} {c === "All" && `(${products.length})`}
            </button>
          ))}
        </div>
        <div className="field flex w-full items-center gap-2 sm:w-60">
          <Icon name="search" className="h-4 w-4 text-muted" strokeWidth={2} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="flex-1 border-none bg-transparent text-sm outline-none" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-border bg-surface">
        <div className="grid min-w-[900px] grid-cols-[1.8fr_1fr_0.9fr_0.9fr_1.1fr_1fr_0.8fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11px] font-bold tracking-wide text-muted">
          <span>PRODUCT</span><span>CATEGORY</span><span>PRICE</span><span>BUNDLE SIZE</span><span>AVAILABLE / TOTAL</span><span>STATUS</span><span>ACTIONS</span>
        </div>
        {shown.map((p) => {
          const available = p.stockTotal - p.stockTaken;
          const status = stockStatus(p);
          return (
            <div key={p.id} className="grid min-w-[900px] grid-cols-[1.8fr_1fr_0.9fr_0.9fr_1.1fr_1fr_0.8fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2 text-muted">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon name="box" className="h-[17px] w-[17px]" strokeWidth={1.4} />
                  )}
                </div>
                <span className="font-semibold">{p.name}</span>
              </div>
              <span>{p.category}</span>
              <span>{money(p.price)}</span>
              <span>{p.bundleSize}</span>
              <span className={available <= p.reorderAt ? "font-semibold text-danger" : ""}>{available} / {p.stockTotal}</span>
              <Badge tone={status.tone === "danger" ? "danger" : status.tone === "ink" ? "ink" : status.tone === "accent" ? "accent" : "teal"}>
                {status.label}
              </Badge>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(p)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-2">
                  <Icon name="edit" className="h-[13px] w-[13px] text-ink-soft" strokeWidth={1.7} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-2">
                  <Icon name="trash" className="h-[13px] w-[13px] text-danger" strokeWidth={1.7} />
                </button>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted">No products match.</div>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Product">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <PhotoPicker preview={imagePreview} onChange={pickNewImage} />
          <Field label="Product Name" placeholder="e.g. Winter Essentials Bundle G" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="flex gap-3.5">
            <Field label="Category" placeholder="Seasonal" className="flex-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Field label="Unit Price (NPR)" placeholder="15200" className="flex-1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="flex gap-3.5">
            <Field label="Bundle Size" placeholder="3 items / bundle" className="flex-1" value={form.bundleSize} onChange={(e) => setForm({ ...form, bundleSize: e.target.value })} />
            <Field label="Opening Quantity" placeholder="60" className="flex-1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
              {saving ? "Saving…" : "Save Product"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editForm} onClose={() => setEditForm(null)} title="Edit Product">
        {editForm && (
          <form onSubmit={handleEditSave} className="flex flex-col gap-4">
            <PhotoPicker preview={editImagePreview} onChange={pickEditImage} />
            <Field label="Product Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            <div className="flex gap-3.5">
              <Field label="Category" className="flex-1" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
              <Field label="Unit Price (NPR)" className="flex-1" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
            </div>
            <div className="flex gap-3.5">
              <Field label="Bundle Size" className="flex-1" value={editForm.bundleSize} onChange={(e) => setEditForm({ ...editForm, bundleSize: e.target.value })} />
              <Field label="Total Stock" className="flex-1" value={editForm.stockTotal} onChange={(e) => setEditForm({ ...editForm, stockTotal: e.target.value })} />
            </div>
            <Field label="Reorder At" value={editForm.reorderAt} onChange={(e) => setEditForm({ ...editForm, reorderAt: e.target.value })} />
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setEditForm(null)} className="btn-ghost flex-1">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
