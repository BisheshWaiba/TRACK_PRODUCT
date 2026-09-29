export default function Field({ label, className = "", disabled = false, ...inputProps }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      {label && <span className="text-[13px] font-semibold">{label}</span>}
      <input
        disabled={disabled}
        className={`field ${disabled ? "bg-surface-2 text-muted" : ""}`}
        {...inputProps}
      />
    </label>
  );
}
