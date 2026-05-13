export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  businessName?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pin?: string;
  items: { description: string; credits: number; amount: number }[];
  subtotal: number;
  gstAmount: number;
  total: number;
  paymentMethod?: string;
  transactionId?: string;
}

const SELLER = {
  name: "SetuLabsAI",
  address: "India",
  gstin: "YOUR_GSTIN_HERE",
  email: "support@setulix.com",
  website: "setulix.com",
};

export function generateInvoiceHTML(data: InvoiceData): string {
  const {
    invoiceNumber, date, customerName, customerEmail, customerPhone,
    businessName, gstin, address, city, state, pin,
    items, subtotal, gstAmount, total, paymentMethod, transactionId,
  } = data;

  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f4f4f5;font-size:13px;color:#09090b;">${item.description}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f4f4f5;font-size:13px;color:#09090b;text-align:center;">${item.credits}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f4f4f5;font-size:13px;color:#09090b;text-align:right;">&#8377;${item.amount.toFixed(2)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoiceNumber}</title>
</head>
<body style="margin:0;padding:32px;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">

    <!-- Invoice header -->
    <div style="background:#7c3aed;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <span style="font-size:22px;font-weight:800;color:#ffffff;">Setu<span style="color:#c4b5fd;">Lix</span></span>
        <p style="color:#ede9fe;font-size:11px;margin:2px 0 0;">by SetuLabsAI</p>
      </div>
      <div style="text-align:right;">
        <p style="color:#ffffff;font-size:18px;font-weight:700;margin:0;">TAX INVOICE</p>
        <p style="color:#c4b5fd;font-size:12px;margin:4px 0 0;">${invoiceNumber}</p>
        <p style="color:#c4b5fd;font-size:11px;margin:2px 0 0;">${date}</p>
      </div>
    </div>

    <div style="padding:28px 32px;">

      <!-- Seller / Buyer grid -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td width="48%" valign="top" style="padding-right:16px;">
            <p style="font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">From</p>
            <p style="font-size:14px;font-weight:700;color:#09090b;margin:0 0 4px;">${SELLER.name}</p>
            <p style="font-size:12px;color:#71717a;margin:0 0 2px;">${SELLER.address}</p>
            <p style="font-size:12px;color:#71717a;margin:0 0 2px;">GSTIN: ${SELLER.gstin}</p>
            <p style="font-size:12px;color:#71717a;margin:0;">${SELLER.email}</p>
          </td>
          <td width="4%"></td>
          <td width="48%" valign="top">
            <p style="font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Bill To</p>
            <p style="font-size:14px;font-weight:700;color:#09090b;margin:0 0 4px;">${customerName}</p>
            ${businessName ? `<p style="font-size:12px;color:#71717a;margin:0 0 2px;">${businessName}</p>` : ""}
            ${gstin ? `<p style="font-size:12px;color:#71717a;font-family:monospace;margin:0 0 2px;">GSTIN: ${gstin}</p>` : ""}
            <p style="font-size:12px;color:#71717a;margin:0 0 2px;">${customerEmail}</p>
            ${customerPhone ? `<p style="font-size:12px;color:#71717a;margin:0 0 2px;">${customerPhone}</p>` : ""}
            ${address ? `<p style="font-size:12px;color:#71717a;margin:0 0 2px;">${address}</p>` : ""}
            ${(city || state || pin) ? `<p style="font-size:12px;color:#71717a;margin:0;">${[city, state, pin].filter(Boolean).join(", ")}</p>` : ""}
          </td>
        </tr>
      </table>

      <!-- Items table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        <thead>
          <tr style="background:#f4f4f5;">
            <th style="padding:10px 12px;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;text-align:left;letter-spacing:0.5px;">Description</th>
            <th style="padding:10px 12px;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;text-align:center;letter-spacing:0.5px;">Credits</th>
            <th style="padding:10px 12px;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;text-align:right;letter-spacing:0.5px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- Tax breakdown -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td width="55%"></td>
          <td width="45%">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#71717a;">Subtotal</td>
                <td style="padding:5px 0;font-size:13px;color:#09090b;text-align:right;">&#8377;${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#71717a;">CGST (9%)</td>
                <td style="padding:5px 0;font-size:13px;color:#09090b;text-align:right;">&#8377;${cgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;font-size:13px;color:#71717a;">SGST (9%)</td>
                <td style="padding:5px 0;font-size:13px;color:#09090b;text-align:right;">&#8377;${sgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="2" style="border-top:2px solid #e4e4e7;padding-top:8px;"></td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:15px;font-weight:700;color:#09090b;">Total</td>
                <td style="padding:6px 0;font-size:15px;font-weight:700;color:#7c3aed;text-align:right;">&#8377;${total.toFixed(2)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Payment info -->
      ${(transactionId || paymentMethod) ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:20px;">
        <p style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Payment Info</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${transactionId ? `<tr><td style="font-size:12px;color:#71717a;padding:2px 0;">Transaction ID</td><td style="font-size:12px;font-family:monospace;color:#09090b;text-align:right;">${transactionId}</td></tr>` : ""}
          ${paymentMethod ? `<tr><td style="font-size:12px;color:#71717a;padding:2px 0;">Payment Method</td><td style="font-size:12px;color:#09090b;text-align:right;">${paymentMethod}</td></tr>` : ""}
          <tr><td style="font-size:12px;color:#71717a;padding:2px 0;">Status</td><td style="font-size:12px;font-weight:700;color:#16a34a;text-align:right;">PAID</td></tr>
        </table>
      </div>
      ` : ""}

      <!-- Footer note -->
      <p style="font-size:11px;color:#a1a1aa;text-align:center;margin:0;">
        Thank you for your business &middot; This is a computer-generated invoice &middot; No signature required
      </p>

    </div>
  </div>
</body>
</html>`;
}
