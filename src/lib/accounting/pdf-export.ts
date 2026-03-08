/**
 * PDF Export utility for accounting reports.
 * Uses the browser's print API to generate PDF from a rendered HTML template.
 */

interface PdfColumn {
  header: string;
  key: string;
  align?: "left" | "right" | "center";
  format?: (value: any) => string;
}

interface PdfExportOptions {
  title: string;
  subtitle?: string;
  dateRange?: { from: string; to: string };
  columns: PdfColumn[];
  data: Record<string, any>[];
  totals?: Record<string, string>;
  companyName?: string;
}

export function exportToPdf(options: PdfExportOptions) {
  const { title, subtitle, dateRange, columns, data, totals, companyName } = options;

  const headerHtml = `
    <div style="text-align:center; margin-bottom:24px;">
      ${companyName ? `<div style="font-size:14px; color:#666; margin-bottom:4px;">${companyName}</div>` : ""}
      <h1 style="font-size:22px; margin:0; font-weight:700;">${title}</h1>
      ${subtitle ? `<p style="font-size:12px; color:#888; margin:4px 0 0;">${subtitle}</p>` : ""}
      ${dateRange ? `<p style="font-size:11px; color:#999; margin:4px 0 0;">${dateRange.from} — ${dateRange.to}</p>` : ""}
    </div>
  `;

  const tableHeader = columns
    .map((c) => `<th style="text-align:${c.align || "left"}; padding:8px 12px; border-bottom:2px solid #333; font-size:12px; font-weight:600;">${c.header}</th>`)
    .join("");

  const tableRows = data
    .map(
      (row) =>
        `<tr>${columns
          .map(
            (c) =>
              `<td style="text-align:${c.align || "left"}; padding:6px 12px; border-bottom:1px solid #eee; font-size:11px;">${c.format ? c.format(row[c.key]) : (row[c.key] ?? "—")}</td>`
          )
          .join("")}</tr>`
    )
    .join("");

  const totalsRow = totals
    ? `<tr style="font-weight:700; border-top:2px solid #333;">${columns
        .map(
          (c) =>
            `<td style="text-align:${c.align || "left"}; padding:8px 12px; font-size:12px;">${totals[c.key] || ""}</td>`
        )
        .join("")}</tr>`
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #222; }
        table { width: 100%; border-collapse: collapse; }
        @media print {
          body { margin: 20px; }
          @page { margin: 20mm; }
        }
      </style>
    </head>
    <body>
      ${headerHtml}
      <table>${tableHeader}${tableRows}${totalsRow}</table>
      <div style="margin-top:24px; font-size:10px; color:#aaa; text-align:center;">
        Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to export PDF.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

/** Currency formatter shorthand */
export const fmtCurrency = (n: any) =>
  "$" + Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 });
