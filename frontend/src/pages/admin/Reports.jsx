import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import CashflowChart from "../../components/ui/CashflowChart";
import { exportXlsx } from "../../lib/exportXlsx";
import { money } from "../../lib/format";
import { useData } from "../../context/DataContext";
import { useFinance, today } from "../../context/FinanceContext";

const TABS = ["Profit & Loss", "Totals", "Sales Report", "Inventory Report", "Payment Report", "Stock Movement History"];
const PERIODS = ["This Month", "This Year", "All Time"];

// Where a Totals entry's own record actually lives - there's no detail
// page per business_transaction, so sale/expense/purchase link to their
// list; a customer/supplier ledger line links to that party's own page,
// which is the closest thing this app has to "the source".
function entryHref(entry) {
  if (entry.kind === "customer") return `/customers/${entry.partyId}`;
  if (entry.kind === "supplier") return `/suppliers/${entry.partyId}`;
  if (entry.kind === "expense") return "/expenses";
  if (entry.kind === "purchase") return "/purchases";
  return "/sales";
}

function periodRange(period) {
  const now = new Date();
  if (period === "This Month") return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, to: today() };
  if (period === "This Year") return { from: `${now.getFullYear()}-01-01`, to: today() };
  return {};
}

export default function Reports() {
  const { products, customers, sales, stockMovements, productById, customerById, saleTotal, getCustomerStats, loading } = useData();
  const { balances, report, reportEntries, cashflow, suppliers, loading: financeLoading } = useFinance();
  const [tab, setTab] = useState("Profit & Loss");
  const [period, setPeriod] = useState("This Month");
  const [granularity, setGranularity] = useState("week");

  if (loading || financeLoading) return <div className="p-8 text-sm text-muted">Loading reports…</div>;

  const pl = report(periodRange(period));
  const totals = tab === "Totals" ? report(periodRange(period)) : null;
  const entries = tab === "Totals" ? reportEntries(periodRange(period)) : [];
  const buckets = tab === "Totals" ? cashflow(granularity) : [];

  function partyName(entry) {
    if (entry.kind === "customer") return customerById(entry.partyId)?.name || "Customer";
    if (entry.kind === "supplier") return suppliers.find((s) => s.id === entry.partyId)?.name || "Supplier";
    return entry.label;
  }

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

      {tab === "Profit & Loss" && (
        <div className="flex flex-col gap-5">
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`rounded-full px-4 py-2 text-[13px] font-semibold ${period === p ? "bg-ink text-white" : "bg-surface-2 hover:bg-border"}`}>
                {p}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            <div className="card"><span className="text-xs font-semibold text-muted">SALES</span><div className="mt-1.5 font-display text-xl font-bold">{money(pl.sale)}</div></div>
            <div className="card"><span className="text-xs font-semibold text-muted">PURCHASES</span><div className="mt-1.5 font-display text-xl font-bold">{money(pl.purchase)}</div></div>
            <div className="card"><span className="text-xs font-semibold text-muted">EXPENSES</span><div className="mt-1.5 font-display text-xl font-bold text-danger">{money(pl.expense)}</div></div>
            <div className="card"><span className="text-xs font-semibold text-muted">GROSS PROFIT</span><div className={`mt-1.5 font-display text-xl font-bold ${pl.gross < 0 ? "text-danger" : "text-teal"}`}>{money(pl.gross)}</div></div>
          </div>
          <div className="card flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">NET PROFIT</span>
            <span className={`font-display text-2xl font-bold ${pl.net < 0 ? "text-danger" : "text-teal"}`}>{money(pl.net)}</span>
            <span className="text-[12px] text-muted">Billed, not collected — sales count the moment they're made, not when payment arrives.</span>
          </div>
          <div className="card flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted">AVAILABLE BALANCE (ALL TIME)</span>
              <div className={`mt-1 font-display text-lg font-bold ${balances.total < 0 ? "text-danger" : ""}`}>{money(balances.total)}</div>
            </div>
            <span className="text-[12px] text-muted">Actual cash + bank, regardless of period above</span>
          </div>
        </div>
      )}

      {tab === "Totals" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              {PERIODS.map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className={`rounded-full px-4 py-2 text-[13px] font-semibold ${period === p ? "bg-ink text-white" : "bg-surface-2 hover:bg-border"}`}>
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {["week", "month"].map((g) => (
                <button key={g} onClick={() => setGranularity(g)} className={`rounded-full px-4 py-2 text-[13px] font-semibold capitalize ${granularity === g ? "bg-ink text-white" : "bg-surface-2 hover:bg-border"}`}>
                  {g === "week" ? "Last 7 days" : "Last 6 months"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <div className="card"><span className="text-xs font-semibold text-muted">TOTAL RECEIVED</span><div className="mt-1.5 font-display text-xl font-bold text-teal">{money(totals.received)}</div></div>
            <div className="card"><span className="text-xs font-semibold text-muted">TOTAL PAID</span><div className="mt-1.5 font-display text-xl font-bold text-danger">{money(totals.paid)}</div></div>
          </div>

          <div className="card">
            <span className="mb-4 block text-[14.5px] font-semibold">Cashflow — {granularity === "week" ? "last 7 days" : "last 6 months"}</span>
            <CashflowChart buckets={buckets} />
          </div>

          <div className="card !p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="text-[14.5px] font-semibold">Entries this period</span>
              <button
                onClick={() => exportXlsx(`totals-${period.replace(/\s+/g, "-").toLowerCase()}.xlsx`, "Totals", [
                  { header: "Date", value: (e) => e.date },
                  { header: "Party / Label", value: (e) => partyName(e) },
                  { header: "Direction", value: (e) => e.direction },
                  { header: "Amount", value: (e) => e.amount },
                ], entries)}
                className="text-[12.5px] font-semibold text-accent hover:underline"
              >
                Export XLSX
              </button>
            </div>
            {entries.map((entry) => (
              <Link key={entry.kind + entry.id} to={entryHref(entry)} className="flex items-center justify-between gap-3 border-t border-border p-4 text-[13px] hover:bg-bg">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{partyName(entry)}</div>
                  <div className="text-[11.5px] text-muted">{entry.date}</div>
                </div>
                <span className={`flex-shrink-0 font-semibold ${entry.direction === "received" ? "text-teal" : "text-danger"}`}>
                  {entry.direction === "received" ? "+" : "−"}{money(entry.amount)}
                </span>
              </Link>
            ))}
            {entries.length === 0 && <div className="p-6 text-center text-sm text-muted">Nothing in this period.</div>}
          </div>
        </div>
      )}

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
          <div className="grid grid-cols-1 gap-3 sm:gap-5 sm:grid-cols-2">
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
          <div className="flex flex-col gap-2 sm:hidden">
            {stockMovements.map((m) => {
              const product = productById(m.productId);
              return (
                <div key={m.id} className="flex flex-col gap-1.5 rounded-xl2 border border-border bg-surface p-3">
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
