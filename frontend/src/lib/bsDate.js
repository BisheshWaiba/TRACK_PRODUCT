import NepaliDateModule from "nepali-date-converter";

// The package ships as a UMD build; depending on how it's interop'd, the
// real constructor lands on .default or is the module itself.
const NepaliDate = NepaliDateModule.default || NepaliDateModule;

// Nepali businesses read Bikram Sambat, but every date already stored,
// queried, sorted and range-filtered throughout this app is AD - adding
// a second calendar there would mean converting at every comparison,
// not just every display. So: convert only here, at the point of
// display, and only to show BS *alongside* AD (FINANCE-SPEC.md §4),
// never instead of it.
export function toBsLabel(adDateString) {
  if (!adDateString) return null;
  try {
    const [y, m, d] = adDateString.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new NepaliDate(new Date(y, m - 1, d)).format("DD MMMM YYYY");
  } catch {
    return null;
  }
}
