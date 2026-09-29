import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import { products, sales, money, stockStatus } from "../../data/mockData";

const CURRENT_CUSTOMER = "him-traders";

export default function Dashboard() {
  const myOrders = sales.filter((s) => s.customerId === CURRENT_CUSTOMER);
  const active = myOrders.filter((o) => o.status !== "Delivered");
  const inTransit = myOrders.filter((o) => o.status === "In Transit").length;
  const deliveredThisMonth = myOrders.filter((o) => o.status === "Delivered").length;
  const watchList = products.slice(0, 3);
  const recommended = products.slice(3, 6);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl2 bg-ink p-7 text-[#F5F2EA] sm:flex-row sm:items-center">
        <div>
          <div className="font-display text-xl font-bold">Welcome back, Anita</div>
          <div className="mt-1.5 text-[13.5px] text-[#C9C3B4]">
            You have {inTransit} shipment{inTransit === 1 ? "" : "s"} in transit and {active.length} active order
            {active.length === 1 ? "" : "s"}.
          </div>
        </div>
        <div className="flex gap-2.5">
          <Link to="/app/bundles" className="btn-primary">
            Browse Bundles
          </Link>
          <Link to="/app/track" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-ink">
            Track a Shipment
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <div className="card">
          <span className="text-xs font-semibold text-muted">ACTIVE ORDERS</span>
          <div className="mt-2 font-display text-2xl font-bold">{active.length}</div>
        </div>
        <div className="card">
          <span className="text-xs font-semibold text-muted">IN TRANSIT</span>
          <div className="mt-2 font-display text-2xl font-bold text-accent-text">{inTransit}</div>
        </div>
        <div className="card">
          <span className="text-xs font-semibold text-muted">DELIVERED</span>
          <div className="mt-2 font-display text-2xl font-bold text-teal">{deliveredThisMonth}</div>
        </div>
        <div className="card">
          <span className="text-xs font-semibold text-muted">TOTAL ORDERS</span>
          <div className="mt-2 font-display text-2xl font-bold">{myOrders.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="card flex flex-col gap-3.5">
          <span className="text-sm font-semibold">Stock Watch</span>
          <div className="flex flex-col gap-4">
            {watchList.map((p) => {
              const left = p.stockTotal - p.stockTaken;
              const status = stockStatus(p);
              return (
                <div key={p.id}>
                  <div className="mb-1.5 flex justify-between text-[12.5px]">
                    <span className="font-semibold">{p.name}</span>
                    <span className={status.tone === "danger" ? "font-semibold text-danger" : status.tone === "teal" ? "font-semibold text-teal" : "font-semibold text-accent-text"}>
                      {left} left of {p.stockTotal}
                    </span>
                  </div>
                  <ProgressBar percent={(p.stockTaken / p.stockTotal) * 100} tone={status.tone === "danger" ? "danger" : status.tone === "ink" ? "ink" : "accent"} />
                </div>
              );
            })}
          </div>
          <Link to="/app/bundles" className="text-sm font-semibold text-accent hover:underline">
            View all bundle stock →
          </Link>
        </div>

        <div className="card !p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <span className="text-sm font-semibold">Recent orders</span>
            <Link to="/app/orders" className="text-[13px] font-semibold text-accent hover:underline">
              View all
            </Link>
          </div>
          {myOrders.slice(0, 3).map((o) => {
            const product = products.find((p) => p.id === o.productId);
            return (
              <Link
                to={`/app/orders/${o.id}`}
                key={o.id}
                className="flex items-center justify-between border-t border-border p-5 text-[13.5px] hover:bg-bg"
              >
                <div>
                  <div className="font-mono font-semibold">{o.id}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {product?.name} × {o.qty} · {o.date}
                  </div>
                </div>
                <Badge tone={o.status === "Delivered" ? "teal" : "accent"}>{o.status}</Badge>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold">Recommended for you</span>
          <Link to="/app/bundles" className="text-sm font-semibold text-accent hover:underline">
            Browse all bundles →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {recommended.map((p) => (
            <div key={p.id} className="card flex items-center gap-3.5">
              <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                <Icon name="box" className="h-6 w-6" strokeWidth={1.4} />
              </div>
              <div>
                <div className="text-[13.5px] font-semibold">{p.name}</div>
                <div className="mt-0.5 text-xs text-muted">{money(p.price)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
