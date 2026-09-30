import { useState } from "react";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import { money } from "../../lib/format";
import { useData } from "../../context/DataContext";

const TABS = ["Sales Report", "Inventory Report", "Payment Report", "Stock Movement History"];

export default function Reports() {
  const { products, customers, sales, stockMovements, productById, saleTotal, getCustomerStats, loading } = useData();
  const [tab, setTab] = useState("Sales Report");

  if (loading) return <div className="p-8 text-sm text-muted">Loading reports…</div>;

  const topProducts = [...products]
    .map((p) => ({ ...p, revenue: sales.filter((s) => s.productId === p.id).reduce((sum, s) => sum + saleTotal(s), 0) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  const topCustomers = [...customers]
    .map((c) => ({ ...c, stats: getCustomerStats(c.id) }))
    .sort((a, b) => b.stats.totalPurchases - a.stats.totalPurchases)
    .slice(0, 4);

  const outstandingCustomers = [...customers]
    .map((c) => ({ ...c, stats: getCustomerStats(c.id) }))
    .filter((c) => c.stats.outstanding > 0)
    .sort((a, b) => b.stats.outstanding - a.stats.outstanding);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap border-b-[2.5px] px-4 py-3 text-[13.5px] font-semibold transition-colors ${
              tab === t ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink-soft"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Sales Report" && (
        <div className="flex flex-col gap-5">
          <div className="card flex flex-col gap-4">
            <span className="text-[14.5px] font-semibold">Sales trend — last 30 days</span>
            <svg viewBox="0 0 1120 220" className="h-[160px] w-full sm:h-[220px]" preserveAspectRatio="none">
              {[0, 55, 110, 165, 219].map((y) => <line key={y} x1="0" y1={y} x2="1120" y2={y} stroke="#E4DCC9" strokeWidth="1" />)}
              <polygon points="0,205 160,175 320,190 480,120 640,135 800,75 960,100 1120,55 1120,219 0,219" fill="rgba(226,103,42,0.08)" />
              <polyline points="0,205 160,175 320,190 480,120 640,135 800,75 960,100 1120,55" fill="none" stroke="#E2672A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="card !p-0 overflow-hidden">
              <div className="border-b border-border p-4 text-[14.5px] font-semibold">Top products by revenue</div>
              {topProducts.map((p) => (
                <div key={p.id} className="flex justify-between border-t border-border p-4 text-[13px]">
                  <span>{p.name}</span><span className="font-semibold">{money(p.revenue)}</span>
                </div>
              ))}
            </div>
            <div className="card !p-0 overflow-hidden">
              <div className="border-b border-border p-4 text-[14.5px] font-semibold">Top customers by spend</div>
              {topCustomers.map((c) => (
                <div key={c.id} className="flex justify-between border-t border-border p-4 text-[13px]">
                  <span>{c.name}</span><span className="font-semibold">{money(c.stats.totalPurchases)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "Inventory Report" && (
        <div className="flex flex-col gap-5">
          <div className="card flex flex-col gap-4">
            <span className="text-[14.5px] font-semibold">Stock levels by product — taken vs. available</span>
            <div className="flex flex-col gap-3.5">
              {products.map((p) => {
                const available = p.stockTotal - p.stockTaken;
                const pctTaken = Math.round((p.stockTaken / p.stockTotal) * 100);
                return (
                  <div key={p.id}>
                    <div className="mb-1.5 flex justify-between text-[12.5px]">
                      <span>{p.name}</span>
                      <span className="text-muted">{p.stockTaken} / {p.stockTotal}</span>
                    </div>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full bg-accent-text" style={{ width: `${pctTaken}%` }} />
                      <div className={`h-full ${available <= p.reorderAt ? "bg-danger" : "bg-teal"}`} style={{ width: `${100 - pctTaken}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 pt-1 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent-text" />Taken</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-teal" />Available</span>
            </div>
          </div>
        </div>
      )}

      {tab === "Payment Report" && (
        <div className="flex flex-col gap-5">
          <div className="card !p-0 overflow-hidden">
            <div className="border-b border-border p-4 text-[14.5px] font-semibold">Customers with outstanding balance</div>
            {outstandingCustomers.map((c) => (
              <div key={c.id} className="flex justify-between border-t border-border p-4 text-[13px]">
                <span>{c.name}</span><span className="font-semibold text-danger">{money(c.stats.outstanding)}</span>
              </div>
            ))}
            {outstandingCustomers.length === 0 && <div className="p-6 text-center text-sm text-muted">No outstanding balances 🎉</div>}
          </div>
        </div>
      )}

      {tab === "Stock Movement History" && (
        <div className="flex flex-col gap-4">
          <div className="field flex w-full items-center gap-2 sm:w-64">
            <Icon name="search" className="h-4 w-4 text-muted" strokeWidth={2} />
            <input placeholder="Search movements…" className="flex-1 border-none bg-transparent text-sm outline-none" />
          </div>
          <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
            <div className="grid min-w-[700px] grid-cols-[1fr_1.8fr_0.9fr_0.7fr_1.4fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11.5px] font-bold tracking-wide text-muted">
              <span>DATE</span><span>PRODUCT</span><span>TYPE</span><span>QTY</span><span>REFERENCE</span>
            </div>
            {stockMovements.map((m) => {
              const product = productById(m.productId);
              return (
                <div key={m.id} className="grid min-w-[700px] grid-cols-[1fr_1.8fr_0.9fr_0.7fr_1.4fr] items-center gap-2 border-t border-border px-5 py-3 text-[13px] hover:bg-bg">
                  <span className="text-ink-soft">{m.date}</span>
                  <span>{product?.name}</span>
                  <Badge tone={m.type === "in" ? "teal" : "accent"}>{m.type === "in" ? "In" : "Out"}</Badge>
                  <span>{m.type === "in" ? "+" : "-"}{m.qty}</span>
                  <span className="text-muted">{m.reference}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-2.5 sm:hidden">
            {stockMovements.map((m) => {
              const product = productById(m.productId);
              return (
                <div key={m.id} className="flex flex-col gap-1.5 rounded-xl2 border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{product?.name}</span>
                    <Badge tone={m.type === "in" ? "teal" : "accent"}>{m.type === "in" ? "In" : "Out"}</Badge>
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
      )}
    </div>
  );
}
