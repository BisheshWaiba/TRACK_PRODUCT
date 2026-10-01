import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import StatCard from "../../components/ui/StatCard";
import CashflowChart from "../../components/ui/CashflowChart";
import Modal from "../../components/ui/Modal";
import { money } from "../../lib/format";
import { useData } from "../../context/DataContext";
import { useFinance, today } from "../../context/FinanceContext";

function monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function yearStart() {
  return `${new Date().getFullYear()}-01-01`;
}

// Mirrors shortcuts() in the Jageer Nepal source (FinanceDashboardScreen.tsx)
// - this hub, and this grid, is the *only* way to any of these screens; none
// of them sit in the main sidebar. The finance_items Inventory
// cross-reference is left out - this app's real stock tracking already
// does that job more accurately (see FINANCE.md).
const SHORTCUTS = [
  { to: "/daybook", label: "Day Book", icon: "cash" },
  { to: "/customers", label: "Ledger", icon: "users" },
  { to: "/received-payments?direction=received", label: "Received", icon: "arrowDown" },
  { to: "/received-payments?direction=payment_out", label: "Payment Out", icon: "arrowUp" },
  { to: "/sales", label: "Sales", icon: "receipt" },
  { to: "/purchases?add=1", label: "Purchase", icon: "cart" },
  { to: "/expenses?add=1", label: "Expenses", icon: "arrowUp" },
  { to: "/bank-accounts", label: "Bank Accounts", icon: "cashBank" },
  { to: "/suppliers", label: "Suppliers", icon: "truck" },
  { to: "/import-statement", label: "Import Statement", icon: "history" },
  { to: "/inventory", label: "Inventory", icon: "layers" },
  { to: "/reports", label: "Report", icon: "chart" },
];

export default function Finance() {
  const { customers } = useData();
  const { balances, ledger, suppliers, report, cashflow, loading } = useFinance();
  const [granularity, setGranularity] = useState("week");
  const [breakdown, setBreakdown] = useState(null); // "receivable" | "payable" | null

  if (loading) return <div className="p-8 text-sm text-muted">Loading finance…</div>;

  const period = report({ from: monthStart(), to: today() });
  const yearly = report({ from: yearStart(), to: today() });
  const buckets = cashflow(granularity);

  // Who makes up the To Receive / To Give total, biggest first - a single
  // summed figure can't be checked against anything on its own.
  function partyBreakdown(field) {
    const names = new Map([...customers, ...suppliers].map((p) => [p.id, p.name]));
    const base = field === "receivable" ? "/customers" : "/suppliers";
    return [...ledger.byParty.entries()]
      .map(([id, row]) => ({ id, name: names.get(id) || "Unknown party", amount: row[field] }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map((row) => ({ ...row, href: `${base}/${row.id}` }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:gap-5 lg:grid-cols-3">
        <Link to="/bank-accounts" className="card flex flex-col gap-1.5 hover:bg-bg">
          <span className="text-xs font-semibold text-muted">AVAILABLE BALANCE</span>
          <span className={`font-display text-2xl font-bold ${balances.total < 0 ? "text-danger" : ""}`}>{money(balances.total)}</span>
          <span className="text-xs text-muted">Cash {money(balances.cash)}{balances.perAccount.length > 0 && ` · ${balances.perAccount.length} bank account${balances.perAccount.length === 1 ? "" : "s"}`}</span>
        </Link>
        <button onClick={() => setBreakdown("receivable")} className="card flex flex-col gap-1.5 text-left hover:bg-bg">
          <span className="text-xs font-semibold text-muted">TO RECEIVE</span>
          <span className="font-display text-2xl font-bold text-teal">{money(ledger.totalReceivable)}</span>
        </button>
        <button onClick={() => setBreakdown("payable")} className="card flex flex-col gap-1.5 text-left hover:bg-bg">
          <span className="text-xs font-semibold text-muted">TO GIVE</span>
          <span className="font-display text-2xl font-bold text-danger">{money(ledger.totalPayable)}</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:grid-cols-5">
        <StatCard label="SALES (THIS MONTH)" value={money(period.sale)} icon={<Icon name="receipt" className="h-[17px] w-[17px] text-ink-soft" />} />
        <StatCard label="PURCHASE (THIS MONTH)" value={money(period.purchase)} icon={<Icon name="cart" className="h-[17px] w-[17px] text-slate" />} />
        <StatCard label="EXPENSE (THIS MONTH)" value={money(period.expense)} icon={<Icon name="arrowUp" className="h-[17px] w-[17px] text-danger" />} />
        <StatCard label="RECEIVED (THIS YEAR)" value={money(yearly.received)} subTone="teal" icon={<Icon name="history" className="h-[17px] w-[17px] text-teal" />} />
        <StatCard label="PAID (THIS YEAR)" value={money(yearly.paid)} icon={<Icon name="history" className="h-[17px] w-[17px] text-danger" />} />
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[14.5px] font-semibold">Cashflow</span>
          <div className="flex gap-2">
            {["week", "month"].map((g) => (
              <button key={g} onClick={() => setGranularity(g)} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold capitalize ${granularity === g ? "bg-ink text-white" : "bg-surface-2 hover:bg-border"}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <CashflowChart buckets={buckets} />
      </div>

      <div className="card flex flex-col gap-3.5">
        <span className="text-[14.5px] font-semibold">Shortcuts</span>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
          {SHORTCUTS.map((s) => (
            <Link key={s.to} to={s.to} className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-center hover:bg-bg">
              <Icon name={s.icon} className="h-5 w-5 text-ink-soft" strokeWidth={1.7} />
              <span className="text-[11.5px] font-semibold leading-tight">{s.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <Modal open={!!breakdown} onClose={() => setBreakdown(null)} title={breakdown === "receivable" ? "Who owes you" : "Who you owe"} width="max-w-[420px]">
        <div className="flex flex-col gap-2">
          {breakdown && partyBreakdown(breakdown).map((row) => (
            <Link key={row.id} to={row.href} onClick={() => setBreakdown(null)} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[13px] hover:bg-surface-2">
              <span className="truncate font-semibold">{row.name}</span>
              <span className={`flex-shrink-0 font-semibold ${breakdown === "receivable" ? "text-teal" : "text-danger"}`}>{money(row.amount)}</span>
            </Link>
          ))}
          {breakdown && partyBreakdown(breakdown).length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted">Nobody owes {breakdown === "receivable" ? "you" : "anyone"} right now.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
