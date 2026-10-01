import { useMemo, useState } from "react";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { money } from "../../lib/format";
import { useData } from "../../context/DataContext";

// Products and Inventory used to be separate pages that both ended up
// showing "a list of products with their stock" - one for the catalog
// (price, category, photo, add/edit/delete), the other for stock
// movements. Merged here: one product table that can do both, plus the
// movement log and the stock-in/out form underneath it.

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

export default function Inventory() {
  const { products, stockMovements: movements, productById, dashboardTotals, stockStatus, createProduct, updateProduct, deleteProduct, createStockMovement, loading } = useData();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", category: "", price: "", bundleSize: "", stock: "", imageFile: null });
  const [addImagePreview, setAddImagePreview] = useState(null);
  const [addJustSaved, setAddJustSaved] = useState(false);

  const [editForm, setEditForm] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveForm, setMoveForm] = useState({ productId: "", type: "in", qty: "", reference: "" });
  const [moveJustSaved, setMoveJustSaved] = useState(false);

  const [saving, setSaving] = useState(false);

  const totals = dashboardTotals();
  const today = new Date().toISOString().slice(0, 10);

  const categories = useMemo(() => ["All", "Low / Out of Stock", ...new Set(products.map((p) => p.category))], [products]);
  const shown = products.filter((p) => {
    const available = p.stockTotal - p.stockTaken;
    const matchesCategory =
      category === "All" || (category === "Low / Out of Stock" ? available <= p.reorderAt : p.category === category);
    return matchesCategory && p.name.toLowerCase().includes(query.toLowerCase());
  });

  function openAdd() {
    setAddForm({ name: "", category: "", price: "", bundleSize: "", stock: "", imageFile: null });
    setAddImagePreview(null);
    setAddJustSaved(false);
    setAddOpen(true);
  }
  function closeAdd() {
    setAddOpen(false);
    setAddJustSaved(false);
  }
  function pickAddImage(file) {
    setAddForm({ ...addForm, imageFile: file });
    setAddImagePreview(file ? URL.createObjectURL(file) : null);
  }
  async function handleAddSave(e) {
    e.preventDefault();
    setSaving(true);
    await createProduct(addForm);
    setSaving(false);
    // Stays open - a delivery is often several new products at once, and
    // category/bundle size are usually shared across them.
    setAddForm((f) => ({ name: "", category: f.category, price: "", bundleSize: f.bundleSize, stock: "", imageFile: null }));
    setAddImagePreview(null);
    setAddJustSaved(true);
    setTimeout(() => setAddJustSaved(false), 4000);
  }

  function openEdit(p) {
    setEditForm({ id: p.id, name: p.name, category: p.category, price: p.price, bundleSize: p.bundleSize, stockTotal: p.stockTotal, reorderAt: p.reorderAt, imageFile: null, currentImageUrl: p.imageUrl });
    setEditImagePreview(p.imageUrl);
  }
  function pickEditImage(file) {
    setEditForm({ ...editForm, imageFile: file });
    setEditImagePreview(file ? URL.createObjectURL(file) : editForm.currentImageUrl);
  }
  async function handleEditSave(e) {
    e.preventDefault();
    setSaving(true);
    await updateProduct(editForm.id, editForm);
    setSaving(false);
    setEditForm(null);
  }

  async function handleDelete(id) {
    await deleteProduct(id);
  }

  function openMove(productId) {
    setMoveForm({ productId: productId || products[0]?.id || "", type: "in", qty: "", reference: "" });
    setMoveJustSaved(false);
    setMoveOpen(true);
  }
  function closeMove() {
    setMoveOpen(false);
    setMoveJustSaved(false);
  }
  async function handleMoveSave(e) {
    e.preventDefault();
    const qty = Number(moveForm.qty) || 0;
    if (qty <= 0) return;
    setSaving(true);
    await createStockMovement(moveForm);
    setSaving(false);
    // Stays open - a stock take or a multi-item delivery means several
    // movements in a row, usually the same type and reason each time.
    setMoveForm((f) => ({ ...f, qty: "" }));
    setMoveJustSaved(true);
    setTimeout(() => setMoveJustSaved(false), 4000);
  }

  if (loading) return <div className="p-8 text-sm text-muted">Loading inventory…</div>;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap justify-end gap-2.5">
        <button onClick={() => openMove(null)} className="btn-ghost">
          <Icon name="layers" className="h-[15px] w-[15px]" strokeWidth={2.2} />
          Record Stock Movement
        </button>
        <button onClick={openAdd} className="btn-primary">
          <Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <div className="card"><span className="text-xs font-semibold text-muted">TOTAL STOCK</span><div className="mt-1.5 font-display text-2xl font-bold">{totals.totalStock}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">AVAILABLE</span><div className="mt-1.5 font-display text-2xl font-bold text-teal">{totals.totalAvailable}</div></div>
        <div className="card border-danger/60 bg-danger-soft"><span className="text-xs font-semibold text-danger-dark">LOW STOCK</span><div className="mt-1.5 font-display text-2xl font-bold text-danger-dark">{totals.lowStock}</div></div>
        <div className="card border-ink/60"><span className="text-xs font-semibold text-muted">OUT OF STOCK</span><div className="mt-1.5 font-display text-2xl font-bold">{totals.outOfStock}</div></div>
      </div>

      <div className="flex flex-col gap-4">
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

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
          <div className="grid min-w-[940px] grid-cols-[1.7fr_1fr_0.9fr_0.9fr_1.1fr_1fr_1fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11px] font-bold tracking-wide text-muted">
            <span>PRODUCT</span><span>CATEGORY</span><span>PRICE</span><span>BUNDLE SIZE</span><span>AVAILABLE / TOTAL</span><span>STATUS</span><span>ACTIONS</span>
          </div>
          {shown.map((p) => {
            const available = p.stockTotal - p.stockTaken;
            const status = stockStatus(p);
            return (
              <div key={p.id} className="grid min-w-[940px] grid-cols-[1.7fr_1fr_0.9fr_0.9fr_1.1fr_1fr_1fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg">
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
                  <button onClick={() => openMove(p.id)} title="Record stock movement" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-2">
                    <Icon name="layers" className="h-[13px] w-[13px] text-ink-soft" strokeWidth={1.7} />
                  </button>
                  <button onClick={() => openEdit(p)} title="Edit product" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-2">
                    <Icon name="edit" className="h-[13px] w-[13px] text-ink-soft" strokeWidth={1.7} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} title="Delete product" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-2">
                    <Icon name="trash" className="h-[13px] w-[13px] text-danger" strokeWidth={1.7} />
                  </button>
                </div>
              </div>
            );
          })}
          {shown.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted">No products match.</div>}
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col gap-2 sm:hidden">
          {shown.map((p) => {
            const available = p.stockTotal - p.stockTaken;
            const status = stockStatus(p);
            return (
              <div key={p.id} className="flex flex-col gap-2 rounded-xl2 border border-border bg-surface p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2 text-muted">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Icon name="box" className="h-[18px] w-[18px]" strokeWidth={1.4} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{p.name}</div>
                      <div className="text-[12.5px] text-muted">{p.category} · {p.bundleSize}</div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <button onClick={() => openMove(p.id)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2">
                      <Icon name="layers" className="h-[14px] w-[14px] text-ink-soft" strokeWidth={1.7} />
                    </button>
                    <button onClick={() => openEdit(p)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2">
                      <Icon name="edit" className="h-[14px] w-[14px] text-ink-soft" strokeWidth={1.7} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2">
                      <Icon name="trash" className="h-[14px] w-[14px] text-danger" strokeWidth={1.7} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold">{money(p.price)}</span>
                  <span className={available <= p.reorderAt ? "font-semibold text-danger" : "text-ink-soft"}>{available} / {p.stockTotal} available</span>
                  <Badge tone={status.tone === "danger" ? "danger" : status.tone === "ink" ? "ink" : status.tone === "accent" ? "accent" : "teal"}>
                    {status.label}
                  </Badge>
                </div>
              </div>
            );
          })}
          {shown.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-8 text-center text-sm text-muted">No products match.</div>}
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
        <div className="flex flex-col gap-2 sm:hidden">
          {movements.map((m) => {
            const product = productById(m.productId);
            return (
              <div key={m.id} className="flex flex-col gap-1.5 rounded-xl2 border border-border bg-surface p-3">
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

      <Modal open={addOpen} onClose={closeAdd} title="Add Product">
        <form onSubmit={handleAddSave} className="flex flex-col gap-4">
          {addJustSaved && (
            <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-teal bg-teal-soft px-3.5 py-2.5 text-[13px] font-semibold text-teal">
              <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
              Product saved — add another below, or close when done.
            </div>
          )}
          <PhotoPicker preview={addImagePreview} onChange={pickAddImage} />
          <Field label="Product Name" placeholder="e.g. Winter Essentials Bundle G" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Field label="Category" placeholder="Seasonal" className="flex-1" value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })} />
            <Field label="Unit Price (NPR)" placeholder="15200" className="flex-1" value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} />
          </div>
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Field label="Bundle Size" placeholder="3 items / bundle" className="flex-1" value={addForm.bundleSize} onChange={(e) => setAddForm({ ...addForm, bundleSize: e.target.value })} />
            <Field label="Opening Quantity" placeholder="60" className="flex-1" value={addForm.stock} onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })} />
          </div>
          <div className="flex gap-2.5">
            <button type="button" onClick={closeAdd} className="btn-ghost flex-1">Done</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
              {saving ? "Saving…" : "Save & Add Another"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editForm} onClose={() => setEditForm(null)} title="Edit Product">
        {editForm && (
          <form onSubmit={handleEditSave} className="flex flex-col gap-4">
            <PhotoPicker preview={editImagePreview} onChange={pickEditImage} />
            <Field label="Product Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            <div className="flex flex-col gap-3.5 sm:flex-row">
              <Field label="Category" className="flex-1" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
              <Field label="Unit Price (NPR)" className="flex-1" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
            </div>
            <div className="flex flex-col gap-3.5 sm:flex-row">
              <Field label="Bundle Size" className="flex-1" value={editForm.bundleSize} onChange={(e) => setEditForm({ ...editForm, bundleSize: e.target.value })} />
              <Field label="Total Stock" className="flex-1" value={editForm.stockTotal} onChange={(e) => setEditForm({ ...editForm, stockTotal: e.target.value })} />
            </div>
            <Field label="Reorder At" value={editForm.reorderAt} onChange={(e) => setEditForm({ ...editForm, reorderAt: e.target.value })} />
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setEditForm(null)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={moveOpen} onClose={closeMove} title="Record Stock Movement">
        <form onSubmit={handleMoveSave} className="flex flex-col gap-4">
          {moveJustSaved && (
            <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-teal bg-teal-soft px-3.5 py-2.5 text-[13px] font-semibold text-teal">
              <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
              Movement saved — add another below, or close when done.
            </div>
          )}
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold">Product</span>
            <select className="field" value={moveForm.productId} onChange={(e) => setMoveForm({ ...moveForm, productId: e.target.value })}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setMoveForm({ ...moveForm, type: "in" })} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-3 text-[13.5px] font-semibold ${moveForm.type === "in" ? "border-[1.5px] border-teal bg-teal-soft text-teal" : "border-border"}`}>
              <Icon name="arrowDown" className="h-3.5 w-3.5" strokeWidth={2.2} />
              Stock In
            </button>
            <button type="button" onClick={() => setMoveForm({ ...moveForm, type: "out" })} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-3 text-[13.5px] font-semibold ${moveForm.type === "out" ? "border-[1.5px] border-accent bg-accent-soft text-accent-text" : "border-border"}`}>
              <Icon name="arrowUp" className="h-3.5 w-3.5" strokeWidth={2.2} />
              Stock Out
            </button>
          </div>
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Field label="Quantity" placeholder="100" className="flex-1" value={moveForm.qty} onChange={(e) => setMoveForm({ ...moveForm, qty: e.target.value })} required />
            <Field label="Date" defaultValue={today} type="date" className="flex-1" />
          </div>
          <Field label="Reference / Reason" placeholder="Supplier restock #RS-119" value={moveForm.reference} onChange={(e) => setMoveForm({ ...moveForm, reference: e.target.value })} />
          <div className="flex gap-2.5">
            <button type="button" onClick={closeMove} className="btn-ghost flex-1">Done</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save & Add Another"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
