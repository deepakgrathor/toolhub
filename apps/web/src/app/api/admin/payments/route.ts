import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB, Payment, User } from "@toolhub/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? "all";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;
  const skip = (page - 1) * limit;

  await connectDB();

  // Build status filter
  const filter: Record<string, unknown> =
    status !== "all" ? { status } : {};

  const [payments, totalCount, statsAgg] = await Promise.all([
    Payment.find(filter)
      .select("-billingSnapshot")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email")
      .lean(),
    Payment.countDocuments(filter),
    Payment.aggregate([
      {
        $facet: {
          totalRevenue: [
            { $match: { status: "paid" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ],
          todayRevenue: [
            {
              $match: {
                status: "paid",
                createdAt: {
                  $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
              },
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ],
          totalTransactions: [{ $count: "count" }],
          paidCount: [{ $match: { status: "paid" } }, { $count: "count" }],
        },
      },
    ]),
  ]);

  const agg = statsAgg[0];
  const totalRevenue = agg.totalRevenue[0]?.total ?? 0;
  const todayRevenue = agg.todayRevenue[0]?.total ?? 0;
  const totalTransactions = agg.totalTransactions[0]?.count ?? 0;
  const paidCount = agg.paidCount[0]?.count ?? 0;
  const successRate =
    totalTransactions > 0 ? Math.round((paidCount / totalTransactions) * 100) : 0;

  // Serialize payments
  const rows = payments.map((p) => {
    const user = p.userId as unknown as { name: string; email: string } | null;
    return {
      _id: p._id?.toString(),
      orderId: p.orderId,
      userName: user?.name ?? "Unknown",
      userEmail: user?.email ?? "",
      type: p.type,
      amount: p.totalAmount,
      status: p.status,
      invoiceNumber: p.invoiceNumber ?? null,
      paymentMethod: p.paymentMethod ?? null,
      cashfreePaymentId: p.cashfreePaymentId ?? null,
      credits: p.credits,
      planSlug: p.planSlug ?? null,
      billingCycle: p.billingCycle ?? null,
      createdAt: p.createdAt?.toISOString(),
    };
  });

  return NextResponse.json({
    payments: rows,
    totalCount,
    stats: { totalRevenue, todayRevenue, totalTransactions, successRate },
  });
}
