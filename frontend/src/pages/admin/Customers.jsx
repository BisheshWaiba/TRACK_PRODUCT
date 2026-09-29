import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { customers as initialCustomers, getCustomerStats, money } from "../../data/mockData";

export default function Customers() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ name: "", contact: "", phone: "", address: "" });

  const shown = customers.filter(
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.contact.toLowerCase().includes(query.toLowerCase())
  );

  function handleSave(e) {
    e.preventDefault();
    const id = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);
    setCustomers((prev) => [...prev, { id, ...form, city: form.address.split(",").pop()?.trim() || "", joined: new Date().toISOString().slice(0, 10) }]);
    setForm({ name: "", contact: "", phone: "", address: "" });
    setModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="field flex w-full items-center gap-2 sm:w-64">
          <Icon name="search" className="h-4 w-4 text-muted" strokeWidth={2} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…" className="flex-1 border-none bg-transparent text-sm outline-none" />
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} />
          Add Customer
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-border bg-surface">
        <div className="grid min-w-[900px] grid-cols-[1.8fr_1.3fr_1.2fr_1fr_1.1fr_1fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11px] font-bold tracking-wide text-muted">
          <span>BUSINESS / CONTACT</span><span>PHONE</span><span>UNITS TAKEN</span><span>TOTAL PURCHASES</span><span>OUTSTANDING</span><span>STATUS</span>
        </div>
        {shown.map((c) => {
          const stats = getCustomerStats(c.id);
          const status = stats.outstanding <= 0 ? "Paid Up" : stats.outstanding < stats.totalPurchases * 0.3 ? "Partial" : "Pending";
          const initials = c.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
          return (
            <Link
              to={`/admin/customers/${c.id}`}
              key={c.id}
              className="grid min-w-[900px] grid-cols-[1.8fr_1.3fr_1.2fr_1fr_1.1fr_1fr] items-center gap-2 border-t border-border px-5 py-4 text-[13px] hover:bg-bg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-[13px] font-bold text-ink-soft">
                  {initials}
                </div>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-[11.5px] text-muted">{c.contact} · {c.city}</div>
                </div>
              </div>
              <span>{c.phone}</span>
              <span className="font-semibold">{stats.unitsTaken} units</span>
              <span className="font-semibold">{money(stats.totalPurchases)}</span>
              <span className={stats.outstanding > 0 ? "font-semibold text-danger" : "font-semibold text-teal"}>{money(stats.outstanding)}</span>
              <Badge tone={status === "Paid Up" ? "teal" : status === "Partial" ? "slate" : "accent"}>{status}</Badge>
            </Link>
          );
        })}
        {shown.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted">No customers found.</div>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Customer" width="max-w-[460px]">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex gap-3.5">
            <Field label="Business Name" placeholder="Annapurna Store" className="flex-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Field label="Contact Person" placeholder="Krishna Bhattarai" className="flex-1" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required />
          </div>
          <Field label="Phone" placeholder="98XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Field label="Address" placeholder="Lakeside, Pokhara" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Customer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
