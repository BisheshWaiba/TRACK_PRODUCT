import Icon from "../icons/Icon";

export default function Modal({ open, onClose, title, children, width = "max-w-[480px]" }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${width} rounded-xl2 bg-surface p-7 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="font-display text-lg font-bold">{title}</span>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-2"
          >
            <Icon name="close" className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
