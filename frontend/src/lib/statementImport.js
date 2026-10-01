// FINANCE-SPEC.md §3.8's classification table. Written against Jageer's
// own bank's wording - adapt the patterns to whatever a real export here
// actually says once one is available; the *shape* (classify by
// description + direction, review before writing, mark by reference so
// re-importing an overlapping export is safe) is the part that's fixed.

export function classifyRow(description, debit, credit) {
  const desc = String(description || "").trim();
  const isCredit = Number(credit) > 0;
  const amount = Number(debit) > 0 ? Number(debit) : Number(credit) || 0;
  let m;

  if ((m = desc.match(/^Fund\s+Transferred\s+to\s+(.+)$/i))) {
    return { type: "payment_out", party: m[1].trim(), amount };
  }
  if ((m = desc.match(/^Fund\s+Transferred\s+by\s+(.+)$/i))) {
    return { type: "payment_in", party: m[1].trim(), amount };
  }
  if ((m = desc.match(/^Money\s+transferred\s+(?:to|from)\s+(.+)$/i))) {
    return { type: isCredit ? "deposit" : "withdraw", party: m[1].trim(), amount };
  }
  if ((m = desc.match(/^Loan\s+Disbursement\s+from\s+(.+)$/i))) {
    return { type: "deposit", party: m[1].trim(), amount };
  }
  if ((m = desc.match(/^Paid\s+for\s+(.+)$/i))) {
    return { type: "expense", party: m[1].trim(), amount };
  }
  if ((m = desc.match(/^(.+?)\s+topup\s+to/i))) {
    return { type: "expense", party: m[1].trim(), amount };
  }
  if (/charge|cashback|\bfee\b/i.test(desc)) {
    return { type: isCredit ? "deposit" : "withdraw", party: "", amount };
  }
  return { type: isCredit ? "payment_in" : "expense", party: "", amount: amount };
}

export const IMPORT_TYPES = [
  { value: "expense", label: "Expense" },
  { value: "payment_in", label: "Payment In (customer)" },
  { value: "payment_out", label: "Payment Out (supplier)" },
  { value: "deposit", label: "Deposit (own money)" },
  { value: "withdraw", label: "Withdraw (own money)" },
  { value: "skip", label: "Skip" },
];

// Bank exports write numbers as "1,234.50" or wrap negatives in
// parentheses - Number() chokes on both.
export function parseAmount(value) {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace(/,/g, "").trim();
  const negative = /^\(.*\)$/.test(cleaned);
  const n = Number(cleaned.replace(/[()]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return negative ? -n : n;
}
