import { Link } from "react-router-dom";
import Icon from "../icons/Icon";

export default function PublicFooter() {
  return (
    <div className="flex flex-shrink-0 flex-col gap-12 px-20 pb-12 pt-16">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2">
            <Icon name="bundle" className="h-[22px] w-[22px] text-accent" strokeWidth={1.6} />
            <span className="font-display text-lg font-bold">BulkTrack</span>
          </div>
          <p className="max-w-[260px] text-[13.5px] leading-relaxed text-muted">
            Wholesale bundle ordering and stock tracking, built for wholesalers who ship in bulk.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold tracking-wide text-muted">COMPANY</div>
          <Link to="/about" className="text-sm hover:text-accent">About</Link>
          <Link to="/contact" className="text-sm hover:text-accent">Contact</Link>
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold tracking-wide text-muted">FOR RETAILERS</div>
          <Link to="/bundles" className="text-sm hover:text-accent">Browse Bundles</Link>
          <Link to="/track" className="text-sm hover:text-accent">Track Order</Link>
          <Link to="/login" className="text-sm hover:text-accent">Log In</Link>
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold tracking-wide text-muted">FOR WHOLESALERS</div>
          <Link to="/admin/login" className="text-sm hover:text-accent">Wholesaler Login</Link>
        </div>
      </div>
      <div className="flex justify-between border-t border-border pt-6 text-xs text-muted">
        <span>© 2026 BulkTrack. All rights reserved.</span>
        <span>Built for wholesalers who ship in bulk.</span>
      </div>
    </div>
  );
}
