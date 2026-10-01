import { useState } from "react";
import * as XLSX from "xlsx";
import Icon from "../../components/icons/Icon";
import FinanceCrumb from "../../components/ui/FinanceCrumb";
import { money } from "../../lib/format";
import { classifyRow, IMPORT_TYPES, parseAmount } from "../../lib/statementImport";
import { supabase } from "../../lib/supabaseClient";
import { useData } from "../../context/DataContext";
import { useFinance, today } from "../../context/FinanceContext";

// No fixed bank format to build against (FINANCE-SPEC.md §3.8 assumes
// Jageer's own bank's column layout, which this business may not share),
// so the header row and its columns are detected, then confirmed or
// remapped by hand - the structure (parse -> dedupe by reference ->
// classify -> review -> commit with a marker) is what's fixed, not the
// exact columns.
const FIELD_GUESSES = {
  reference: /reference|ref\.?\s*no|ref\s*code/i,
  date: /date|time/i,
  description: /description|narration|particulars|remarks/i,
  debit: /debit|withdrawal|dr\.?$/i,
  credit: /credit|deposit|cr\.?$/i,
  status: /status/i,
};
const FIELDS = [
  { key: "reference", label: "Reference Code", required: true },
  { key: "date", label: "Date / Time", required: true },
  { key: "description", label: "Description", required: true },
  { key: "debit", label: "Debit", required: false },
  { key: "credit", label: "Credit", required: false },
  { key: "status", label: "Status", required: false },
];

function detectHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const nonEmpty = rows[i].filter((c) => String(c || "").trim()).length;
    if (nonEmpty >= 4) return i;
  }
  return 0;
}

function guessMapping(headerRow) {
  const mapping = {};
  headerRow.forEach((cell, i) => {
    const text = String(cell || "");
    for (const [field, pattern] of Object.entries(FIELD_GUESSES)) {
      if (mapping[field] == null && pattern.test(text)) mapping[field] = i;
    }
  });
  return mapping;
}

function parseDate(value) {
  if (value == null || value === "") return today();
  if (typeof value === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(value);
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const str = String(value).trim();
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/) || str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (!m) return today();
  if (m[1].length === 4) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

export default function StatementImport() {
  const { customers, createCustomer } = useData();
  const { suppliers, createSupplier, expenseCategories, saveTransaction, recordReceipt, recordPayout } = useFinance();

  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState(null);
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [mapping, setMapping] = useState({});
  const [reviewRows, setReviewRows] = useState(null);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function reset() {
    setFileName(""); setRawRows(null); setReviewRows(null); setResult(null); setError("");
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const book = XLSX.read(buf, { type: "array", cellDates: false });
    const sheet = book.Sheets[book.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }).filter((r) => r.some((c) => String(c || "").trim()));
    if (rows.length < 2) { setError("Couldn't find any data rows in this file."); return; }
    const headerIdx = detectHeaderRow(rows);
    setRawRows(rows);
    setHeaderRowIndex(headerIdx);
    setMapping(guessMapping(rows[headerIdx]));
  }

  function buildReview() {
    const required = FIELDS.filter((f) => f.required);
    for (const f of required) {
      if (mapping[f.key] == null) { setError(`Map a column for "${f.label}" before continuing.`); return; }
    }
    setError("");
    const dataRows = rawRows.slice(headerRowIndex + 1);
    const statusIdx = mapping.status;
    const candidates = dataRows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => statusIdx == null || /complete/i.test(String(r[statusIdx] || "")))
      .map(({ r, i }) => {
        const reference = String(r[mapping.reference] ?? `row-${i}`).trim();
        const description = String(r[mapping.description] ?? "");
        const debit = mapping.debit != null ? parseAmount(r[mapping.debit]) : 0;
        const credit = mapping.credit != null ? parseAmount(r[mapping.credit]) : 0;
        const date = parseDate(r[mapping.date]);
        const classified = classifyRow(description, debit, credit);
        return { reference, description, date, debit, credit, ...classified, include: true, categoryId: "" };
      });

    (async () => {
      const refs = candidates.map((c) => c.reference);
      const { data: seen } = await supabase.from("statement_imports").select("reference_code").in("reference_code", refs);
      const seenSet = new Set((seen || []).map((s) => s.reference_code));
      setReviewRows(candidates.map((c) => (seenSet.has(c.reference) ? { ...c, include: false, alreadyImported: true } : c)));
    })();
  }

  function updateRow(i, patch) {
    setReviewRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function partyIdFor(list, name) {
    const match = list.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    return match?.id || null;
  }

  async function commit() {
    setCommitting(true);
    let done = 0, failed = 0;
    for (const row of reviewRows) {
      if (!row.include || row.alreadyImported) continue;
      try {
        if (row.type === "expense" && row.amount > 0) {
          await saveTransaction({ type: "expense", amount: row.amount, partyName: row.party || null, billDate: row.date, expenseCategoryId: row.categoryId || null, note: `Imported · ${row.reference}` });
        } else if (row.type === "payment_in" && row.amount > 0) {
          let customerId = row.party ? partyIdFor(customers, row.party) : null;
          if (row.party && !customerId) customerId = await createCustomer({ name: row.party });
          if (customerId) await recordReceipt({ customerId, amount: row.amount, date: row.date, note: `Imported · ${row.reference}` });
        } else if (row.type === "payment_out" && row.amount > 0) {
          let supplierId = row.party ? partyIdFor(suppliers, row.party) : null;
          if (row.party && !supplierId) supplierId = await createSupplier({ name: row.party });
          if (supplierId) await recordPayout({ supplierId, amount: row.amount, date: row.date, note: `Imported · ${row.reference}` });
        }
        // deposit/withdraw/skip: the owner's own money moving (or a
        // deliberate no-op) - nothing to book, just mark it seen below.
        const { error: err } = await supabase.from("statement_imports").insert({ reference_code: row.reference });
        if (err) throw err;
        done++;
      } catch {
        failed++;
      }
    }
    setResult({ done, failed });
    setCommitting(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <FinanceCrumb label="Import Statement" />

      {!rawRows && (
        <div className="card flex flex-col items-center gap-3 py-10 text-center">
          <Icon name="history" className="h-8 w-8 text-muted" strokeWidth={1.4} />
          <div>
            <div className="font-semibold">Import a bank statement</div>
            <div className="mt-1 text-[13px] text-muted">Pick an .xlsx, .xls or .csv export. You'll map its columns and review every row before anything is saved.</div>
          </div>
          <label className="btn-primary cursor-pointer">
            <Icon name="plus" className="h-[15px] w-[15px]" strokeWidth={2.2} />
            Choose File
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </label>
          {error && <p className="text-[13px] font-semibold text-danger">{error}</p>}
        </div>
      )}

      {rawRows && !reviewRows && (
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{fileName}</span>
            <button onClick={reset} className="text-[12.5px] font-semibold text-muted hover:text-ink">Choose a different file</button>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold">Header row</span>
            <select className="field" value={headerRowIndex} onChange={(e) => { const idx = Number(e.target.value); setHeaderRowIndex(idx); setMapping(guessMapping(rawRows[idx])); }}>
              {rawRows.slice(0, 20).map((r, i) => (
                <option key={i} value={i}>Row {i + 1}: {r.slice(0, 4).map((c) => String(c)).join(" · ")}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.key} className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold">{f.label}{f.required && " *"}</span>
                <select className="field" value={mapping[f.key] ?? ""} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value === "" ? undefined : Number(e.target.value) })}>
                  <option value="">{f.required ? "Choose a column" : "Not present"}</option>
                  {rawRows[headerRowIndex].map((cell, i) => (
                    <option key={i} value={i}>{String(cell || `Column ${i + 1}`)}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {error && <p className="text-[13px] font-semibold text-danger">{error}</p>}
          <button onClick={buildReview} className="btn-primary self-start">Continue</button>
        </div>
      )}

      {reviewRows && !result && (
        <div className="flex flex-col gap-4">
          <div className="card flex items-center justify-between">
            <span className="text-[13px] text-muted">{reviewRows.filter((r) => r.alreadyImported).length} already imported (skipped automatically) · {reviewRows.filter((r) => r.include).length} ready to commit</span>
            <button onClick={reset} className="text-[12.5px] font-semibold text-muted hover:text-ink">Start over</button>
          </div>
          <div className="flex flex-col gap-2">
            {reviewRows.map((row, i) => (
              <div key={i} className={`card flex flex-col gap-2.5 ${row.alreadyImported ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={row.include} disabled={row.alreadyImported} onChange={(e) => updateRow(i, { include: e.target.checked })} className="mt-1 h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{row.description || "(no description)"}</div>
                    <div className="text-[11.5px] text-muted">{row.date} · Ref {row.reference}{row.alreadyImported ? " · already imported" : ""}</div>
                  </div>
                  <span className={`flex-shrink-0 font-semibold ${row.credit > 0 ? "text-teal" : "text-danger"}`}>{row.credit > 0 ? "+" : "−"}{money(row.amount)}</span>
                </div>
                <div className="flex flex-wrap gap-2.5 pl-7">
                  <select disabled={row.alreadyImported} className="field !w-auto !py-2 text-[12.5px]" value={row.type} onChange={(e) => updateRow(i, { type: e.target.value })}>
                    {IMPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {(row.type === "payment_in" || row.type === "payment_out" || row.type === "expense") && (
                    <input disabled={row.alreadyImported} className="field !w-48 !py-2 text-[12.5px]" placeholder="Party / payee name" value={row.party} onChange={(e) => updateRow(i, { party: e.target.value })} />
                  )}
                  {row.type === "expense" && (
                    <select disabled={row.alreadyImported} className="field !w-auto !py-2 text-[12.5px]" value={row.categoryId} onChange={(e) => updateRow(i, { categoryId: e.target.value })}>
                      <option value="">Uncategorised</option>
                      {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button onClick={commit} disabled={committing || reviewRows.every((r) => !r.include)} className="btn-primary self-start disabled:opacity-60">
            {committing ? "Committing…" : `Commit ${reviewRows.filter((r) => r.include).length} Rows`}
          </button>
        </div>
      )}

      {result && (
        <div className="card flex flex-col items-center gap-3 py-10 text-center">
          <Icon name="check" className="h-8 w-8 text-teal" strokeWidth={1.8} />
          <div className="font-semibold">{result.done} row{result.done === 1 ? "" : "s"} imported{result.failed > 0 ? `, ${result.failed} failed` : ""}.</div>
          <button onClick={reset} className="btn-ghost">Import another file</button>
        </div>
      )}
    </div>
  );
}
