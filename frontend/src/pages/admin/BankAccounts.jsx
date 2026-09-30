import { useState } from "react";
import Icon from "../../components/icons/Icon";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import FinanceCrumb from "../../components/ui/FinanceCrumb";
import { money } from "../../lib/format";
import { useFinance, today } from "../../context/FinanceContext";

function blankAccountForm() {
  return { id: null, name: "", bankName: "", accountNumber: "", accountHolderName: "", address: "" };
}
function blankTransferForm() {
  return { fromAccountId: "", toAccountId: "", amount: "", date: today(), note: "" };
}

export default function BankAccounts() {
  const { bankAccounts, balances, transfers, createBankAccount, updateEntry, deleteRow, createTransfer, loading } = useFinance();
  const [accountForm, setAccountForm] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState(blankTransferForm);
  const [activityFor, setActivityFor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  if (loading) return <div className="p-8 text-sm text-muted">Loading bank accounts…</div>;

  async function handleAccountSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: accountForm.name, bankName: accountForm.bankName || null, accountNumber: accountForm.accountNumber || null,
        accountHolderName: accountForm.accountHolderName || null, address: accountForm.address || null,
      };
      if (accountForm.id) {
        await updateEntry("bank_accounts", accountForm.id, {
          name: payload.name, bank_name: payload.bankName, account_number: payload.accountNumber,
          account_holder_name: payload.accountHolderName, address: payload.address,
        });
      } else {
        await createBankAccount(payload);
      }
      setAccountForm(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeleteError("");
    try {
      await deleteRow("bank_accounts", id);
    } catch {
      setDeleteError("This account has ledger activity against it and can't be removed.");
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    const amount = Number(transferForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!transferForm.fromAccountId && !transferForm.toAccountId) return;
    if (transferForm.fromAccountId === transferForm.toAccountId) return;
    setSaving(true);
    try {
      await createTransfer({
        fromAccountId: transferForm.fromAccountId || null,
        toAccountId: transferForm.toAccountId || null,
        amount, date: transferForm.date, note: transferForm.note || null,
      });
      setTransferOpen(false);
      setTransferForm(blankTransferForm());
    } finally {
      setSaving(false);
    }
  }

  function accountLabel(id) {
    if (!id) return "Cash";
    return bankAccounts.find((a) => a.id === id)?.name || "Unknown";
  }

  return (
    <div className="flex flex-col gap-5">
      <FinanceCrumb label="Bank Accounts" />
      <div className="flex justify-end gap-2.5">
        <button onClick={() => setTransferOpen(true)} className="btn-ghost">Record Transfer</button>
        <button onClick={() => setAccountForm(blankAccountForm())} className="btn-primary">
          <Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} />
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <button onClick={() => setActivityFor({ id: null, name: "Cash", balance: balances.cash, activity: balances.cashActivity })} className="card flex flex-col gap-1.5 text-left hover:bg-bg">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-muted"><Icon name="cash" className="h-4 w-4" strokeWidth={1.8} />Cash in Hand</span>
          <span className="font-display text-xl font-bold">{money(balances.cash)}</span>
        </button>
        {balances.perAccount.map((a) => (
          <button key={a.id} onClick={() => setActivityFor(a)} className="card flex flex-col gap-1.5 text-left hover:bg-bg">
            <span className="flex items-center justify-between text-[13px] font-semibold text-muted">
              <span className="flex items-center gap-2"><Icon name="cashBank" className="h-4 w-4" strokeWidth={1.8} />{a.name}</span>
              <span className="flex gap-1">
                <span onClick={(e) => { e.stopPropagation(); const acc = bankAccounts.find((x) => x.id === a.id); setAccountForm({ id: acc.id, name: acc.name, bankName: acc.bankName || "", accountNumber: acc.accountNumber || "", accountHolderName: acc.accountHolderName || "", address: acc.address || "" }); }} className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-surface-2">
                  <Icon name="edit" className="h-3 w-3 text-ink-soft" strokeWidth={1.7} />
                </span>
                <span onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }} className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-surface-2">
                  <Icon name="trash" className="h-3 w-3 text-danger" strokeWidth={1.7} />
                </span>
              </span>
            </span>
            <span className={`font-display text-xl font-bold ${a.balance < 0 ? "text-danger" : ""}`}>{money(a.balance)}</span>
          </button>
        ))}
        {bankAccounts.length === 0 && (
          <div className="card text-center text-sm text-muted sm:col-span-2 lg:col-span-2">No bank accounts yet — cash in hand is tracked automatically.</div>
        )}
      </div>
      {deleteError && <p className="text-[12.5px] font-semibold text-danger">{deleteError}</p>}

      <div className="flex flex-col gap-4">
        <span className="text-[15px] font-semibold">Recent transfers</span>
        <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
          <div className="grid min-w-[600px] grid-cols-[1fr_1.6fr_1fr_1.2fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11px] font-bold tracking-wide text-muted">
            <span>DATE</span><span>TRANSFER</span><span>AMOUNT</span><span>NOTE</span>
          </div>
          {transfers.map((t) => (
            <div key={t.id} className="grid min-w-[600px] grid-cols-[1fr_1.6fr_1fr_1.2fr] items-center gap-2 border-t border-border px-5 py-3 text-[13px]">
              <span className="text-ink-soft">{t.transferDate}</span>
              <span className="font-semibold">{accountLabel(t.fromAccountId)} → {accountLabel(t.toAccountId)}</span>
              <span className="font-semibold">{money(t.amount)}</span>
              <span className="text-muted">{t.note || "—"}</span>
            </div>
          ))}
          {transfers.length === 0 && <div className="px-5 py-6 text-center text-sm text-muted">No transfers yet.</div>}
        </div>
      </div>

      <Modal open={!!accountForm} onClose={() => setAccountForm(null)} title={accountForm?.id ? "Edit Account" : "Add Bank Account"}>
        {accountForm && (
          <form onSubmit={handleAccountSave} className="flex flex-col gap-4">
            <Field label="Account Name" placeholder="e.g. Nabil Business" value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} required />
            <div className="flex flex-col gap-3.5 sm:flex-row">
              <Field label="Bank Name" className="flex-1" value={accountForm.bankName} onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })} />
              <Field label="Account Number" className="flex-1" value={accountForm.accountNumber} onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })} />
            </div>
            <Field label="Account Holder" value={accountForm.accountHolderName} onChange={(e) => setAccountForm({ ...accountForm, accountHolderName: e.target.value })} />
            <Field label="Branch / Address" value={accountForm.address} onChange={(e) => setAccountForm({ ...accountForm, address: e.target.value })} />
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setAccountForm(null)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save Account"}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Record Transfer">
        <form onSubmit={handleTransfer} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <label className="flex flex-1 flex-col gap-2">
              <span className="text-[13px] font-semibold">From</span>
              <select className="field" value={transferForm.fromAccountId} onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}>
                <option value="">Cash</option>
                {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-2">
              <span className="text-[13px] font-semibold">To</span>
              <select className="field" value={transferForm.toAccountId} onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}>
                <option value="">Cash</option>
                {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Field label="Amount (NPR)" type="number" min="0" step="0.01" className="flex-1" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} required />
            <Field label="Date" type="date" className="flex-1" value={transferForm.date} onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })} />
          </div>
          <Field label="Note" placeholder="Optional" value={transferForm.note} onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })} />
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setTransferOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save Transfer"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!activityFor} onClose={() => setActivityFor(null)} title={activityFor?.name}>
        {activityFor && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-surface-2 px-4 py-3">
              <div className="text-xs font-semibold text-muted">BALANCE</div>
              <div className={`font-display text-xl font-bold ${activityFor.balance < 0 ? "text-danger" : ""}`}>{money(activityFor.balance)}</div>
            </div>
            <div className="flex flex-col gap-2">
              {activityFor.activity.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-[13px]">
                  <div>
                    <div className="font-semibold">{a.label}</div>
                    <div className="text-[11.5px] text-muted">{a.date}</div>
                  </div>
                  <span className={`font-semibold ${a.inflow ? "text-teal" : "text-danger"}`}>{a.inflow ? "+" : "−"}{money(a.amount)}</span>
                </div>
              ))}
              {activityFor.activity.length === 0 && <p className="text-sm text-muted">No activity yet.</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
