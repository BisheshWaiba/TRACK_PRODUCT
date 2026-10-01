import * as XLSX from "xlsx";

// One column definition drives both the on-screen table and the export,
// per FINANCE-SPEC.md §4 ("both from the same column definition so they
// cannot drift"). Each column is { header, value(row) }.
export function exportXlsx(filename, sheetName, columns, rows) {
  const data = rows.map((row) => {
    const out = {};
    for (const col of columns) out[col.header] = col.value(row);
    return out;
  });
  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, sheetName);
  XLSX.writeFile(book, filename);
}
