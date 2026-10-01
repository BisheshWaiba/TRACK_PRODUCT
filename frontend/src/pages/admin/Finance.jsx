import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import StatCard from "../../components/ui/StatCard";
import { money } from "../../lib/format";
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
// of them sit in the main sidebar. Import Statement and the finance_items
// Inventory cross-reference are left out (see FINANCE.md).
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
  { to: "/inventory", label: "Inventory", icon: "layers" },
  { to: "/reports", label: "Report", icon: "chart" },
];

export default function Finance() {
  const { balances, ledger, report, loading } = useFinance();

  if (loading) return <div className="p-8 text-sm text-muted">Loading finance…</div>;

  const period = report({ from: monthStart(), to: today() });
  const yearly = report({ from: yearStart(), to: today() });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:gap-5 lg:grid-cols-3">
        <Link to="/bank-accounts" className="card flex flex-col gap-1.5 hover:bg-bg">
          <span className="text-xs font-semibold text-muted">AVAILABLE BALANCE</span>
          <span className={`font-display text-2xl font-bold ${balances.total < 0 ? "text-danger" : ""}`}>{money(balances.total)}</span>
          <span className="text-xs text-muted">Cash {money(balances.cash)}{balances.perAccount.length > 0 && ` · ${balances.perAccount.length} bank account${balances.perAccount.length === 1 ? "" : "s"}`}</span>
        </Link>
        <Link to="/customers" className="card flex flex-col gap-1.5 hover:bg-bg">
          <span className="text-xs font-semibold text-muted">TO RECEIVE</span>
          <span className="font-display text-2xl font-bold text-teal">{money(ledger.totalReceivable)}</span>
        </Link>
        <Link to="/suppliers" className="card flex flex-col gap-1.5 hover:bg-bg">
          <span className="text-xs font-semibold text-muted">TO GIVE</span>
          <span className="font-display text-2xl font-bold text-danger">{money(ledger.totalPayable)}</span>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:grid-cols-5">
        <StatCard label="SALES (THIS MONTH)" value={money(period.sale)} icon={<Icon name="receipt" className="h-[17px] w-[17px] text-ink-soft" />} />
        <StatCard label="PURCHASE (THIS MONTH)" value={money(period.purchase)} icon={<Icon name="cart" className="h-[17px] w-[17px] text-slate" />} />
        <StatCard label="EXPENSE (THIS MONTH)" value={money(period.expense)} icon={<Icon name="arrowUp" className="h-[17px] w-[17px] text-danger" />} />
        <StatCard label="RECEIVED (THIS YEAR)" value={money(yearly.received)} subTone="teal" icon={<Icon name="history" className="h-[17px] w-[17px] text-teal" />} />
        <StatCard label="PAID (THIS YEAR)" value={money(yearly.paid)} icon={<Icon name="history" className="h-[17px] w-[17px] text-danger" />} />
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
    </div>
  );
}
