import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import Icon from "../icons/Icon";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: "grid", end: true },
  { to: "/admin/products", label: "Products", icon: "box" },
  { to: "/admin/inventory", label: "Inventory", icon: "layers" },
  { to: "/admin/customers", label: "Customers", icon: "users" },
  { to: "/admin/sales", label: "Sales", icon: "receipt" },
  { to: "/admin/payments", label: "Payments", icon: "wallet" },
  { to: "/admin/reports", label: "Reports", icon: "chart" },
];

const TITLES = {
  "/admin": "Dashboard",
  "/admin/products": "Products",
  "/admin/inventory": "Inventory",
  "/admin/customers": "Customers",
  "/admin/sales": "Sales",
  "/admin/payments": "Payments",
  "/admin/reports": "Reports",
  "/admin/account": "Account",
};

export default function AdminLayout() {
  const location = useLocation();
  const title =
    TITLES[location.pathname] ||
    (location.pathname.startsWith("/admin/customers/") ? "Customer Detail" : "BulkTrack Admin");
  const onAccount = location.pathname === "/admin/account";

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="flex w-[250px] flex-shrink-0 flex-col justify-between bg-sidebar p-4 text-sidebar-text">
        <div className="flex flex-col gap-6">
          <Link to="/admin" className="flex items-center gap-2 px-2">
            <Icon name="bundle" className="h-6 w-6 text-accent" strokeWidth={1.6} />
            <span className="font-display text-[19px] font-bold text-white">BulkTrack</span>
          </Link>
          <div className="px-3 text-[10.5px] font-bold tracking-widest text-sidebar-muted">
            WHOLESALER ADMIN
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive ? "bg-accent font-semibold text-white" : "text-sidebar-text hover:bg-sidebar-hover"
                  }`
                }
              >
                <Icon name={item.icon} className="h-[18px] w-[18px]" strokeWidth={1.7} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div
          className={`flex items-center gap-2 rounded-lg border-t border-sidebar-border p-3 ${
            onAccount ? "bg-sidebar-hover" : ""
          }`}
        >
          <Link to="/admin/account" className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-sidebar-hover">
              <Icon name="user" className="h-[17px] w-[17px] text-sidebar-text" strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-semibold text-white">Suresh Koirala</div>
              <div className="text-[11.5px] text-sidebar-muted">Wholesaler Admin</div>
            </div>
          </Link>
          <Link
            to="/admin/login"
            title="Log out"
            className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-md"
          >
            <Icon name="out" className="h-4 w-4 text-sidebar-muted" strokeWidth={1.7} />
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
