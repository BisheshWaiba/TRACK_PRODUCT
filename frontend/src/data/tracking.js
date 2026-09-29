export const STATUS_FLOW = [
  "Order Placed",
  "Confirmed",
  "Packing",
  "Ready for Dispatch",
  "Dispatched",
  "In Transit",
  "Out for Delivery",
  "Delivered",
];

// Descriptive timeline entries keyed by status, used to render history rows
// up to (and including) the sale's current status.
export function buildTimeline(status, date) {
  const idx = STATUS_FLOW.indexOf(status);
  const base = new Date(date);
  const entries = [
    { status: "Order Placed", location: "Online", note: "Order received and awaiting confirmation." },
    { status: "Confirmed", location: "Kathmandu Warehouse", note: "Order confirmed and queued for packing." },
    { status: "Packing", location: "Kathmandu Warehouse", note: "Bundle packed and staged for dispatch." },
    { status: "Ready for Dispatch", location: "Kathmandu Warehouse", note: "Ready to be handed to the delivery partner." },
    { status: "Dispatched", location: "Kathmandu", note: "Handed to delivery partner for outbound transit." },
    { status: "In Transit", location: "Hetauda", note: "Shipment scanned at Hetauda transit hub." },
    { status: "Out for Delivery", location: "Destination city", note: "Out for final delivery." },
    { status: "Delivered", location: "Destination", note: "Delivered and confirmed by the customer." },
  ];
  return entries.slice(0, idx + 1).map((e, i) => ({
    ...e,
    time: new Date(base.getTime() + i * 1000 * 60 * 60 * 5).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    done: true,
  }));
}
