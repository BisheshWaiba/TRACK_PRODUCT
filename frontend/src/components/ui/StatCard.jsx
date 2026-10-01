import { Link } from "react-router-dom";

export default function StatCard({ label, value, sub, subTone = "muted", icon, danger = false, to }) {
  const className = `card flex flex-col gap-1.5 sm:gap-2.5 ${
    danger ? "border-danger/70 bg-danger-soft" : ""
  } ${to ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2" : ""}`;
  const content = (
    <>
      <div className="flex items-start justify-between">
        <span className={`text-[11px] font-semibold sm:text-xs ${danger ? "text-danger-dark" : "text-muted"}`}>{label}</span>
        {icon}
      </div>
      <div className={`font-display text-[19px] font-bold sm:text-[26px] ${danger ? "text-danger-dark" : "text-ink"}`}>{value}</div>
      {sub && (
        <span
          className={`text-xs font-semibold ${
            subTone === "teal" ? "text-teal" : subTone === "accent" ? "text-accent-text" : danger ? "text-danger-dark" : "text-muted"
          }`}
        >
          {sub}
        </span>
      )}
    </>
  );

  return to ? <Link to={to} className={className} aria-label={`View ${label.toLowerCase()}`}>{content}</Link> : <div className={className}>{content}</div>;
}
