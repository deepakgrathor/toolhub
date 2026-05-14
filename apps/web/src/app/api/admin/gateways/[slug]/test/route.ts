import { NextRequest, NextResponse } from "next/server";
import { connectDB, PaymentGateway } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = params;

  try {
    await connectDB();

    const doc = await PaymentGateway.findOne({ slug });
    if (!doc) {
      return NextResponse.json({ success: false, message: "Gateway not found" }, { status: 404 });
    }

    if (slug === "paygic") {
      if (!doc.config.merchantId) {
        return NextResponse.json({
          success: false,
          message: "Merchant ID (MID) not configured",
        });
      }
      if (!doc.config.token) {
        return NextResponse.json({
          success: false,
          message: "Token not generated. Click Generate Token first.",
        });
      }

      const start = Date.now();
      try {
        const res = await fetch("https://server.paygic.in/api/v2/checkPaymentStatus", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: doc.config.token,
          },
          body: JSON.stringify({
            mid: doc.config.merchantId,
            merchantReferenceId: "TEST_PING_000",
          }),
          signal: AbortSignal.timeout(5000),
        });
        const latency = Date.now() - start;
        const data = await res.json();

        // Paygic returns status: false for unknown IDs but API is reachable
        if (res.ok) {
          return NextResponse.json({
            success: true,
            message: `Paygic API reachable. Token valid. (${latency}ms)`,
            latency,
          });
        }
        return NextResponse.json({
          success: false,
          message: data.msg || "Unexpected response from Paygic",
        });
      } catch {
        return NextResponse.json({
          success: false,
          message: "Cannot reach Paygic API. Check network or credentials.",
        });
      }
    }

    if (slug === "cashfree") {
      if (!doc.config.apiKey) {
        return NextResponse.json({ success: false, message: "App ID not configured" });
      }
      if (!doc.config.secretKey) {
        return NextResponse.json({ success: false, message: "Secret key not configured" });
      }
      return NextResponse.json({
        success: true,
        message: "Cashfree credentials are configured.",
      });
    }

    // Razorpay / PayU stubs
    return NextResponse.json({ success: false, message: "Integration coming soon" });
  } catch (err) {
    console.error(`[gateway/${slug}/test]`, err);
    return NextResponse.json({ success: false, message: "Test failed" }, { status: 500 });
  }
}
