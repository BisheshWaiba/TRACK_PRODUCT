export function money(n) {
  return "NPR " + Math.round(n).toLocaleString("en-IN");
}

// A party's ledger balance, in words rather than a raw signed number:
// "Settled" reads very differently from "NPR 0", and someone who is both
// owed and owing sees both figures instead of one quietly cancelling the
// other out.
export function ledgerLine(entry) {
  const receivable = Math.round(entry?.receivable || 0);
  const payable = Math.round(entry?.payable || 0);
  if (receivable <= 0 && payable <= 0) return { label: "Settled", tone: "muted" };
  if (receivable > 0 && payable > 0) return { label: `Receive ${money(receivable)} · Pay ${money(payable)}`, tone: "slate" };
  if (receivable > 0) return { label: `To receive ${money(receivable)}`, tone: "teal" };
  return { label: `To pay ${money(payable)}`, tone: "danger" };
}
