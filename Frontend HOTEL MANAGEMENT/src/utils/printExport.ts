/**
 * Generates a printable HTML window for PDF export via browser's print dialog.
 * Works without any extra packages — just Ctrl+P → Save as PDF.
 */
export const printReport = (title: string, htmlContent: string) => {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;

  win.document.write(`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #111; background: #fff; padding: 2rem; }
    h1 { font-size: 1.4rem; margin-bottom: 0.25rem; }
    .subtitle { color: #6b7280; font-size: 0.85rem; margin-bottom: 1.5rem; }
    .logo { font-size: 1.1rem; font-weight: 700; color: #2563eb; margin-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.85rem; }
    th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
    tr:last-child td { border-bottom: none; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.75rem; }
    .stat-box .label { font-size: 0.75rem; color: #6b7280; }
    .stat-box .value { font-size: 1.3rem; font-weight: 700; margin-top: 0.25rem; }
    .footer { margin-top: 2rem; font-size: 0.75rem; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 0.75rem; }
    @media print {
      body { padding: 0; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="logo">🏨 OtelOPS</div>
  <h1>${title}</h1>
  <div class="subtitle">Oluşturulma: ${new Date().toLocaleString('tr-TR')}</div>
  ${htmlContent}
  <div class="footer">OtelOPS Hotel Management System — Bu rapor otomatik olarak oluşturulmuştur.</div>
  <script>setTimeout(() => { window.print(); window.close(); }, 500);<\/script>
</body>
</html>`);
  win.document.close();
};

/** Build an HTML table string from headers + rows */
export const buildTableHtml = (headers: string[], rows: (string | number)[][]) => {
  const ths = headers.map(h => `<th>${h}</th>`).join('');
  const trs = rows.map(row =>
    `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
  ).join('');
  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
};

/** Build stat grid html */
export const buildStatGridHtml = (stats: { label: string; value: string | number }[]) => {
  const items = stats.map(s =>
    `<div class="stat-box"><div class="label">${s.label}</div><div class="value">${s.value}</div></div>`
  ).join('');
  return `<div class="stat-grid">${items}</div>`;
};
