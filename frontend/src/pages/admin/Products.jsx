import { useMemo, useState } from "react";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { products as initialProducts, money, stockStatus } from "../../data/mockData";

export default function Products() {
  const [products, setProducts] = useState(initialProducts);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [form, setForm] = useState({ name: "", category: "", price: "", bundleSize: "", stock: "" });

  const categories = useMemo(() => ["All", "Low / Out of Stock", ...new Set(initialProducts.map((p) => p.category))], []);

  const shown = products.filter((p) => {
    const available = p.stockTotal - p.stockTaken;
    const matchesCategory =
      category === "All" || (category === "Low / Out of Stock" ? available <= p.reorderAt : p.category === category);
    return matchesCategory && p.name.toLowerCase().includes(query.toLowerCase());
  });

  function handleDelete(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleSave(e) {
    e.preventDefault();
    const id = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) + "-" + Date.now().toString(36);
    setProducts((prev) => [
      ...prev,
      {
        id,
        name: form.name,
        category: form.category || "General",
        price: Number(form.price) || 0,
        bundleSize: form.bundleSize || "1 item / bundle",
        items: [],
        stockTotal: Number(form.stock) || 0,
        stockTaken: 0,
        reorderAt: Math.max(5, Math.round((Number(form.stock) || 0) * 0.2)),
      },
    ]);
    setForm({ name: "", category: "", price: "", bundleSize: "", stock: "" });
    setModalOpen(false);
  }

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
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted">
                  <Icon name="box" className="h-[17px] w-[17px]" strokeWidth={1.4} />
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
                <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-2">
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
            <button type="submit" className="btn-primary flex-1">
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
