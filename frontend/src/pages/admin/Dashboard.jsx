import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import StatCard from "../../components/ui/StatCard";
import { money } from "../../lib/format";
import { useData } from "../../context/DataContext";

export default function AdminDashboard() {
  const { products, sales, payments, customerById, productById, saleTotal, salePaymentStatus, dashboardTotals, loading } = useData();
  const totals = dashboardTotals();

  if (loading) return <div className="p-8 text-sm text-muted">Loading dashboard…</div>;
  const recentSales = [...sales].slice(0, 4);
  const recentPayments = [...payments].slice(0, 1);
  const lowStock = products
    .map((p) => ({ ...p, available: p.stockTotal - p.stockTaken }))
    .filter((p) => p.available <= p.reorderAt)
    .sort((a, b) => a.available - b.available)
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <StatCard label="TOTAL PRODUCTS" value={totals.totalProducts} sub={`across ${new Set(products.map((p) => p.category)).size} categories`} icon={<Icon name="box" className="h-[17px] w-[17px] text-slate" />} />
        <StatCard label="TOTAL STOCK (UNITS)" value={totals.totalStock} sub="held across warehouses" icon={<Icon name="layers" className="h-[17px] w-[17px] text-ink-soft" />} />
        <StatCard label="STOCK SOLD / ALLOCATED" value={totals.totalTaken} sub={`${Math.round((totals.totalTaken / totals.totalStock) * 100)}% of stock taken`} subTone="teal" icon={<Icon name="receipt" className="h-[17px] w-[17px] text-accent-text" />} />
        <StatCard label="STOCK AVAILABLE" value={totals.totalAvailable} sub="ready to sell" icon={<Icon name="box" className="h-[17px] w-[17px] text-teal" />} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="TOTAL SALES" value={money(totals.totalSales)} icon={<Icon name="receipt" className="h-[17px] w-[17px] text-ink-soft" />} />
        <StatCard label="AMOUNT RECEIVED" value={money(totals.amountReceived)} subTone="teal" icon={<Icon name="cash" className="h-[17px] w-[17px] text-teal" />} />
        <StatCard label="PENDING PAYMENTS" value={money(totals.pendingPayments)} danger icon={<Icon name="alert" className="h-[17px] w-[17px] text-danger" />} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[14.5px] font-semibold">Sales — last 30 days</span>
            <span className="text-xs text-muted">Peak: {money(24600)} · Sep 24</span>
          </div>
          <svg viewBox="0 0 560 200" className="h-[200px] w-full" preserveAspectRatio="none">
            {[0, 50, 100, 150, 199].map((y) => (
              <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="#E4DCC9" strokeWidth="1" />
            ))}
            <polygon points="0,190 80,160 160,170 240,110 320,120 400,70 480,90 560,50 560,199 0,199" fill="rgba(226,103,42,0.08)" />
            <polyline points="0,190 80,160 160,170 240,110 320,120 400,70 480,90 560,50" fill="none" stroke="#E2672A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="560" cy="50" r="4.5" fill="#E2672A" />
          </svg>
          <div className="flex justify-between text-[11.5px] text-muted">
            <span>Sep 1</span><span>Sep 8</span><span>Sep 15</span><span>Sep 22</span><span>Sep 29</span>
          </div>
        </div>

        <div className="card flex flex-col gap-5">
          <span className="text-[14.5px] font-semibold">Payment status</span>
          {[
            ["Paid", 61, "bg-teal", money(totals.amountReceived)],
            ["Partially Paid", 16, "bg-slate", money(Math.round(totals.pendingPayments * 0.4))],
            ["Pending", 23, "bg-accent-text", money(Math.round(totals.pendingPayments * 0.6))],
          ].map(([label, pct, color, amt]) => (
            <div key={label}>
              <div className="mb-1.5 flex justify-between text-[13px]">
                <span>{label}</span>
                <span className="font-semibold">{amt} · {pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
          <Link to="/payments" className="text-[13px] font-semibold text-accent hover:underline">
            View all payments →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="card !p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <span className="text-[14.5px] font-semibold">Recent transactions</span>
            <Link to="/sales" className="text-[13px] font-semibold text-accent hover:underline">
              View all
            </Link>
          </div>
          {recentSales.map((s) => {
            const customer = customerById(s.customerId);
            const product = productById(s.productId);
            return (
              <div key={s.id} className="flex items-center gap-3.5 border-t border-border p-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
                  <Icon name="receipt" className="h-4 w-4" strokeWidth={1.7} />
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold">Sale {s.id} — {customer?.name}</div>
                  <div className="mt-0.5 text-xs text-muted">{product?.name} × {s.qty} · {money(saleTotal(s))}</div>
                </div>
                <Badge tone={salePaymentStatus(s) === "Paid" ? "teal" : salePaymentStatus(s) === "Partial" ? "slate" : "accent"}>
                  {salePaymentStatus(s)}
                </Badge>
              </div>
            );
          })}
          {recentPayments.map((p) => (
            <div key={p.id} className="flex items-center gap-3.5 border-t border-border p-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal">
                <Icon name="wallet" className="h-4 w-4" strokeWidth={1.7} />
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold">Payment received — {p.method}</div>
                <div className="mt-0.5 text-xs text-muted">{money(p.amount)} on {p.saleId} · {p.date}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card flex flex-col gap-4">
          <span className="text-[14.5px] font-semibold">Stock alerts</span>
          {lowStock.map((p) => (
            <div key={p.id} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold">{p.name}</span>
                <span className={`font-semibold ${p.available <= 0 ? "text-ink" : "text-danger"}`}>
                  {p.available <= 0 ? "Out of Stock" : `${p.available} left`}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${p.available <= 0 ? "bg-ink" : "bg-danger"}`}
                  style={{ width: `${Math.round((p.stockTaken / p.stockTotal) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          <Link to="/inventory" className="btn-ghost mt-1 justify-center">
            Go to Inventory
          </Link>
        </div>
      </div>
    </div>
  );
}
