import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import BundleCard from "../../components/ui/BundleCard";
import ProgressBar from "../../components/ui/ProgressBar";
import { products, money, stockStatus } from "../../data/mockData";

const steps = [
  { icon: "bundle", title: "Browse & order bundles", text: "Choose a wholesale bundle and place a bulk order in minutes." },
  { icon: "box", title: "We pack & dispatch", text: "Your order gets a unique tracking number the moment it is confirmed." },
  { icon: "chart", title: "Stock tracked live", text: "See exactly how many units are taken and how many remain before you order." },
  { icon: "check", title: "Delivered & confirmed", text: "Our delivery team confirms drop-off and closes the loop." },
];

export default function Home() {
  const hero = products[0];
  const heroAvailable = hero.stockTotal - hero.stockTaken;
  const heroPct = Math.round((hero.stockTaken / hero.stockTotal) * 100);
  const featured = products.slice(0, 3);
  const ctaPreview = products.slice(0, 3);

  return (
    <>
      {/* HERO */}
      <div className="flex flex-col items-center gap-16 px-6 py-16 md:flex-row md:items-center md:px-20 md:py-24">
        <div className="flex flex-1 flex-col gap-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-semibold tracking-wide text-accent-text">
            WHOLESALE · STOCK TRACKED LIVE
          </div>
          <h1 className="max-w-xl font-display text-4xl font-bold leading-tight tracking-tight md:text-[56px]">
            Sell in bulk. Know exactly what's left.
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-ink-soft">
            BulkTrack tracks every bundle's stock in real time — how many have been taken, how many are left, and the
            current price — so your retailers never order into a shortage.
          </p>
          <div className="flex flex-wrap gap-3.5 pt-2">
            <Link to="/app/bundles" className="btn-primary">
              Browse Bundles
              <Icon name="arrowRight" className="h-[17px] w-[17px]" strokeWidth={2} />
            </Link>
            <Link to="/track" className="btn-ghost">
              Track an Order
            </Link>
          </div>
          <div className="flex items-center gap-2.5 pt-2 text-[13.5px] text-muted">
            <Icon name="check" className="h-4 w-4 text-teal" strokeWidth={2} />
            Trusted by 120+ retailers across Nepal
          </div>
        </div>

        <div className="flex flex-1 justify-center">
          <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-ink/10">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[15px] font-semibold">{hero.name}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-text">
                <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-accent-text" />
                Selling Fast
              </span>
            </div>
            <div className="mb-4 flex gap-2.5">
              <div className="flex-1 rounded-lg bg-surface-2 p-3 text-center">
                <div className="font-display text-lg font-bold">{hero.stockTotal}</div>
                <div className="mt-0.5 text-[10.5px] font-semibold text-muted">TOTAL STOCK</div>
              </div>
              <div className="flex-1 rounded-lg bg-surface-2 p-3 text-center">
                <div className="font-display text-lg font-bold text-ink-soft">{hero.stockTaken}</div>
                <div className="mt-0.5 text-[10.5px] font-semibold text-muted">TAKEN</div>
              </div>
              <div className="flex-1 rounded-lg bg-accent-soft p-3 text-center">
                <div className="font-display text-lg font-bold text-accent-text">{heroAvailable}</div>
                <div className="mt-0.5 text-[10.5px] font-semibold text-accent-text">LEFT</div>
              </div>
            </div>
            <ProgressBar percent={heroPct} tone="accent" height="h-2" />
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div>
                <div className="text-[11px] font-semibold text-muted">CURRENT PRICE</div>
                <div className="mt-0.5 font-display text-lg font-bold">{money(hero.price)}</div>
              </div>
              <span className="text-xs text-muted">Updated live as orders come in</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="flex flex-col gap-8 bg-surface-2 px-6 py-10 md:flex-row md:px-20">
        {[
          ["1,200+", "Bundles dispatched / month"],
          ["42", "Cities & towns served"],
          ["98.4%", "On-time delivery rate"],
          ["6", "Warehouses nationwide"],
        ].map(([n, l]) => (
          <div key={l} className="flex-1 text-center">
            <div className="font-display text-[34px] font-bold">{n}</div>
            <div className="mt-1 text-[13.5px] text-ink-soft">{l}</div>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <div className="flex flex-col gap-14 px-6 py-24 md:px-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">From bundle to doorstep in four steps</h2>
          <p className="max-w-lg text-base text-ink-soft">
            Every order is trackable the moment it is confirmed — no spreadsheets, no phone calls.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="group flex flex-col gap-4 rounded-2xl border border-border p-7">
              <div className="font-display text-xs font-bold text-muted">{String(i + 1).padStart(2, "0")}</div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-text transition-colors group-hover:bg-accent group-hover:text-white">
                <Icon name={s.icon} className="h-[22px] w-[22px]" strokeWidth={1.6} />
              </div>
              <div className="text-base font-semibold">{s.title}</div>
              <div className="text-sm leading-relaxed text-ink-soft">{s.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURED BUNDLES */}
      <div className="flex flex-col gap-8 px-6 pb-24 md:px-20">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold md:text-[32px]">Popular wholesale bundles</h2>
          <Link to="/bundles" className="text-sm font-semibold text-accent hover:underline">
            View all bundles →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <BundleCard
              key={p.id}
              product={p}
              action={
                <Link to="/login" className="btn-primary !px-4 !py-2.5 !text-[13px]">
                  View Bundle
                </Link>
              }
            />
          ))}
        </div>
      </div>

      {/* STOCK CTA */}
      <div className="flex flex-col items-center gap-8 bg-ink px-6 py-20 text-[#F5F2EA] md:px-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-display text-3xl font-bold">Never order into a shortage</h2>
          <p className="text-[15.5px] text-[#C9C3B4]">
            Every bundle shows live stock — taken, left, and current price — before you check out.
          </p>
        </div>
        <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {ctaPreview.map((p) => {
            const left = p.stockTotal - p.stockTaken;
            const status = stockStatus(p);
            return (
              <div key={p.id} className="rounded-xl border border-[#3A3730] bg-[#28261F] p-5">
                <div className="mb-2.5 flex justify-between">
                  <span className="text-[13.5px] font-semibold">{p.name}</span>
                  <span className={`text-[11.5px] font-semibold ${status.tone === "danger" ? "text-[#E39184]" : status.tone === "teal" ? "text-[#7FCAB0]" : "text-[#E2A583]"}`}>
                    {left} left
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#3A3730]">
                  <div
                    className={`h-full rounded-full ${status.tone === "danger" ? "bg-[#C1453A]" : status.tone === "teal" ? "bg-teal" : "bg-accent"}`}
                    style={{ width: `${Math.round((p.stockTaken / p.stockTotal) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <Link to="/bundles" className="btn-primary">
          View All Bundle Stock
        </Link>
      </div>
    </>
  );
}
