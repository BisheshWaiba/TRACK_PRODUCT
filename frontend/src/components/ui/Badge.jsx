const TONES = {
  teal: "bg-teal-soft text-teal",
  accent: "bg-accent-soft text-accent-text",
  danger: "bg-danger-soft text-danger",
  slate: "bg-slate-soft text-slate",
  ink: "bg-ink text-white",
  muted: "bg-surface-2 text-muted",
};

export default function Badge({ tone = "muted", children, icon, pulse = false }) {
  return (
    <span className={`badge ${TONES[tone] || TONES.muted}`}>
      {pulse && <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-current" />}
      {icon}
      {children}
    </span>
  );
}
