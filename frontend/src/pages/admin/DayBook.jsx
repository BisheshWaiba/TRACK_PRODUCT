import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import FinanceCrumb from "../../components/ui/FinanceCrumb";
import { money } from "../../lib/format";
import { useData } from "../../context/DataContext";
import { useFinance, today } from "../../context/FinanceContext";

// The spec's own five-item menu (FINANCE-SPEC.md §3.1): "Resist splitting
// this back into five buttons." Sale links to the existing Sales flow
// rather than a bill form - this app already has a real per-product sales
// screen the Jageer original doesn't need to duplicate.
const NEW_ENTRY_LINKS = [
  { to: "/received-payments?direction=received", label: "Received", icon: "arrowDown" },
  { to: "/received-payments?direction=payment_out", label: "Payment Out", icon: "arrowUp" },
  { to: "/sales", label: "Sale", icon: "receipt" },
  { to: "/purchases?add=1", label: "Purchase", icon: "cart" },
  { to: "/expenses?add=1", label: "Expense", icon: "arrowUp" },
];

function NewEntryMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn-primary">
        <Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} />
        New Entry
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 flex w-56 flex-col overflow-hidden rounded-xl2 border border-border bg-surface py-1.5 shadow-2xl">
            {NEW_ENTRY_LINKS.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-semibold hover:bg-surface-2">
                <Icon name={l.icon} className="h-4 w-4 text-ink-soft" strokeWidth={1.8} />
                {l.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// One day laid out like a paper cash book. Two kinds of row, and the
// difference is the whole point: a sale or a purchase bill shows what
// was BILLED and leaves the running balance alone; a payment, an expense
// or a supplier payment MOVES it. A sale therefore shows up twice - once
// when it is made, and again, for whatever was actually collected, when
// the money arrives.

const KIND = {
  received: { label: "Cash in", tone: "teal" },
  paid: { label: "Paid out", tone: "danger" },
  expense: { label: "Expense", tone: "danger" },
  sale: { label: "Sale", tone: "accent" },
  purchase: { label: "Purchase", tone: "slate" },
  transfer: { label: "Transfer", tone: "muted" },
};

function shiftDay(day, delta) {
  const [y, m, d] = day.split("-").map(Number);
  const next = new Date(y, m - 1, d + delta);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

function timeOf(at) {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const COLS = "grid-cols-[0.5fr_2fr_0.8fr_0.9fr_0.9fr_0.9fr_1fr]";

export default function DayBook() {
  const { loading: dataLoading } = useData();
  const { dayBookFor, bankAccounts, canEdit, updateEntry, deleteRow, loading } = useFinance();
  const [day, setDay] = useState(today());
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading || dataLoading) return <div className="p-8 text-sm text-muted">Loading the day book…</div>;

  const book = dayBookFor(day);
  const isToday = day === today();

  // Which table a row lives in, so it can be edited where it actually is.
  function tableOf(row) {
    if (row.kind === "transfer") return "account_transfers";
    if (row.kind === "expense" || row.kind === "purchase" || (row.kind === "sale" && row.billed && !row.locked)) {
      return "business_transactions";
    }
    return row.vendor ? "vendor_ledger_entries" : "customer_ledger_entries";
  }

  function openRow(row) {
    setConfirmDelete(false);
    setEditing({
      row,
      table: tableOf(row),
      amount: String(row.cashIn ?? row.cashOut ?? row.billed ?? ""),
      note: row.sub || "",
      date: day,
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    const amount = Number(editing.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setSaving(true);
    try {
      const patch = editing.table === "business_transactions"
        ? { amount, bill_date: editing.date, note: editing.note || null }
        : editing.table === "account_transfers"
          ? { amount, transfer_date: editing.date, note: editing.note || null }
          : { amount, entry_date: editing.date, note: editing.note || null };
      await updateEntry(editing.table, editing.row.id, patch);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    // Asked twice, in the sheet rather than a browser confirm: the second
    // tap lands under the finger that made the first.
    if (!confirmDelete) return setConfirmDelete(true);
    setSaving(true);
    try {
      await deleteRow(editing.table, editing.row.id);
      setEditing(null);
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  const num = (v, className = "") => (
    <span className={`text-right ${v == null ? "text-muted" : className}`}>{v == null ? "—" : money(v)}</span>
  );

  return (
    <div className="flex flex-col gap-6">
      <FinanceCrumb label="Day Book" />
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-display text-xl font-bold">Day Book</div>
          <div className="text-[13px] text-muted">{day}{isToday ? " · today" : ""}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setDay(shiftDay(day, -1))} aria-label="Previous day"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-surface-2">
            <Icon name="back" className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <input type="date" value={day} max={today()} onChange={(e) => e.target.value && setDay(e.target.value)} className="field !py-2" />
          <button onClick={() => setDay(shiftDay(day, 1))} disabled={isToday} aria-label="Next day"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-surface-2 disabled:opacity-30">
            <Icon name="back" className="h-4 w-4 rotate-180" strokeWidth={1.8} />
          </button>
          {!isToday && (
            <button onClick={() => setDay(today())} className="rounded-md bg-surface-2 px-3 py-2 text-[13px] font-semibold hover:bg-border">
              Today
            </button>
          )}
          <NewEntryMenu />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <div className="card"><span className="text-xs font-semibold text-muted">OPENING</span><div className="mt-1.5 font-display text-xl font-bold">{money(book.opening)}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">CASH IN</span><div className="mt-1.5 font-display text-xl font-bold text-teal">{money(book.totalIn)}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">CASH OUT</span><div className="mt-1.5 font-display text-xl font-bold text-danger">{money(book.totalOut)}</div></div>
        <div className="card"><span className="text-xs font-semibold text-muted">CLOSING</span><div className={`mt-1.5 font-display text-xl font-bold ${book.closing < 0 ? "text-danger" : "text-teal"}`}>{money(book.closing)}</div></div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
        <div className={`grid min-w-[900px] ${COLS} gap-2 bg-surface-2 px-5 py-3.5 text-[10.5px] font-bold tracking-wide text-muted`}>
          <span>TIME</span><span>DETAILS</span><span>TYPE</span>
          <span className="text-right">BILLED</span><span className="text-right">CASH IN</span>
          <span className="text-right">CASH OUT</span><span className="text-right">BALANCE</span>
        </div>

        <div className={`grid min-w-[900px] ${COLS} items-center gap-2 border-t border-border bg-bg px-5 py-3 text-[13px]`}>
          <span />
          <span className="font-semibold">Opening balance</span>
          <span className="text-muted">—</span>
          {num(null)}{num(null)}{num(null)}
          <span className="text-right font-semibold">{money(book.opening)}</span>
        </div>

        {book.rows.map((r) => (
          <button key={r.id} onClick={() => openRow(r)}
            className={`grid min-w-[900px] ${COLS} items-center gap-2 border-t border-border px-5 py-3.5 text-left text-[13px] hover:bg-bg`}>
            <span className="text-muted">{timeOf(r.at)}</span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{r.title}</span>
              {r.sub && <span className="block truncate text-[11.5px] text-muted">{r.sub}</span>}
            </span>
            <Badge tone={KIND[r.kind].tone}>{KIND[r.kind].label}</Badge>
            {num(r.billed)}
            {num(r.cashIn, "font-semibold text-teal")}
            {num(r.cashOut, "font-semibold text-danger")}
            <span className={`text-right font-semibold ${r.balance == null ? "text-muted" : ""}`}>
              {r.balance == null ? "—" : money(r.balance)}
            </span>
          </button>
        ))}

        <div className={`grid min-w-[900px] ${COLS} items-center gap-2 border-t border-border bg-surface-2 px-5 py-3.5 text-[13px] font-bold`}>
          <span /><span className="col-span-2 text-muted">
            Opening {money(book.opening)} + in {money(book.totalIn)} − out {money(book.totalOut)}
          </span>
          {num(null)}
          <span className="text-right text-teal">{money(book.totalIn)}</span>
          <span className="text-right text-danger">{money(book.totalOut)}</span>
          <span className={`text-right ${book.closing < 0 ? "text-danger" : ""}`}>{money(book.closing)}</span>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {book.rows.map((r) => (
          <button key={r.id} onClick={() => openRow(r)} className="card flex flex-col gap-2 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-semibold">{r.title}</div>
                {r.sub && <div className="truncate text-[11.5px] text-muted">{r.sub}</div>}
              </div>
              <Badge tone={KIND[r.kind].tone}>{KIND[r.kind].label}</Badge>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted">{timeOf(r.at)}</span>
              <span className={r.cashIn ? "font-semibold text-teal" : r.cashOut ? "font-semibold text-danger" : "text-muted"}>
                {r.cashIn ? "+" + money(r.cashIn) : r.cashOut ? "−" + money(r.cashOut) : money(r.billed) + " billed"}
              </span>
            </div>
          </button>
        ))}
        <div className="card flex items-center justify-between">
          <span className="text-xs font-semibold text-muted">CLOSING BALANCE</span>
          <span className={`font-display text-lg font-bold ${book.closing < 0 ? "text-danger" : ""}`}>{money(book.closing)}</span>
        </div>
      </div>

      {book.rows.length === 0 && (
        <div className="card text-center text-[13px] text-muted">Nothing was recorded on this day.</div>
      )}

      <p className="text-[12px] leading-5 text-muted">
        Sales and purchases show what was billed — they don't move the balance until the money actually arrives, which
        appears as its own cash row. Tap any entry to edit it.
      </p>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? editing.row.title : ""}>
        {editing && (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {editing.row.locked && (
              <div className="rounded-md border border-border bg-surface-2 p-3 text-[12.5px] text-ink-soft">
                This came from a {editing.row.kind === "sale" ? "sale" : "payment"} recorded elsewhere in the app. Change
                it there and this entry follows — editing it here would only be overwritten.
              </div>
            )}
            <Field label="Date" type="date" value={editing.date} disabled={editing.row.locked}
              onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            <Field label="Amount (NPR)" type="number" min="0" step="0.01" value={editing.amount} disabled={editing.row.locked}
              onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
            <Field label="Note" value={editing.note} disabled={editing.row.locked}
              onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
            {bankAccounts.length > 0 && (
              <p className="text-[12px] text-muted">
                Paid into: {editing.row.sub?.includes("Cash") ? "Cash" : "see the entry"}
              </p>
            )}
            {!editing.row.locked && canEdit({ source: "manual" }) && (
              <div className="flex flex-col gap-3">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button type="button" onClick={handleDelete} disabled={saving}
                  className={`rounded-md border px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
                    confirmDelete ? "border-danger bg-danger text-white" : "border-danger/50 bg-danger-soft text-danger hover:bg-danger/10"
                  }`}>
                  {confirmDelete ? "Tap again to delete for good" : "Delete entry"}
                </button>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}
