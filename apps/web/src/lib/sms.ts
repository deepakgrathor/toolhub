export async function sendOtpSMS(phoneNumber: string, otp: string): Promise<boolean> {
  try {
    const token = process.env.BULKSMS_TOKEN;
    if (!token) {
      // Dev fallback: log to console
      console.log(`\n[SMS OTP] To: ${phoneNumber} → ${otp}\n`);
      return true;
    }

    const params = new URLSearchParams({
      authorization : token,
      route: "dlt",
      sender_id: "BILBRO",
      message: "7655",
      variables_values: otp,
      flash: "0",
      numbers: phoneNumber,
    });

    const res = await fetch(`https://bulk9.com/dev/api?${params.toString()}`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.text();
    console.log("[SMS] BulkSMS response:", data);
    return res.ok;
  } catch (error) {
    console.error("[SMS] Failed to send OTP:", error);
    return false;
  }
}
