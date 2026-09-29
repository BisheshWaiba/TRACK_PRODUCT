export function money(n) {
  return "NPR " + Math.round(n).toLocaleString("en-IN");
}
