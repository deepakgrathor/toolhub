import { baseEmailTemplate } from "./base-template";

interface EmailTemplate {
  subject: string;
  html: string;
}

export function welcomeEmail({ name }: { name: string }): EmailTemplate {
  const firstName = name.split(" ")[0] ?? name;
  return {
    subject: `Welcome to SetuLix, ${firstName}!`,
    html: baseEmailTemplate(`
      <h2 style="color:#09090b;margin:0 0 8px;font-size:22px;font-weight:700;">
        Welcome to SetuLix! 🎉
      </h2>
      <p style="color:#71717a;margin:0 0 20px;font-size:15px;line-height:1.6;">
        Hi ${firstName}, your account is ready. You've received <strong style="color:#7c3aed;">10 free credits</strong> to get started.
      </p>
      <table cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:12px;padding:20px;margin:0 0 24px;width:100%;">
        <tr>
          <td style="text-align:center;">
            <span style="font-size:36px;font-weight:800;color:#7c3aed;">10</span>
            <span style="font-size:16px;color:#71717a;margin-left:6px;">credits</span>
            <p style="color:#71717a;font-size:13px;margin:6px 0 0;">Free credits in your account</p>
          </td>
        </tr>
      </table>
      <p style="color:#71717a;margin:0 0 24px;font-size:14px;line-height:1.6;">
        SetuLix gives you access to 27+ AI tools — blog generator, GST invoice, resume screener, and more. Built for Indian professionals.
      </p>
      <a href="https://setulix.com/dashboard"
         style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
        Go to Dashboard →
      </a>
    `),
  };
}

export function accountDeletionEmail({ name }: { name: string }): EmailTemplate {
  const firstName = name.split(" ")[0] ?? name;
  return {
    subject: "Your SetuLix account has been deactivated",
    html: baseEmailTemplate(`
      <h2 style="color:#09090b;margin:0 0 8px;font-size:20px;font-weight:700;">Account Deactivated</h2>
      <p style="color:#71717a;margin:0 0 16px;font-size:15px;line-height:1.6;">
        Hi ${firstName}, your SetuLix account has been deactivated as requested.
      </p>
      <table cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:0 0 20px;width:100%;">
        <tr>
          <td>
            <p style="color:#dc2626;font-size:13px;margin:0;font-weight:600;">Important:</p>
            <p style="color:#ef4444;font-size:13px;margin:6px 0 0;line-height:1.5;">
              Your data will be retained for 30 days. After that, it will be permanently deleted and cannot be recovered.
            </p>
          </td>
        </tr>
      </table>
      <p style="color:#71717a;margin:0 0 20px;font-size:14px;line-height:1.6;">
        If you didn't request this or want to restore your account, please contact us at
        <a href="mailto:support@setulix.com" style="color:#7c3aed;">support@setulix.com</a> within 30 days.
      </p>
      <p style="color:#a1a1aa;font-size:13px;margin:0;">Thank you for using SetuLix. We hope to see you again.</p>
    `),
  };
}

export function creditPurchaseEmail({
  name,
  credits,
  amount,
  invoiceNumber,
  transactionId,
}: {
  name: string;
  credits: number;
  amount: number;
  invoiceNumber: string;
  transactionId: string;
}): EmailTemplate {
  const firstName = name.split(" ")[0] ?? name;
  return {
    subject: `Payment Confirmed — ${credits} Credits Added`,
    html: baseEmailTemplate(`
      <h2 style="color:#09090b;margin:0 0 8px;font-size:20px;font-weight:700;">Payment Confirmed</h2>
      <p style="color:#71717a;margin:0 0 20px;font-size:15px;line-height:1.6;">
        Hi ${firstName}, your payment was successful and <strong style="color:#7c3aed;">${credits} credits</strong> have been added to your account.
      </p>
      <table cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:0 0 20px;width:100%;">
        <tr>
          <td>
            <p style="color:#16a34a;font-size:24px;font-weight:800;margin:0;">+${credits} Credits</p>
            <p style="color:#71717a;font-size:13px;margin:4px 0 0;">Added to your account</p>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
        <tr>
          <td style="color:#a1a1aa;font-size:13px;padding:6px 0;">Invoice Number</td>
          <td style="color:#09090b;font-size:13px;font-family:monospace;text-align:right;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="color:#a1a1aa;font-size:13px;padding:6px 0;">Amount Paid</td>
          <td style="color:#09090b;font-size:13px;font-weight:600;text-align:right;">₹${amount}</td>
        </tr>
        <tr>
          <td style="color:#a1a1aa;font-size:13px;padding:6px 0;">Transaction ID</td>
          <td style="color:#09090b;font-size:13px;font-family:monospace;text-align:right;">${transactionId}</td>
        </tr>
      </table>
      <a href="https://setulix.com/credits"
         style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
        View Credits →
      </a>
    `),
  };
}

export function planUpgradeEmail({
  name,
  planName,
  credits,
  amount,
  invoiceNumber,
}: {
  name: string;
  planName: string;
  credits: number;
  amount: number;
  invoiceNumber: string;
}): EmailTemplate {
  const firstName = name.split(" ")[0] ?? name;
  return {
    subject: `You're now on SetuLix ${planName}!`,
    html: baseEmailTemplate(`
      <h2 style="color:#09090b;margin:0 0 8px;font-size:20px;font-weight:700;">
        Welcome to ${planName}!
      </h2>
      <p style="color:#71717a;margin:0 0 20px;font-size:15px;line-height:1.6;">
        Hi ${firstName}, your plan has been upgraded to <strong style="color:#7c3aed;">${planName}</strong>.
        You now have access to all the features and <strong>${credits} credits</strong> per cycle.
      </p>
      <table cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:20px;margin:0 0 20px;width:100%;">
        <tr>
          <td>
            <p style="color:#7c3aed;font-size:20px;font-weight:800;margin:0;">${planName} Plan</p>
            <p style="color:#71717a;font-size:13px;margin:4px 0 0;">${credits} credits &middot; All features unlocked</p>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
        <tr>
          <td style="color:#a1a1aa;font-size:13px;padding:6px 0;">Invoice Number</td>
          <td style="color:#09090b;font-size:13px;font-family:monospace;text-align:right;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="color:#a1a1aa;font-size:13px;padding:6px 0;">Amount Paid</td>
          <td style="color:#09090b;font-size:13px;font-weight:600;text-align:right;">₹${amount}</td>
        </tr>
      </table>
      <a href="https://setulix.com/dashboard"
         style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
        Go to Dashboard →
      </a>
    `),
  };
}

export function creditLowEmail({ name, balance }: { name: string; balance: number }): EmailTemplate {
  const firstName = name.split(" ")[0] ?? name;
  return {
    subject: "Your SetuLix credits are running low",
    html: baseEmailTemplate(`
      <h2 style="color:#09090b;margin:0 0 8px;font-size:20px;font-weight:700;">Credits Running Low</h2>
      <p style="color:#71717a;margin:0 0 20px;font-size:15px;line-height:1.6;">
        Hi ${firstName}, you have only <strong style="color:#f59e0b;">${balance} credits</strong> left in your SetuLix account.
      </p>
      <p style="color:#71717a;margin:0 0 24px;font-size:14px;line-height:1.6;">
        Don't run out — top up now to continue using our AI tools without interruption.
      </p>
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:12px;">
            <a href="https://setulix.com/checkout?type=pack"
               style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
              Buy Credits →
            </a>
          </td>
          <td>
            <a href="https://setulix.com/pricing"
               style="display:inline-block;border:1px solid #7c3aed;color:#7c3aed;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
              Upgrade Plan
            </a>
          </td>
        </tr>
      </table>
    `),
  };
}
