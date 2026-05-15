import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB, CreditService, AuditLog } from "@toolhub/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const MAX_CREDIT_ADD = 10000;

const schema = z.object({
  amount: z.number().int().positive().max(MAX_CREDIT_ADD),
  note: z.string().default(""),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const isCapExceeded = parsed.error.errors.some(
      (e) => e.path[0] === "amount" && e.code === "too_big"
    );
    return NextResponse.json(
      {
        error: isCapExceeded
          ? "Maximum 10,000 credits can be added in a single transaction"
          : "Invalid request",
      },
      { status: 400 }
    );
  }

  const { userId } = params;
  await connectDB();

  const { newBalance } = await CreditService.addCredits(
    userId,
    parsed.data.amount,
    "manual_admin",
    { note: parsed.data.note, adminId: admin.userId }
  );

  await AuditLog.create({
    adminId: admin.userId,
    action: "add_credits",
    target: `user:${userId}`,
    before: null,
    after: {
      amount: parsed.data.amount,
      note: parsed.data.note,
      newBalance,
    },
  });

  return NextResponse.json({ success: true, newBalance });
}
