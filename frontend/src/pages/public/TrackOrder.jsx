import { useState } from "react";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import { sales, productById, customerById } from "../../data/mockData";
import { STATUS_FLOW, buildTimeline } from "../../data/tracking";

export default function TrackOrder() {
  const [input, setInput] = useState("SL-1042");
  const [sale, setSale] = useState(() => sales.find((s) => s.id === "SL-1042"));
  const [notFound, setNotFound] = useState(false);

  function handleTrack(e) {
    e.preventDefault();
    const found = sales.find((s) => s.id.toLowerCase() === input.trim().toLowerCase());
    setSale(found || null);
    setNotFound(!found);
  }

  const product = sale ? productById(sale.productId) : null;
  const customer = sale ? customerById(sale.customerId) : null;
  const timeline = sale ? buildTimeline(sale.status, sale.date) : [];
  const isDelivered = sale?.status === "Delivered";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-14 md:px-0">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-semibold tracking-wide text-accent-text">
          PUBLIC TRACKING · NO LOGIN NEEDED
        </div>
        <h1 className="font-display text-3xl font-bold">Track your shipment</h1>
        <p className="text-[15px] text-ink-soft">Enter the tracking number from your order confirmation.</p>
        <form onSubmit={handleTrack} className="flex w-full max-w-lg gap-2.5">
          <div className="field flex flex-1 items-center gap-2.5">
            <Icon name="search" className="h-[17px] w-[17px] text-muted" strokeWidth={2} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. SL-1042"
              className="flex-1 border-none bg-transparent font-mono text-sm outline-none"
            />
          </div>
          <button className="btn-primary whitespace-nowrap">Track Shipment</button>
        </form>
      </div>

      {notFound && (
        <div className="rounded-xl border border-danger/40 bg-danger-soft p-5 text-center text-sm text-danger">
          We couldn't find a shipment with that tracking number. Try <span className="font-mono font-semibold">SL-1042</span>.
        </div>
      )}

      {sale && product && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border pb-5">
            <div className="flex items-center gap-4">
              <span className="font-mono text-lg font-semibold">{sale.id}</span>
              <Badge tone={isDelivered ? "teal" : "accent"} pulse={!isDelivered}>
                {sale.status}
              </Badge>
            </div>
            <span className="text-[13px] text-muted">{product.name} × {sale.qty}</span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-5">
              <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted">
                <Icon name="box" className="h-[15px] w-[15px]" strokeWidth={1.8} />
                ORIGIN
              </div>
              <div className="text-base font-semibold">Kathmandu Warehouse</div>
            </div>
            <div className="rounded-xl border-[1.5px] border-accent bg-accent-soft p-5">
              <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold tracking-wide text-accent-text">
                <Icon name="pin" className="h-[15px] w-[15px]" strokeWidth={1.8} />
                CURRENT LOCATION
              </div>
              <div className="text-base font-semibold text-accent-ink">
                {timeline[timeline.length - 1]?.location || "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border p-5">
              <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted">
                <Icon name="check" className="h-[15px] w-[15px]" strokeWidth={1.8} />
                DESTINATION
              </div>
              <div className="text-base font-semibold">{customer?.city || "—"}</div>
            </div>
          </div>

          {!isDelivered && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-soft p-5 text-slate">
              <Icon name="clock" className="h-5 w-5" strokeWidth={1.7} />
              <span className="text-[14.5px]">
                Estimated delivery: <strong>Within 2–3 business days</strong>
              </span>
            </div>
          )}

          <div className="flex flex-col gap-5">
            <div className="text-lg font-semibold">Shipment history</div>
            <div className="flex flex-col">
              {timeline.map((step, i) => (
                <div key={step.status} className="flex gap-4">
                  <div className="flex w-5 flex-col items-center">
                    <div className={`h-3.5 w-3.5 flex-shrink-0 rounded-full ${i === timeline.length - 1 && !isDelivered ? "bg-accent" : "bg-teal"}`} />
                    {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-teal" style={{ minHeight: 36 }} />}
                  </div>
                  <div
                    className={`mb-2 flex-1 rounded-xl border p-4 ${
                      i === timeline.length - 1 && !isDelivered ? "border-[1.5px] border-accent bg-accent-soft" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold">
                          {step.location} — {step.status}
                        </div>
                        <div className="mt-1 text-[13px] text-ink-soft">{step.note}</div>
                      </div>
                      <span className="whitespace-nowrap text-xs text-muted">{step.time}</span>
                    </div>
                  </div>
                </div>
              ))}
              {!isDelivered && STATUS_FLOW.indexOf(sale.status) < STATUS_FLOW.length - 1 && (
                <div className="flex gap-4">
                  <div className="flex w-5 flex-col items-center">
                    <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-border bg-white" />
                  </div>
                  <div className="mb-2 flex-1 rounded-xl border border-dashed border-border p-4 text-muted">
                    <div className="text-sm font-semibold">{STATUS_FLOW[STATUS_FLOW.indexOf(sale.status) + 1]}</div>
                    <div className="mt-1 text-[13px]">Pending next update.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
