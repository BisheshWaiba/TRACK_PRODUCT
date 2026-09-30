import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import FinanceCrumb from "../../components/ui/FinanceCrumb";
import { money } from "../../lib/format";
import { useFinance, today } from "../../context/FinanceContext";

function blankForm() {
  return { partyName: "", expenseCategoryId: "", amount: "", date: today(), note: "", bankAccountId: "" };
}

export default function Expenses() {
  const { bankAccounts, expenseCategories, transactions, saveTransaction, createExpenseCategory, updateEntry, deleteRow, loading } = useFinance();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [categoryError, setCategoryError] = useState("");

  // Reached from the Finance hub's "Expenses" shortcut with ?add=1.
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setForm(blankForm());
      setJustSaved(false);
      setModalOpen(true);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeModal() {
    setModalOpen(false);
    setJustSaved(false);
  }

  async function removeCategory(id) {
    setCategoryError("");
    try {
      await deleteRow("expense_categories", id);
    } catch {
      setCategoryError("That category is used on an existing expense — reassign those first.");
    }
  }

  if (loading) return <div className="p-8 text-sm text-muted">Loading expenses…</div>;

  const expenses = transactions.filter((t) => t.type === "expense");

  function categoryName(id) {
    return expenseCategories.find((c) => c.id === id)?.name || "Uncategorised";
  }

  async function handleSave(e) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setSaving(true);
    try {
      await saveTransaction({
        type: "expense",
        amount,
        partyName: form.partyName || null,
        billDate: form.date,
        expenseCategoryId: form.expenseCategoryId || null,
        bankAccountId: form.bankAccountId || null,
        note: form.note || null,
      });
      // Stays open - a batch of receipts is usually the same category,
      // date and payment method, one after another. Payee/amount/note
      // reset since those are what actually change per receipt.
      setForm((f) => ({ ...blankForm(), expenseCategoryId: f.expenseCategoryId, date: f.date, bankAccountId: f.bankAccountId }));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 4000);
    } finally {
      setSaving(false);
    }
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    const id = await createExpenseCategory(newCategory.trim());
    setNewCategory("");
    setForm((f) => ({ ...f, expenseCategoryId: id }));
  }

  async function saveRename() {
    if (!renaming.name.trim()) return;
    await updateEntry("expense_categories", renaming.id, { name: renaming.name.trim() });
    setRenaming(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <FinanceCrumb label="Expenses" />
      <div className="flex justify-end gap-2.5">
        <button onClick={() => setManageOpen(true)} className="btn-ghost">Manage Categories</button>
        <button onClick={() => { setForm(blankForm()); setJustSaved(false); setModalOpen(true); }} className="btn-primary">
          <Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} />
          New Expense
        </button>
      </div>

      <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
        <div className="grid min-w-[760px] grid-cols-[1fr_1.4fr_1.2fr_1.6fr_1fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11px] font-bold tracking-wide text-muted">
          <span>DATE</span><span>PAYEE</span><span>CATEGORY</span><span>NOTE</span><span>AMOUNT</span>
        </div>
        {expenses.map((t) => (
          <div key={t.id} className="grid min-w-[760px] grid-cols-[1fr_1.4fr_1.2fr_1.6fr_1fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg">
            <span className="text-ink-soft">{t.billDate}</span>
            <span className="font-semibold">{t.partyName || "—"}</span>
            <span className="text-muted">{categoryName(t.expenseCategoryId)}</span>
            <span className="truncate text-muted">{t.note || "—"}</span>
            <span className="font-semibold text-danger">{money(t.amount)}</span>
          </div>
        ))}
        {expenses.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted">No expenses recorded yet.</div>}
      </div>

      <div className="flex flex-col gap-2 sm:hidden">
        {expenses.map((t) => (
          <div key={t.id} className="flex flex-col gap-1.5 rounded-xl2 border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t.partyName || "Expense"}</span>
              <span className="font-semibold text-danger">{money(t.amount)}</span>
            </div>
            <div className="text-[12px] text-muted">{t.billDate} · {categoryName(t.expenseCategoryId)}</div>
          </div>
        ))}
        {expenses.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-8 text-center text-sm text-muted">No expenses recorded yet.</div>}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title="New Expense">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {justSaved && (
            <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-teal bg-teal-soft px-3.5 py-2.5 text-[13px] font-semibold text-teal">
              <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
              Expense saved — add another below, or close when done.
            </div>
          )}
          <Field label="Payee" placeholder="e.g. Nepal Electricity Authority" value={form.partyName} onChange={(e) => setForm({ ...form, partyName: e.target.value })} />
          <div className="flex items-end gap-2.5">
            <label className="flex flex-1 flex-col gap-2">
              <span className="text-[13px] font-semibold">Category</span>
              <select className="field" value={form.expenseCategoryId} onChange={(e) => setForm({ ...form, expenseCategoryId: e.target.value })}>
                <option value="">Uncategorised</option>
                {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => setManageOpen(true)} title="Manage categories" aria-label="Manage categories" className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-lg border border-border hover:bg-surface-2">
              <Icon name="edit" className="h-4 w-4 text-ink-soft" strokeWidth={1.7} />
            </button>
          </div>
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Field label="Amount (NPR)" type="number" min="0" step="0.01" className="flex-1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <Field label="Date" type="date" className="flex-1" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold">Paid from</span>
            <select className="field" value={form.bankAccountId} onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })}>
              <option value="">Cash</option>
              {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <Field label="Note" placeholder="Optional" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="flex gap-2.5">
            <button type="button" onClick={closeModal} className="btn-ghost flex-1">Done</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save & Add Another"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="Expense Categories" width="max-w-[420px]">
        <div className="flex flex-col gap-3">
          {expenseCategories.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              {renaming?.id === c.id ? (
                <input value={renaming.name} onChange={(e) => setRenaming({ ...renaming, name: e.target.value })} className="field flex-1" autoFocus />
              ) : (
                <span className="flex-1 text-[13.5px] font-semibold">{c.name}</span>
              )}
              {renaming?.id === c.id ? (
                <button type="button" aria-label="Save name" onClick={saveRename} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2">
                  <Icon name="check" className="h-4 w-4 text-teal" strokeWidth={2} />
                </button>
              ) : (
                <button type="button" aria-label="Rename category" onClick={() => setRenaming({ id: c.id, name: c.name })} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2">
                  <Icon name="edit" className="h-[13px] w-[13px] text-ink-soft" strokeWidth={1.7} />
                </button>
              )}
              <button type="button" aria-label="Delete category" onClick={() => removeCategory(c.id)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-2">
                <Icon name="trash" className="h-[13px] w-[13px] text-danger" strokeWidth={1.7} />
              </button>
            </div>
          ))}
          {expenseCategories.length === 0 && <p className="text-sm text-muted">No categories yet.</p>}
          {categoryError && <p className="text-[12.5px] font-semibold text-danger">{categoryError}</p>}
          <div className="flex items-center gap-2 border-t border-border pt-3">
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" className="field flex-1" />
            <button type="button" aria-label="Add category" onClick={addCategory} className="btn-primary !px-3">
              <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
