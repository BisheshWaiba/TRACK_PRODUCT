import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import { useCart } from "../../context/CartContext";
import { money, stockStatus } from "../../data/mockData";

const DELIVERY_FEE = 350;

export default function Cart() {
  const { lines, subtotal, setQty, removeFromCart } = useCart();
  const total = lines.length ? subtotal + DELIVERY_FEE : 0;

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Icon name="cart" className="h-10 w-10 text-muted" strokeWidth={1.3} />
        <p className="text-base font-semibold">Your cart is empty</p>
        <Link to="/app/bundles" className="btn-primary">
          Browse Bundles
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="flex flex-col gap-4">
        {lines.map(({ product, qty }) => {
          const status = stockStatus(product);
          const available = product.stockTotal - product.stockTaken;
          return (
            <div key={product.id} className="card flex items-center gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                <Icon name="box" className="h-7 w-7" strokeWidth={1.3} />
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-semibold">{product.name}</div>
                <div className="mt-1 text-xs text-muted">{product.items.join(", ")}</div>
                <div className={`mt-1 text-[11.5px] font-semibold ${status.tone === "danger" ? "text-danger" : status.tone === "teal" ? "text-teal" : "text-accent-text"}`}>
                  {available} left in stock
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border border-border px-2.5 py-1.5">
                <button
                  onClick={() => setQty(product.id, qty - 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-base font-semibold hover:bg-surface-2"
                >
                  –
                </button>
                <span className="w-4 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty(product.id, Math.min(qty + 1, available))}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-base font-semibold hover:bg-surface-2"
                >
                  +
                </button>
              </div>
              <div className="w-[100px] text-right font-display text-base font-bold">{money(product.price * qty)}</div>
              <button onClick={() => removeFromCart(product.id)} className="text-muted hover:text-danger">
                <Icon name="close" className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </button>
            </div>
          );
        })}
        <Link to="/app/bundles" className="mt-1 text-[13.5px] font-semibold text-accent hover:underline">
          ← Continue browsing
        </Link>
      </div>

      <div className="card flex h-fit flex-col gap-4">
        <span className="text-[15px] font-semibold">Order Summary</span>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold">Deliver to</label>
          <div className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-3">
            <Icon name="pin" className="h-4 w-4 text-muted" strokeWidth={1.8} />
            <span className="text-[13.5px]">Him Traders, Bagar Road, Pokhara</span>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 border-t border-border pt-3">
          <div className="flex justify-between text-[13.5px] text-ink-soft">
            <span>Subtotal ({lines.reduce((s, l) => s + l.qty, 0)} items)</span>
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
        <Link to="/app/checkout" className="btn-primary w-full">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
