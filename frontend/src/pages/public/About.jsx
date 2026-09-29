import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";

const values = [
  { icon: "check", title: "Reliability", text: "Every order gets a tracking number the moment it is confirmed — no lost paperwork, no guesswork." },
  { icon: "eye", title: "Transparency", text: "Retailers see the exact same stock and status our warehouse team sees — nothing hidden behind a phone call." },
  { icon: "clock", title: "Speed", text: "From confirmed order to dispatched shipment in under two hours, on average, across our warehouses." },
];

const stats = [
  ["2023", "Founded in Kathmandu"],
  ["120+", "Retail partners"],
  ["6", "Warehouses nationwide"],
  ["38", "Delivery partners"],
];

export default function About() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center gap-5 px-6 py-16 text-center md:px-20">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-semibold tracking-wide text-accent-text">
          ABOUT BULKTRACK
        </div>
        <h1 className="max-w-2xl font-display text-3xl font-bold md:text-4xl">Built by a wholesaler, for wholesalers</h1>
        <p className="max-w-xl text-base leading-relaxed text-ink-soft">
          BulkTrack started in Kathmandu in 2023 after one too many phone calls asking "where is my order?" Today it
          powers bundle ordering and stock tracking for wholesalers shipping across Nepal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-7 px-6 pb-16 sm:grid-cols-3 md:px-20">
        {values.map((v) => (
          <div key={v.title} className="flex flex-col gap-3.5 rounded-2xl border border-border p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
              <Icon name={v.icon} className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </div>
            <div className="text-base font-semibold">{v.title}</div>
            <div className="text-sm leading-relaxed text-ink-soft">{v.text}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-around gap-6 bg-surface-2 px-6 py-14 md:px-20">
        {stats.map(([n, l]) => (
          <div key={l} className="text-center">
            <div className="font-display text-[30px] font-bold">{n}</div>
            <div className="mt-1 text-[13px] text-ink-soft">{l}</div>
          </div>
        ))}
      </div>

      <div className="px-6 py-10 text-center md:px-20">
        <Link to="/contact" className="text-sm font-semibold text-accent hover:underline">
          Get in touch →
        </Link>
      </div>
    </div>
  );
}
