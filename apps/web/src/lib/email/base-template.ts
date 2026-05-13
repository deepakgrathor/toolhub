const YEAR = new Date().getFullYear();

export function baseEmailTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>SetuLix</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">

          <!-- Header -->
          <tr>
            <td style="background:#7c3aed;padding:24px 32px;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                Setu<span style="color:#c4b5fd;">Lix</span>
              </span>
              <span style="color:#ede9fe;font-size:12px;display:block;margin-top:2px;">by SetuLabsAI</span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #e4e4e7;padding:20px 32px;text-align:center;background:#fafafa;">
              <p style="color:#a1a1aa;font-size:11px;margin:0 0 4px;">
                SetuLabsAI &middot; support@setulix.com &middot; setulix.com
              </p>
              <p style="color:#d4d4d8;font-size:10px;margin:0;">
                &copy; ${YEAR} SetuLabsAI. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
