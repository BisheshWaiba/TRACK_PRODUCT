import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../icons/Icon";
import { useNotifications } from "../../context/NotificationContext";

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleClick(n) {
    markRead(n.id);
    setOpen(false);
    navigate(n.type === "payment" ? "/payments" : "/inventory");
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-2">
        <Icon name="bell" className="h-[19px] w-[19px] text-ink-soft" strokeWidth={1.7} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-16 z-40 flex flex-col rounded-xl2 border border-border bg-surface shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-[360px]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-[13.5px] font-bold">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[12px] font-semibold text-accent hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-[13px] text-muted">No notifications yet.</div>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-bg ${!n.read ? "bg-accent-soft/40" : ""}`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    n.type === "payment" ? "bg-teal-soft text-teal" : "bg-danger-soft text-danger"
                  }`}
                >
                  <Icon name={n.type === "payment" ? "cash" : "alert"} className="h-[15px] w-[15px]" strokeWidth={1.8} />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] leading-snug text-ink">{n.message}</div>
                  <div className="mt-1 text-[11.5px] text-muted">{timeAgo(n.created_at)}</div>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
