import Icon from "../icons/Icon";
import ProgressBar from "./ProgressBar";
import { money, stockStatus } from "../../data/mockData";

export default function BundleCard({ product, action }) {
  const available = product.stockTotal - product.stockTaken;
  const status = stockStatus(product);
  const pctTaken = Math.round((product.stockTaken / product.stockTotal) * 100);

  return (
    <div className="card flex flex-col gap-3 !p-0 overflow-hidden">
      <div className="flex h-[120px] items-center justify-center bg-surface-2 text-muted">
        <Icon name="box" className="h-9 w-9" strokeWidth={1.3} />
      </div>
      <div className="flex flex-col gap-3 p-5">
        <div className="text-base font-semibold">{product.name}</div>
        <div className="flex flex-wrap gap-1.5">
          {product.items.map((item) => (
            <span key={item} className="rounded-full bg-surface-2 px-2.5 py-1 text-[11.5px]">
              {item}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px]">
            <span className={`font-semibold ${status.tone === "danger" ? "text-danger" : status.tone === "accent" ? "text-accent-text" : status.tone === "ink" ? "text-ink" : "text-teal"}`}>
              {status.label}
            </span>
            <span className="text-muted">{available} left of {product.stockTotal}</span>
          </div>
          <ProgressBar percent={pctTaken} tone={status.tone === "danger" ? "danger" : status.tone === "ink" ? "ink" : "accent"} />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="font-display text-lg font-bold">{money(product.price)}</span>
          {action}
        </div>
      </div>
    </div>
  );
}
