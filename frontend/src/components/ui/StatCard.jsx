export default function StatCard({ label, value, sub, subTone = "muted", icon, danger = false }) {
  return (
    <div
      className={`card flex flex-col gap-2.5 ${
        danger ? "border-danger/70 bg-danger-soft" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`text-xs font-semibold ${danger ? "text-danger-dark" : "text-muted"}`}>{label}</span>
        {icon}
      </div>
      <div className={`font-display text-[26px] font-bold ${danger ? "text-danger-dark" : "text-ink"}`}>{value}</div>
      {sub && (
        <span
          className={`text-xs font-semibold ${
            subTone === "teal" ? "text-teal" : subTone === "accent" ? "text-accent-text" : danger ? "text-danger-dark" : "text-muted"
          }`}
        >
          {sub}
        </span>
      )}
    </div>
  );
}
