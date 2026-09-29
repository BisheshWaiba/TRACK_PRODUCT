const FILL = {
  teal: "bg-teal",
  accent: "bg-accent-text",
  danger: "bg-danger",
  ink: "bg-ink",
};

export default function ProgressBar({ percent, tone = "accent", height = "h-1.5" }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={`${height} w-full overflow-hidden rounded-full bg-surface-2`}>
      <div className={`${height} rounded-full ${FILL[tone] || FILL.accent}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
