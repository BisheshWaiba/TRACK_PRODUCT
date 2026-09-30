import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import FinanceCrumb from "../../components/ui/FinanceCrumb";
import { money } from "../../lib/format";
import { useData } from "../../context/DataContext";
import { useFinance, today } from "../../context/FinanceContext";

function blankForm(direction, no) {
  return { direction, partyName: "", partyId: null, no, noTouched: false, amount: "", date: today(), note: "", bankAccountId: "" };
}

export default function ReceivedPayments() {
  const { customers, createCustomer, loading: dataLoading } = useData();
  const { bankAccounts, customerEntries, vendorEntries, nextReceiptNo, nextPaymentNo, recordReceipt, recordPayout, loading: financeLoading } = useFinance();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(() => blankForm("received", nextReceiptNo()));
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Reached from the Finance hub's "Received"/"Payment Out" shortcuts with
  // ?direction=received|payment_out - open straight into that direction.
  // Waits on financeLoading so nextReceiptNo()/nextPaymentNo() see real
  // entries instead of computing "001" against still-empty arrays.
  useEffect(() => {
    if (financeLoading) return;
    const direction = searchParams.get("direction");
    if (direction === "received" || direction === "payment_out") {
      openModal(direction);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financeLoading]);

  if (dataLoading || financeLoading) return <div className="p-8 text-sm text-muted">Loading…</div>;

  function openModal(direction) {
    setForm(blankForm(direction, direction === "received" ? nextReceiptNo() : nextPaymentNo()));
    setJustSaved(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setJustSaved(false);
  }

  function setDirection(direction) {
    setForm((f) => ({
      ...f,
      direction,
      no: f.noTouched ? f.no : direction === "received" ? nextReceiptNo() : nextPaymentNo(),
    }));
  }

  function partyNameChange(value) {
    const match = customers.find((c) => c.name.toLowerCase() === value.trim().toLowerCase());
    setForm((f) => ({ ...f, partyName: value, partyId: match ? match.id : null }));
  }

  async function handleSave(e) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.partyName.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setSaving(true);
    try {
      let partyId = form.partyId;
      if (!partyId) partyId = await createCustomer({ name: form.partyName.trim() });
      const payload = {
        amount, date: form.date, receiptNo: form.no || null, note: form.note || null,
        bankAccountId: form.bankAccountId || null,
      };
      if (form.direction === "received") await recordReceipt({ ...payload, customerId: partyId });
      else await recordPayout({ ...payload, vendorId: partyId });
      // Stays open for the next one - the spec's own multi-row table idea
      // (one date/method/direction, several people and amounts) for a
      // sidebar app: same direction, date and method, next number in the
      // sequence, party/amount/note cleared. nextReceiptNo()/nextPaymentNo()
      // aren't safe to call here - they read customerEntries/vendorEntries
      // from this render's closure, which is still the pre-save list even
      // though the save just refreshed it - so the number after the one
      // just used is worked out directly instead.
      const digits = Number(String(form.no).replace(/\D/g, ""));
      const nextNo = digits > 0 ? String(digits + 1).padStart(3, "0") : (form.direction === "received" ? nextReceiptNo() : nextPaymentNo());
      setForm({ direction: form.direction, partyName: "", partyId: null, no: nextNo, noTouched: false, amount: "", date: form.date, note: "", bankAccountId: form.bankAccountId });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 4000);
    } finally {
      setSaving(false);
    }
  }

  const feed = [
    ...customerEntries.filter((e) => e.source === "manual" && e.entryType === "credit").map((e) => ({ ...e, kind: "received", partyId: e.customerId })),
    ...vendorEntries.filter((e) => e.source === "manual" && e.entryType === "credit").map((e) => ({ ...e, kind: "paid", partyId: e.vendorId })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function partyName(id) {
    return customers.find((c) => c.id === id)?.name || "Unknown party";
  }

  return (
    <div className="flex flex-col gap-5">
      <FinanceCrumb label="Received / Paid" />
      <div className="flex justify-end gap-2.5">
        <button onClick={() => openModal("received")} className="btn-primary">
          <Icon name="arrowDown" className="h-[15px] w-[15px]" strokeWidth={2.2} />
          Received
        </button>
        <button onClick={() => openModal("payment_out")} className="rounded-lg border-[1.5px] border-danger/60 bg-danger-soft px-4 py-2.5 text-[13.5px] font-semibold text-danger-dark hover:bg-danger/10">
          <span className="flex items-center gap-1.5"><Icon name="arrowUp" className="h-[15px] w-[15px]" strokeWidth={2.2} />Payment Out</span>
        </button>
      </div>

      <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
        <div className="grid min-w-[800px] grid-cols-[1fr_1.6fr_1fr_1fr_1.2fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11px] font-bold tracking-wide text-muted">
          <span>DATE</span><span>PARTY</span><span>TYPE</span><span>RECEIPT / PAYMENT #</span><span>AMOUNT</span>
        </div>
        {feed.map((e) => (
          <div key={e.kind + e.id} className="grid min-w-[800px] grid-cols-[1fr_1.6fr_1fr_1fr_1.2fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg">
            <span className="text-ink-soft">{e.entryDate}</span>
            <span className="font-semibold">{partyName(e.partyId)}</span>
            <Badge tone={e.kind === "received" ? "teal" : "danger"}>{e.kind === "received" ? "Received" : "Payment Out"}</Badge>
            <span className="text-muted">{e.receiptNo || "—"}</span>
            <span className={`font-semibold ${e.kind === "received" ? "text-teal" : "text-danger"}`}>{money(e.amount)}</span>
          </div>
        ))}
        {feed.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted">Nothing recorded yet.</div>}
      </div>

      <div className="flex flex-col gap-2 sm:hidden">
        {feed.map((e) => (
          <div key={e.kind + e.id} className="flex items-center justify-between rounded-xl2 border border-border bg-surface p-3">
            <div>
              <div className="font-semibold">{partyName(e.partyId)}</div>
              <div className="text-[12px] text-muted">{e.entryDate}{e.receiptNo ? ` · #${e.receiptNo}` : ""}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge tone={e.kind === "received" ? "teal" : "danger"}>{e.kind === "received" ? "Received" : "Payment Out"}</Badge>
              <span className={`text-[13px] font-semibold ${e.kind === "received" ? "text-teal" : "text-danger"}`}>{money(e.amount)}</span>
            </div>
          </div>
        ))}
        {feed.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-8 text-center text-sm text-muted">Nothing recorded yet.</div>}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={form.direction === "received" ? "Record Received" : "Record Payment Out"}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {justSaved && (
            <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-teal bg-teal-soft px-3.5 py-2.5 text-[13px] font-semibold text-teal">
              <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
              Saved — add another below, or close when done.
            </div>
          )}
          <datalist id="party-names">
            {customers.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>

          <div className="flex gap-2.5">
            <button type="button" onClick={() => setDirection("received")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-3 text-[13.5px] font-semibold ${form.direction === "received" ? "border-[1.5px] border-teal bg-teal-soft text-teal" : "border-border"}`}>
              <Icon name="arrowDown" className="h-3.5 w-3.5" strokeWidth={2.2} />Received
            </button>
            <button type="button" onClick={() => setDirection("payment_out")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-3 text-[13.5px] font-semibold ${form.direction === "payment_out" ? "border-[1.5px] border-danger bg-danger-soft text-danger" : "border-border"}`}>
              <Icon name="arrowUp" className="h-3.5 w-3.5" strokeWidth={2.2} />Payment Out
            </button>
          </div>

          <Field label={form.direction === "received" ? "Received From" : "Paid To"} list="party-names" placeholder="Existing customer or a new name" value={form.partyName} onChange={(e) => partyNameChange(e.target.value)} required />
          {!form.partyId && form.partyName && (
            <p className="-mt-2 text-[12px] text-muted">No matching party — a new one is created when you save.</p>
          )}

          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Field label="Amount (NPR)" type="number" min="0" step="0.01" className="flex-1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <Field label="Date" type="date" className="flex-1" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Field label={form.direction === "received" ? "Receipt No." : "Payment No."} className="flex-1" value={form.no} onChange={(e) => setForm({ ...form, no: e.target.value, noTouched: true })} />
            <label className="flex flex-1 flex-col gap-2">
              <span className="text-[13px] font-semibold">Method</span>
              <select className="field" value={form.bankAccountId} onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })}>
                <option value="">Cash</option>
                {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
          </div>
          <Field label="Note" placeholder="Optional" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />

          <div className="flex gap-2.5">
            <button type="button" onClick={closeModal} className="btn-ghost flex-1">Done</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save & Add Another"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
