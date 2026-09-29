import { useState } from "react";
import Badge from "../../components/ui/Badge";
import Icon from "../../components/icons/Icon";
import { sales, productById, money, saleTotal } from "../../data/mockData";
import { STATUS_FLOW, buildTimeline } from "../../data/tracking";

const CURRENT_CUSTOMER = "him-traders";

export default function TrackShipment() {
  const myOrders = sales.filter((s) => s.customerId === CURRENT_CUSTOMER && s.status !== "Delivered");
  const [selectedId, setSelectedId] = useState(myOrders[0]?.id);
  const sale = sales.find((s) => s.id === selectedId) || myOrders[0];

  if (!sale) {
    return <p className="text-sm text-muted">You have no active shipments right now.</p>;
  }

  const product = productById(sale.productId);
  const timeline = buildTimeline(sale.status, sale.date);
  const isDelivered = sale.status === "Delivered";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-mono text-lg font-semibold">{sale.id}</span>
          <Badge tone={isDelivered ? "teal" : "accent"} pulse={!isDelivered}>
            {sale.status}
          </Badge>
        </div>
        {myOrders.length > 1 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-sm font-semibold"
          >
            {myOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id}
              </option>
            ))}
          </select>
        )}
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
          <div className="text-base font-semibold text-accent-ink">{timeline[timeline.length - 1]?.location}</div>
        </div>
        <div className="rounded-xl border border-border p-5">
          <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted">
            <Icon name="check" className="h-[15px] w-[15px]" strokeWidth={1.8} />
            BUNDLE
          </div>
          <div className="text-base font-semibold">{product?.name} × {sale.qty}</div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-slate-soft p-5 text-slate">
        <Icon name="clock" className="h-5 w-5" strokeWidth={1.7} />
        <span className="text-[14.5px]">
          {money(saleTotal(sale))} · Estimated delivery within 2–3 business days
        </span>
      </div>

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
  );
}
