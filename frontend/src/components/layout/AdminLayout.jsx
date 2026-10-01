import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Icon from "../icons/Icon";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../../context/AuthContext";

// Finance (Day Book, Purchases, Expenses, Received/Paid, Bank Accounts) is
// one sidebar entry, matching the single "Finance" tab in the Jageer Nepal
// app these were ported from - but unlike that app (a phone, one screen at
// a time) this sidebar has room to list them inline too, via the arrow.
// Ledger/Sales/Report aren't repeated here since Customers/Sales/Reports
// already have their own top-level entries above.
const FINANCE_CHILDREN = [
  { to: "/daybook", label: "Day Book", icon: "cash" },
  { to: "/received-payments?direction=received", label: "Received", icon: "arrowDown" },
  { to: "/received-payments?direction=payment_out", label: "Payment Out", icon: "arrowUp" },
  { to: "/purchases?add=1", label: "Purchase", icon: "cart" },
  { to: "/expenses?add=1", label: "Expenses", icon: "arrowUp" },
  { to: "/bank-accounts", label: "Bank Accounts", icon: "cashBank" },
];
const FINANCE_PATHS = ["/finance", "/daybook", "/purchases", "/expenses", "/received-payments", "/bank-accounts"];

// Account keeps its own icon+name card at the bottom of the sidebar
// (with the logout button) - it doesn't need a second entry up here too.
const NAV = [
  { to: "/", label: "Dashboard", icon: "grid", end: true },
  { to: "/inventory", label: "Inventory", icon: "layers" },
  { to: "/customers", label: "Customers", icon: "users" },
  { to: "/suppliers", label: "Suppliers", icon: "truck" },
  { to: "/sales", label: "Sales", icon: "receipt" },
  { to: "/payments", label: "Payments", icon: "wallet" },
  { to: "/reports", label: "Reports", icon: "chart" },
  { to: "/finance", label: "Finance", icon: "cashBank", children: FINANCE_CHILDREN },
];

const TITLES = {
  "/": "Dashboard",
  "/inventory": "Inventory",
  "/customers": "Customers",
  "/suppliers": "Suppliers",
  "/sales": "Sales",
  "/payments": "Payments",
  "/finance": "Finance",
  "/purchases": "Purchases",
  "/expenses": "Expenses",
  "/received-payments": "Received / Paid",
  "/bank-accounts": "Bank Accounts",
  "/daybook": "Day Book",
  "/reports": "Reports",
  "/account": "Account",
};

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const isFinancePath = FINANCE_PATHS.includes(location.pathname);
  const [financeOpen, setFinanceOpen] = useState(isFinancePath);
  // Landing on a finance page - straight to it, or via a shortcut card -
  // opens the group so the sidebar reflects where you are. It stays open
  // after that until toggled; it doesn't snap back on every re-render.
  useEffect(() => {
    if (isFinancePath) setFinanceOpen(true);
  }, [location.pathname]);
  const title =
    TITLES[location.pathname] ||
    (location.pathname.startsWith("/customers/") ? "Customer Detail" : location.pathname.startsWith("/suppliers/") ? "Supplier Detail" : "BulkTrack Admin");
  const onAccount = location.pathname === "/account";
  const displayName = user?.user_metadata?.full_name || user?.email || "Wholesaler Admin";
  const displayRole = user?.user_metadata?.role || user?.email || "";

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {navOpen && (
        <div className="fixed inset-0 z-40 bg-ink/50 lg:hidden" onClick={() => setNavOpen(false)} />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[250px] flex-shrink-0 flex-col justify-between overflow-y-auto bg-sidebar p-4 text-sidebar-text transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <Link to="/" onClick={() => setNavOpen(false)} className="flex items-center gap-2">
              <Icon name="bundle" className="h-6 w-6 text-accent" strokeWidth={1.6} />
              <span className="font-display text-[19px] font-bold text-white">BulkTrack</span>
            </Link>
            <button onClick={() => setNavOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-hover lg:hidden">
              <Icon name="close" className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
          <div className="px-3 text-[10.5px] font-bold tracking-widest text-sidebar-muted">
            WHOLESALER ADMIN
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) =>
              item.children ? (
                <div key={item.to} className="flex flex-col gap-1">
                  <div
                    className={`flex items-center gap-1 rounded-lg pr-1.5 text-sm transition-colors ${
                      isFinancePath ? "bg-accent font-semibold text-white" : "text-sidebar-text hover:bg-sidebar-hover"
                    }`}
                  >
                    <NavLink to={item.to} onClick={() => setNavOpen(false)} className="flex flex-1 items-center gap-3 px-3 py-2.5">
                      <Icon name={item.icon} className="h-[18px] w-[18px]" strokeWidth={1.7} />
                      {item.label}
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => setFinanceOpen((o) => !o)}
                      aria-label={financeOpen ? "Collapse Finance" : "Expand Finance"}
                      aria-expanded={financeOpen}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md hover:bg-white/15"
                    >
                      <Icon name="arrowRight" className={`h-3.5 w-3.5 transition-transform ${financeOpen ? "rotate-90" : ""}`} strokeWidth={2.2} />
                    </button>
                  </div>
                  {financeOpen && (
                    <div className="ml-4 flex flex-col gap-1 border-l border-sidebar-border pl-3">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={() => setNavOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                              isActive ? "bg-sidebar-hover font-semibold text-white" : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
                            }`
                          }
                        >
                          <Icon name={child.icon} className="h-[15px] w-[15px]" strokeWidth={1.7} />
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setNavOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive ? "bg-accent font-semibold text-white" : "text-sidebar-text hover:bg-sidebar-hover"
                    }`
                  }
                >
                  <Icon name={item.icon} className="h-[18px] w-[18px]" strokeWidth={1.7} />
                  {item.label}
                </NavLink>
              )
            )}
          </nav>
        </div>
        <div
          className={`flex items-center gap-2 rounded-lg border-t border-sidebar-border p-3 ${
            onAccount ? "bg-sidebar-hover" : ""
          }`}
        >
          <Link to="/account" onClick={() => setNavOpen(false)} className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-sidebar-hover">
              <Icon name="user" className="h-[17px] w-[17px] text-sidebar-text" strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-semibold text-white">{displayName}</div>
              <div className="truncate text-[11.5px] text-sidebar-muted">{displayRole}</div>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            title="Log out"
            className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-md"
          >
            <Icon name="out" className="h-4 w-4 text-sidebar-muted" strokeWidth={1.7} />
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[64px] flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:h-[72px] sm:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md hover:bg-surface-2 lg:hidden">
              <Icon name="menu" className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <span className="truncate font-display text-[17px] font-bold sm:text-[19px]">{title}</span>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
            <NotificationBell />
            <Link to="/account" title="Account" className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-surface-2 hover:bg-border">
              <Icon name="user" className="h-[17px] w-[17px] text-ink-soft" strokeWidth={1.7} />
            </Link>
          </div>
        </div>
        <div className="min-w-0 flex-1 p-4 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
