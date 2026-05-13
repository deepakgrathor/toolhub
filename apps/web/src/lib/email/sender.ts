const FROM = "SetuLix <noreply@setulix.com>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log(`[email] RESEND_API_KEY not set. Would send to ${to}: ${subject}`);
      return;
    }

    const body: Record<string, unknown> = { from: FROM, to, subject, html };
    if (replyTo) body.reply_to = replyTo;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[email] Resend error ${res.status}:`, err);
    }
  } catch (err) {
    // Never throw — email failure must not break main flow
    console.error("[email] sendEmail failed:", err);
  }
}
