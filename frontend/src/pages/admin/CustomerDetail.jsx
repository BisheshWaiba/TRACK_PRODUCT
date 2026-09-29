import { Link, useParams } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import {
  customerById,
  salesForCustomer,
  productById,
  saleTotal,
  salePaymentStatus,
  getCustomerStats,
  payments,
  money,
} from "../../data/mockData";

export default function CustomerDetail() {
  const { id } = useParams();
  const customer = customerById(id);

  if (!customer) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-base font-semibold">Customer not found</p>
        <Link to="/admin/customers" className="btn-primary">Back to Customers</Link>
      </div>
    );
  }

  const stats = getCustomerStats(customer.id);
  const custSales = salesForCustomer(customer.id);
  const custPayments = payments.filter((p) => custSales.some((s) => s.id === p.saleId));
  const status = stats.outstanding <= 0 ? "Paid Up" : stats.outstanding < stats.totalPurchases * 0.3 ? "Partial" : "Pending";
  const initials = customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-[13px]">
        <Link to="/admin/customers" className="font-semibold text-muted hover:text-ink">Customers</Link>
        <span className="text-muted">/</span>
        <span className="font-bold">{customer.name}</span>
      </div>

      <div className="card flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-ink-soft">
            {initials}
          </div>
          <div>
            <div className="font-display text-lg font-bold">{customer.name}</div>
            <div className="mt-1.5 flex flex-wrap gap-4 text-[13px] text-ink-soft">
              <span className="flex items-center gap-1.5"><Icon name="user" className="h-3.5 w-3.5 text-muted" strokeWidth={1.8} />{customer.contact}</span>
              <span className="flex items-center gap-1.5"><Icon name="phone" className="h-3.5 w-3.5 text-muted" strokeWidth={1.8} />{customer.phone}</span>
              <span className="flex items-center gap-1.5"><Icon name="pin" className="h-3.5 w-3.5 text-muted" strokeWidth={1.8} />{customer.address}</span>
            </div>
          </div>
        </div>
        <Badge tone={status === "Paid Up" ? "teal" : status === "Partial" ? "slate" : "accent"}>{status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <div className="card"><span className="text-xs font-semibold text-muted">TOTAL PURCHASES</span><div className="mt-1.5 font-display text-xl font-bold">{money(stats.totalPurchases)}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">TOTAL PAID</span><div className="mt-1.5 font-display text-xl font-bold text-teal">{money(stats.totalPaid)}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">OUTSTANDING BALANCE</span><div className={`mt-1.5 font-display text-xl font-bold ${stats.outstanding > 0 ? "text-danger" : ""}`}>{money(stats.outstanding)}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">UNITS TAKEN</span><div className="mt-1.5 font-display text-xl font-bold">{stats.unitsTaken}</div></div>
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-[15px] font-semibold">Purchase history</span>
        <div className="overflow-x-auto rounded-xl2 border border-border bg-surface">
          <div className="grid min-w-[700px] grid-cols-[1fr_1.6fr_0.6fr_1fr_1fr_1fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11.5px] font-bold tracking-wide text-muted">
            <span>DATE</span><span>PRODUCT</span><span>QTY</span><span>UNIT PRICE</span><span>TOTAL</span><span>PAYMENT</span>
          </div>
          {custSales.map((s) => {
            const product = productById(s.productId);
            const payStatus = salePaymentStatus(s);
            return (
              <div key={s.id} className="grid min-w-[700px] grid-cols-[1fr_1.6fr_0.6fr_1fr_1fr_1fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg">
                <span className="text-ink-soft">{s.date}</span>
                <span>{product?.name}</span>
                <span>{s.qty}</span>
                <span>{money(product.price)}</span>
                <span className="font-semibold">{money(saleTotal(s))}</span>
                <Badge tone={payStatus === "Paid" ? "teal" : payStatus === "Partial" ? "slate" : "accent"}>{payStatus}</Badge>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-[15px] font-semibold">Payment history</span>
        <div className="overflow-x-auto rounded-xl2 border border-border bg-surface">
          <div className="grid min-w-[600px] grid-cols-[1fr_1.4fr_1fr_1fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11.5px] font-bold tracking-wide text-muted">
            <span>DATE</span><span>METHOD</span><span>AMOUNT</span><span>SALE REF</span>
          </div>
          {custPayments.map((p) => (
            <div key={p.id} className="grid min-w-[600px] grid-cols-[1fr_1.4fr_1fr_1fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg">
              <span className="text-ink-soft">{p.date}</span>
              <span>{p.method}</span>
              <span className="font-semibold">{money(p.amount)}</span>
              <span className="font-mono text-muted">{p.saleId}</span>
            </div>
          ))}
          {custPayments.length === 0 && <div className="px-5 py-6 text-center text-sm text-muted">No payments recorded yet.</div>}
        </div>
      </div>
    </div>
  );
}
