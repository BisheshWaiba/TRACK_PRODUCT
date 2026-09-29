import { useMemo, useState } from "react";
import Icon from "../../components/icons/Icon";
import BundleCard from "../../components/ui/BundleCard";
import { products } from "../../data/mockData";
import { useCart } from "../../context/CartContext";

export default function BrowseBundles() {
  const { addToCart } = useCart();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");
  const [justAdded, setJustAdded] = useState(null);
  const categories = useMemo(() => ["All", ...new Set(products.map((p) => p.category))], []);

  const shown = products.filter((p) => {
    const matchesCat = active === "All" || p.category === active;
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  function handleAdd(id) {
    addToCart(id, 1);
    setJustAdded(id);
    setTimeout(() => setJustAdded(null), 1200);
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2.5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors ${
                active === c ? "bg-ink text-white" : "bg-surface-2 hover:bg-border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="field flex w-full items-center gap-2 sm:w-64">
          <Icon name="search" className="h-4 w-4 text-muted" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bundles…"
            className="flex-1 border-none bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <BundleCard
            key={p.id}
            product={p}
            action={
              <button onClick={() => handleAdd(p.id)} className="btn-primary !px-4 !py-2.5 !text-[13px]">
                <Icon name="cart" className="h-3.5 w-3.5" strokeWidth={2} />
                {justAdded === p.id ? "Added!" : "Add to Cart"}
              </button>
            }
          />
        ))}
        {shown.length === 0 && <p className="text-sm text-muted">No bundles match your search.</p>}
      </div>
    </div>
  );
}
