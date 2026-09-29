import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BundleCard from "../../components/ui/BundleCard";
import { products } from "../../data/mockData";

export default function Bundles() {
  const categories = useMemo(() => ["All", ...new Set(products.map((p) => p.category))], []);
  const [active, setActive] = useState("All");
  const shown = active === "All" ? products : products.filter((p) => p.category === active);

  return (
    <div className="flex flex-col gap-10 px-6 py-14 md:px-20">
      <div className="flex flex-col gap-5">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Wholesale bundles</h1>
        <p className="max-w-lg text-[15.5px] text-ink-soft">
          Pre-built product bundles priced for bulk buying. Register or log in to place an order.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full px-4.5 py-2 text-[13.5px] font-semibold transition-colors ${
                active === c ? "bg-ink text-white" : "bg-surface-2 hover:bg-border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <BundleCard
            key={p.id}
            product={p}
            action={
              <Link to="/login" className="btn-primary !px-4 !py-2.5 !text-[13px]">
                Log In to Order
              </Link>
            }
          />
        ))}
      </div>
    </div>
  );
}
