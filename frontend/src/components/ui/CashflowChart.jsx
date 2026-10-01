import { money } from "../../lib/format";

// Shared by the Finance hub and the Reports Totals tab, so "cashflow"
// never means two slightly different charts depending on which screen
// you're looking at it from.
export default function CashflowChart({ buckets }) {
  const max = Math.max(1, ...buckets.map((b) => Math.max(b.in, b.out)));
  return (
    <div>
      <div className="flex h-[140px] items-end gap-2">
        {buckets.map((b, i) => (
          <div key={i} className="flex flex-1 items-end justify-center gap-1">
            <div className="w-full rounded-t bg-teal/70" style={{ height: `${b.in > 0 ? Math.max(3, (b.in / max) * 140) : 0}px` }} title={`In ${money(b.in)}`} />
            <div className="w-full rounded-t bg-danger/60" style={{ height: `${b.out > 0 ? Math.max(3, (b.out / max) * 140) : 0}px` }} title={`Out ${money(b.out)}`} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        {buckets.map((b, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-muted">{b.label}</span>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-teal/70" />Cash in</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-danger/60" />Cash out</span>
      </div>
    </div>
  );
}
