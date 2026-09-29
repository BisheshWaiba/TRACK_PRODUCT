import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import { sales, productById, saleTotal, money } from "../../data/mockData";

const CURRENT_CUSTOMER = "him-traders";
const TABS = ["All", "Active", "Delivered"];

export default function MyOrders() {
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");

  const myOrders = useMemo(() => sales.filter((s) => s.customerId === CURRENT_CUSTOMER), []);
  const filtered = myOrders.filter((o) => {
    const matchesTab = tab === "All" || (tab === "Delivered" ? o.status === "Delivered" : o.status !== "Delivered");
    const matchesQuery = o.id.toLowerCase().includes(query.toLowerCase());
    return matchesTab && matchesQuery;
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4.5 py-2 text-[13.5px] font-semibold transition-colors ${
                tab === t ? "bg-ink text-white" : "bg-surface-2 hover:bg-border"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="field flex w-full items-center gap-2 sm:w-64">
          <Icon name="search" className="h-4 w-4 text-muted" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracking number…"
            className="flex-1 border-none bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="grid grid-cols-[1.2fr_1.8fr_1fr_1fr_1fr_0.8fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11.5px] font-bold tracking-wide text-muted">
          <span>TRACKING #</span>
          <span>BUNDLE</span>
          <span>DATE</span>
          <span>AMOUNT</span>
          <span>STATUS</span>
          <span>ACTION</span>
        </div>
        {filtered.map((o) => {
          const product = productById(o.productId);
          return (
            <div
              key={o.id}
              className="grid grid-cols-[1.2fr_1.8fr_1fr_1fr_1fr_0.8fr] items-center gap-2 border-t border-border px-5 py-4 text-[13.5px] hover:bg-bg"
            >
              <span className="font-mono">{o.id}</span>
              <span>{product?.name} × {o.qty}</span>
              <span className="text-ink-soft">{o.date}</span>
              <span>{money(saleTotal(o))}</span>
              <Badge tone={o.status === "Delivered" ? "teal" : "accent"}>{o.status}</Badge>
              <Link to={`/app/orders/${o.id}`} className="font-semibold text-accent hover:underline">
                View
              </Link>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted">No orders found.</div>}
      </div>
    </div>
  );
}
