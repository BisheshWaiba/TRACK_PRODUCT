import { Link, useParams } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import { sales, productById, customerById, saleTotal, salePaymentStatus, money } from "../../data/mockData";
import { STATUS_FLOW } from "../../data/tracking";

const DELIVERY_FEE = 350;

export default function OrderDetails() {
  const { id } = useParams();
  const sale = sales.find((s) => s.id === id);

  if (!sale) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-base font-semibold">Order not found</p>
        <Link to="/app/orders" className="btn-primary">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const product = productById(sale.productId);
  const customer = customerById(sale.customerId);
  const total = saleTotal(sale) + DELIVERY_FEE;
  const paymentStatus = salePaymentStatus(sale);
  const currentIdx = STATUS_FLOW.indexOf(sale.status);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-xl font-bold">Order {sale.id}</div>
            <div className="mt-1 text-[13px] text-muted">
              Placed on {sale.date} · {product?.name}
            </div>
          </div>
          <Badge tone={sale.status === "Delivered" ? "teal" : "accent"} pulse={sale.status !== "Delivered"}>
            {sale.status}
          </Badge>
        </div>

        <div className="overflow-hidden rounded-xl2 border border-border bg-surface">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] bg-surface-2 px-5 py-3.5 text-[11px] font-bold tracking-wide text-muted">
            <span>ITEM</span>
            <span>QTY</span>
            <span>UNIT PRICE</span>
            <span>SUBTOTAL</span>
          </div>
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-2 border-t border-border px-5 py-4 text-[13.5px]">
            <span className="font-semibold">{product?.name}</span>
            <span>{sale.qty}</span>
            <span>{money(product.price)}</span>
            <span>{money(product.price * sale.qty)}</span>
          </div>
          <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
            <div className="flex justify-between text-[13px] text-ink-soft">
              <span>Subtotal</span>
              <span>{money(product.price * sale.qty)}</span>
            </div>
            <div className="flex justify-between text-[13px] text-ink-soft">
              <span>Delivery</span>
              <span>{money(DELIVERY_FEE)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-[15px] font-bold">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>
        </div>

        <div className="card flex flex-col gap-4">
          <span className="text-[15px] font-semibold">Shipment Progress</span>
          <div className="flex items-center">
            {["Packing", "Dispatched", "In Transit", "Out for Delivery", "Delivered"].map((label, i) => {
              const stepIdx = STATUS_FLOW.indexOf(label);
              const state = stepIdx < currentIdx ? "done" : stepIdx === currentIdx ? "current" : "pending";
              return (
                <div key={label} className="flex flex-1 items-center">
                  <div className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                        state === "done"
                          ? "bg-teal text-white"
                          : state === "current"
                          ? "bg-accent text-white"
                          : "bg-surface-2 text-muted"
                      }`}
                    >
                      {state === "done" ? "✓" : i + 1}
                    </div>
                    <span className={`text-center text-[11.5px] ${state === "pending" ? "text-muted" : "font-semibold"}`}>{label}</span>
                  </div>
                  {i < 4 && (
                    <div className={`mb-5 h-0.5 flex-1 ${stepIdx < currentIdx ? "bg-teal" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <Link to="/app/track" className="self-start text-[13.5px] font-semibold text-accent hover:underline">
            View full tracking timeline →
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="card flex flex-col gap-3.5">
          <span className="text-[14.5px] font-semibold">Delivery Details</span>
          <div className="flex items-start gap-2.5 text-[13.5px] text-ink-soft">
            {customer?.name}, {customer?.address}
          </div>
          <div className="flex justify-between border-t border-border pt-2.5 text-[13px]">
            <span className="text-muted">Payment</span>
            <Badge tone={paymentStatus === "Paid" ? "teal" : paymentStatus === "Partial" ? "slate" : "accent"}>{paymentStatus}</Badge>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-muted">Estimated delivery</span>
            <span className="font-semibold">2–3 business days</span>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <button className="w-full rounded-lg border border-border bg-surface py-3 text-[13.5px] font-semibold">
            Reorder this bundle
          </button>
          <button className="w-full rounded-lg border border-border bg-surface py-3 text-[13.5px] font-semibold text-danger">
            Cancel order
          </button>
        </div>
      </div>
    </div>
  );
}
