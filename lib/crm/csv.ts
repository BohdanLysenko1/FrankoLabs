/** Shared CSV export used by the Leads/Contacts/Companies list views. */

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** Build a CSV blob from rows and trigger a browser download. */
export function downloadCsv(
  filenameBase: string,
  header: string[],
  rows: string[][],
) {
  const lines = [header, ...rows].map((cells) =>
    cells.map(csvCell).join(","),
  );
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
