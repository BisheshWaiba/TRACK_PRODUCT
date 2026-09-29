import { Link, NavLink } from "react-router-dom";
import Icon from "../icons/Icon";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/bundles", label: "Bundles" },
  { to: "/track", label: "Track Order" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function PublicNav() {
  return (
    <div className="flex h-[84px] flex-shrink-0 items-center justify-between border-b border-border px-20">
      <Link to="/" className="flex items-center gap-2.5">
        <Icon name="bundle" className="h-[26px] w-[26px] text-accent" strokeWidth={1.6} />
        <span className="font-display text-[22px] font-bold tracking-tight">BulkTrack</span>
      </Link>
      <div className="hidden items-center gap-10 text-[15px] font-medium md:flex">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => (isActive ? "text-accent" : "transition-colors hover:text-accent")}
          >
            {l.label}
          </NavLink>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Link to="/login" className="btn-ghost !px-5 !py-2.5">
          Log In
        </Link>
        <Link to="/register" className="btn-primary !px-5 !py-2.5">
          Register
        </Link>
      </div>
    </div>
  );
}
