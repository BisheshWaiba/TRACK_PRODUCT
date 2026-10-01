import { Link } from "react-router-dom";

// Every finance screen lives one level under /finance rather than in the
// main sidebar (see FinanceDashboardScreen in the Jageer Nepal source -
// there it's a single "Finance" tab whose shortcuts grid is the only way
// to any of these). This is the way back up.
export default function FinanceCrumb({ label }) {
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <Link to="/finance" className="font-semibold text-muted hover:text-ink">Finance</Link>
      <span className="text-muted">/</span>
      <span className="font-bold">{label}</span>
    </div>
  );
}
