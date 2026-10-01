import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import FinanceCrumb from "../../components/ui/FinanceCrumb";
import { money } from "../../lib/format";
import { useData } from "../../context/DataContext";
import { useFinance, today } from "../../context/FinanceContext";

let itemSeq = 0;
function blankItem() {
  return { key: ++itemSeq, name: "", qty: "1", rate: "", productId: null };
}
function blankForm() {
  return { partyName: "", supplierId: null, billNo: "", billDate: today(), note: "", discountAmount: "", vatAmount: "", items: [blankItem()] };
}

export default function Purchases() {
  const { loading: dataLoading, products, createProduct, createStockMovement } = useData();
  const { loading: financeLoading, transactions, suppliers, createSupplier, saveTransaction } = useFinance();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Reached from the Finance hub's "Purchase" shortcut with ?add=1 - jump
  // straight into the form instead of making a second click land on it.
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      openModal();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dataLoading || financeLoading) return <div className="p-8 text-sm text-muted">Loading purchases…</div>;

  const purchases = transactions.filter((t) => t.type === "purchase");

  function openModal() {
    setForm(blankForm());
    setJustSaved(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setJustSaved(false);
  }

  function updateItem(key, patch) {
    setForm((f) => ({ ...f, items: f.items.map((it) => (it.key === key ? { ...it, ...patch } : it)) }));
  }

  function handleNameChange(key, value) {
    // Typing a name that matches an existing product links this row to it
    // (and restocks it on save) instead of minting a duplicate. Anything
    // else becomes a brand-new product, catalogued and stocked in one go.
    const match = products.find((p) => p.name.toLowerCase() === value.trim().toLowerCase());
    updateItem(key, {
      name: value,
      productId: match ? match.id : null,
    });
    if (match) {
      setForm((f) => ({
        ...f,
        items: f.items.map((it) => (it.key === key && !it.rate ? { ...it, rate: String(match.price) } : it)),
      }));
    }
  }

  function handlePartyNameChange(value) {
    const match = suppliers.find((s) => s.name.toLowerCase() === value.trim().toLowerCase());
    setForm((f) => ({ ...f, partyName: value, supplierId: match ? match.id : null }));
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, blankItem()] }));
  }

  function removeItem(key) {
    setForm((f) => (f.items.length > 1 ? { ...f, items: f.items.filter((it) => it.key !== key) } : f));
  }

  const lineTotal = (it) => (Number(it.qty) || 0) * (Number(it.rate) || 0);
  const subtotal = form.items.reduce((sum, it) => sum + lineTotal(it), 0);
  const discount = Number(form.discountAmount) || 0;
  const vat = Number(form.vatAmount) || 0;
  const grandTotal = Math.max(0, subtotal - discount + vat);

  async function handleSave(e) {
    e.preventDefault();
    const validItems = form.items
      .map((it) => ({ ...it, qty: Number(it.qty) || 0, rate: Number(it.rate) || 0 }))
      .filter((it) => it.name.trim() && it.qty > 0);
    if (validItems.length === 0 || grandTotal <= 0) return;

    setSaving(true);
    try {
      // Sequential, not Promise.all: two new items with the same typed
      // name must not race to create the product twice.
      for (const it of validItems) {
        if (it.productId) {
          await createStockMovement({
            productId: it.productId,
            type: "in",
            qty: it.qty,
            reference: form.billNo ? `Purchase #${form.billNo}` : "Purchase",
          });
        } else {
          await createProduct({ name: it.name.trim(), price: it.rate, stock: it.qty });
        }
      }
      let supplierId = form.supplierId;
      if (form.partyName.trim() && !supplierId) supplierId = await createSupplier({ name: form.partyName.trim() });
      await saveTransaction({
        type: "purchase",
        amount: grandTotal,
        note: form.note || null,
        partyName: form.partyName || null,
        supplierId,
        billNo: form.billNo || null,
        billDate: form.billDate,
        discountAmount: discount,
        vatAmount: vat,
        items: validItems.map((it) => ({ description: it.name.trim(), qty: it.qty, rate: it.rate, amount: it.qty * it.rate })),
      });
      // Stays open instead of closing - entering a stack of paper bills
      // one after another shouldn't mean re-opening this modal every time.
      // Bill date carries over (a batch is usually all from today); the
      // supplier, items and bill number reset since the next bill is
      // rarely the same one.
      setForm({ ...blankForm(), billDate: form.billDate });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 4000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <FinanceCrumb label="Purchases" />
      <div className="flex justify-end">
        <button onClick={openModal} className="btn-primary">
          <Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} />
          New Purchase
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl2 border border-border bg-surface sm:block">
        <div className="grid min-w-[800px] grid-cols-[1fr_1.6fr_1.6fr_0.9fr_1fr] gap-2 bg-surface-2 px-5 py-3.5 text-[11px] font-bold tracking-wide text-muted">
          <span>BILL #</span><span>SUPPLIER</span><span>DATE</span><span>ITEMS</span><span>AMOUNT</span>
        </div>
        {purchases.map((t) => (
          <div key={t.id} className="grid min-w-[800px] grid-cols-[1fr_1.6fr_1.6fr_0.9fr_1fr] items-center gap-2 border-t border-border px-5 py-3.5 text-[13px] hover:bg-bg">
            <span className="font-semibold">{t.billNo || "—"}</span>
            <span>{t.partyName || "Walk-in supplier"}</span>
            <span className="text-ink-soft">{t.billDate}</span>
            <span className="text-muted">{t.items.length} item{t.items.length === 1 ? "" : "s"}</span>
            <span className="font-semibold">{money(t.amount)}</span>
          </div>
        ))}
        {purchases.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted">No purchases recorded yet.</div>}
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {purchases.map((t) => (
          <div key={t.id} className="flex flex-col gap-2 rounded-xl2 border border-border bg-surface p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-semibold">{t.partyName || "Walk-in supplier"}</div>
                <div className="text-[12.5px] text-muted">{t.billNo ? `Bill #${t.billNo} · ` : ""}{t.billDate}</div>
              </div>
              <span className="flex-shrink-0 font-semibold">{money(t.amount)}</span>
            </div>
            <div className="text-[12.5px] text-muted">{t.items.length} item{t.items.length === 1 ? "" : "s"}</div>
          </div>
        ))}
        {purchases.length === 0 && <div className="rounded-xl2 border border-border bg-surface px-5 py-8 text-center text-sm text-muted">No purchases recorded yet.</div>}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title="New Purchase" width="max-w-[640px]">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {justSaved && (
            <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-teal bg-teal-soft px-3.5 py-2.5 text-[13px] font-semibold text-teal">
              <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
              Purchase saved — add another below, or close when done.
            </div>
          )}
          <datalist id="product-names">
            {products.map((p) => <option key={p.id} value={p.name} />)}
          </datalist>
          <datalist id="supplier-names">
            {suppliers.map((s) => <option key={s.id} value={s.name} />)}
          </datalist>

          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Field label="Supplier" className="flex-1" list="supplier-names" placeholder="Existing supplier or a new name" value={form.partyName} onChange={(e) => handlePartyNameChange(e.target.value)} />
            <Field label="Bill No." className="flex-1" placeholder="INV-4521" value={form.billNo} onChange={(e) => setForm({ ...form, billNo: e.target.value })} />
            <Field label="Bill Date" type="date" className="flex-1" value={form.billDate} onChange={(e) => setForm({ ...form, billDate: e.target.value })} />
          </div>
          {!form.supplierId && form.partyName && (
            <p className="-mt-2 text-[12px] text-muted">A new supplier will be created when you save.</p>
          )}

          <div className="flex flex-col rounded-xl2 border border-border">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-[11px] font-bold tracking-wide text-muted">
              <Icon name="box" className="h-3.5 w-3.5" strokeWidth={2} />
              ITEMS
            </div>
            {form.items.map((it) => (
              <div key={it.key} className="flex items-center gap-2 border-b border-border px-4 py-2.5 last:border-b-0">
                <input
                  value={it.name}
                  onChange={(e) => handleNameChange(it.key, e.target.value)}
                  list="product-names"
                  placeholder="Item name"
                  className="min-w-0 flex-1 border-none bg-transparent text-[13.5px] font-semibold outline-none"
                />
                <input
                  type="number" min="1" step="1"
                  value={it.qty}
                  onChange={(e) => updateItem(it.key, { qty: e.target.value })}
                  className="w-14 flex-shrink-0 rounded-md border border-border bg-surface-2 px-1.5 py-1.5 text-center text-[13px] outline-none"
                />
                <span className="flex-shrink-0 text-[12px] text-muted">×</span>
                <input
                  type="number" min="0" step="0.01"
                  value={it.rate}
                  onChange={(e) => updateItem(it.key, { rate: e.target.value })}
                  placeholder="Rate"
                  className="w-20 flex-shrink-0 rounded-md border border-border bg-surface-2 px-1.5 py-1.5 text-right text-[13px] outline-none"
                />
                <span className="w-24 flex-shrink-0 text-right text-[13px] font-bold">{money(lineTotal(it))}</span>
                <button
                  type="button"
                  onClick={() => removeItem(it.key)}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted hover:bg-border"
                >
                  <Icon name="close" className="h-3 w-3" strokeWidth={2.2} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addItem} className="flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold text-accent hover:bg-surface-2">
              <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2.2} />
              Add item
            </button>
          </div>
          <p className="-mt-2 text-[12px] text-muted">A name matching an existing product restocks it; anything else is added to the catalog.</p>

          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Field label="Discount (NPR)" type="number" min="0" step="0.01" className="flex-1" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} />
            <Field label="VAT (NPR)" type="number" min="0" step="0.01" className="flex-1" value={form.vatAmount} onChange={(e) => setForm({ ...form, vatAmount: e.target.value })} />
          </div>
          <Field label="Note" placeholder="Optional" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />

          <div className="flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3 text-[13.5px]">
            <span className="text-muted">Subtotal {money(subtotal)}{discount > 0 && ` − Discount ${money(discount)}`}{vat > 0 && ` + VAT ${money(vat)}`}</span>
            <span className="font-display text-lg font-bold">{money(grandTotal)}</span>
          </div>

          <div className="flex gap-2.5">
            <button type="button" onClick={closeModal} className="btn-ghost flex-1">Done</button>
            <button type="submit" disabled={saving || grandTotal <= 0} className="btn-primary flex-1 disabled:opacity-60">
              {saving ? "Saving…" : "Save & Add Another"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
