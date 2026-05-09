export function printDocument(htmlContent: string, title: string): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #000;
      background: #fff;
      padding: 20mm;
    }
    @media print {
      body { padding: 15mm; }
      .no-print { display: none !important; }
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .text-lg { font-size: 16px; }
    .text-xl { font-size: 20px; }
    .text-sm { font-size: 11px; }
    .text-xs { font-size: 10px; }
    .mb-1 { margin-bottom: 4px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-4 { margin-bottom: 16px; }
    .mb-6 { margin-bottom: 24px; }
    .mt-2 { margin-top: 8px; }
    .mt-4 { margin-top: 16px; }
    .mt-6 { margin-top: 24px; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .border-top { border-top: 2px solid #000; padding-top: 8px; }
    .border-bottom { border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    .highlight { background: #f0f0f0; font-weight: 700; }
    .muted { color: #666; }
    .accent { color: #7c3aed; }
  </style>
</head>
<body>
${htmlContent}
<script>
  window.onload = function() { window.print(); }
<\/script>
</body>
</html>`);
  printWindow.document.close();
}
