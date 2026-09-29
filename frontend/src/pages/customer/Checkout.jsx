import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Field from "../../components/ui/Field";
import { useCart } from "../../context/CartContext";
import { money } from "../../data/mockData";

const DELIVERY_FEE = 350;
const METHODS = [
  { id: "cod", label: "Cash on Delivery", desc: "Pay when your bundle arrives", icon: "cash" },
  { id: "bank", label: "Bank Transfer", desc: "Direct deposit, confirmed manually", icon: "cashBank" },
  { id: "wallet", label: "Digital Wallet", desc: "Pay instantly online", icon: "wallet" },
];

export default function Checkout() {
  const { lines, subtotal, clearCart } = useCart();
  const [method, setMethod] = useState("cod");
  const navigate = useNavigate();
  const total = subtotal + DELIVERY_FEE;

  function placeOrder(e) {
    e.preventDefault();
    clearCart();
    navigate("/app/orders/SL-1042");
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-base font-semibold">Your cart is empty</p>
        <Link to="/app/bundles" className="btn-primary">
          Browse Bundles
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={placeOrder} className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="flex flex-col gap-6">
        <div className="card flex flex-col gap-4">
          <span className="text-[15px] font-semibold">Delivery Details</span>
          <div className="flex gap-3.5">
            <Field label="Business Name" defaultValue="Him Traders" className="flex-1" required />
            <Field label="Phone" defaultValue="981-2345678" className="flex-1" required />
          </div>
          <Field label="Delivery Address" defaultValue="Bagar Road, near Bus Park, Pokhara" required />
          <div className="flex gap-3.5">
            <Field label="City" defaultValue="Pokhara" className="flex-1" required />
            <Field label="Delivery Notes (optional)" placeholder="Call on arrival" className="flex-1" />
          </div>
        </div>

        <div className="card flex flex-col gap-4">
          <span className="text-[15px] font-semibold">Payment Method</span>
          <div className="flex flex-col gap-2.5">
            {METHODS.map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-center gap-3.5 rounded-lg border p-3.5 ${
                  method === m.id ? "border-[1.5px] border-accent bg-accent-soft" : "border-border hover:border-ink-soft/30"
                }`}
              >
                <Icon name={m.icon} className={`h-5 w-5 ${method === m.id ? "text-accent-text" : "text-ink-soft"}`} strokeWidth={1.6} />
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${method === m.id ? "text-accent-ink" : ""}`}>{m.label}</div>
                  <div className={`text-xs ${method === m.id ? "text-accent-text" : "text-muted"}`}>{m.desc}</div>
                </div>
                <input
                  type="radio"
                  name="method"
                  checked={method === m.id}
                  onChange={() => setMethod(m.id)}
                  className="h-[18px] w-[18px] accent-accent"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="card flex h-fit flex-col gap-4">
        <span className="text-[15px] font-semibold">Order Summary</span>
        <div className="flex flex-col gap-2.5">
          {lines.map(({ product, qty }) => (
            <div key={product.id} className="flex justify-between text-[13.5px]">
              <span>{product.name} × {qty}</span>
              <span>{money(product.price * qty)}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2.5 border-t border-border pt-3">
          <div className="flex justify-between text-[13.5px] text-ink-soft">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[13.5px] text-ink-soft">
            <span>Estimated delivery</span>
            <span>{money(DELIVERY_FEE)}</span>
          </div>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
        <button type="submit" className="btn-primary w-full">
          Place Order
        </button>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Icon name="check" className="h-3.5 w-3.5 text-teal" strokeWidth={2} />
          You'll get a tracking number immediately after placing this order.
        </div>
      </div>
    </form>
  );
}
