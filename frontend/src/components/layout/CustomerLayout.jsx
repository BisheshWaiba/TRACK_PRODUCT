import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import Icon from "../icons/Icon";
import { useCart } from "../../context/CartContext";

const NAV = [
  { to: "/app", label: "Dashboard", icon: "grid", end: true },
  { to: "/app/bundles", label: "Browse Bundles", icon: "bundle" },
  { to: "/app/cart", label: "Cart", icon: "cart" },
  { to: "/app/orders", label: "My Orders", icon: "box" },
  { to: "/app/track", label: "Track Shipment", icon: "pin" },
  { to: "/app/profile", label: "Profile", icon: "user" },
];

const TITLES = {
  "/app": "Dashboard",
  "/app/bundles": "Browse Bundles",
  "/app/cart": "Your Cart",
  "/app/checkout": "Checkout",
  "/app/orders": "My Orders",
  "/app/track": "Track Shipment",
  "/app/profile": "Profile",
};

export default function CustomerLayout() {
  const { count } = useCart();
  const location = useLocation();
  const title =
    TITLES[location.pathname] ||
    (location.pathname.startsWith("/app/orders/") ? "Order Details" : "BulkTrack");

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="flex w-[250px] flex-shrink-0 flex-col justify-between bg-surface p-4 border-r border-border">
        <div className="flex flex-col gap-7">
          <Link to="/" className="flex items-center gap-2 px-2">
            <Icon name="bundle" className="h-6 w-6 text-accent" strokeWidth={1.6} />
            <span className="font-display text-[19px] font-bold">BulkTrack</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive ? "bg-accent-soft font-semibold text-accent-text" : "font-medium hover:bg-surface-2"
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Icon name={item.icon} className="h-[18px] w-[18px]" strokeWidth={1.7} />
                  {item.label}
                </span>
                {item.to === "/app/cart" && count > 0 && (
                  <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold text-white">{count}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 border-t border-border p-3">
          <Link to="/app/profile" className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-surface-2">
              <Icon name="user" className="h-[17px] w-[17px] text-ink-soft" strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-semibold">Anita Sharma</div>
              <div className="text-[11.5px] text-muted">Retailer</div>
            </div>
          </Link>
          <Link
            to="/login"
            title="Log out"
            className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-md"
          >
            <Icon name="out" className="h-4 w-4 text-muted" strokeWidth={1.7} />
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex h-[72px] flex-shrink-0 items-center justify-between border-b border-border bg-surface px-8">
          <span className="font-display text-[19px] font-bold">{title}</span>
          <div className="flex items-center gap-4">
            <Icon name="bell" className="h-[19px] w-[19px] text-ink-soft" strokeWidth={1.7} />
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-surface-2">
              <Icon name="user" className="h-[17px] w-[17px] text-ink-soft" strokeWidth={1.7} />
            </div>
          </div>
        </div>
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
