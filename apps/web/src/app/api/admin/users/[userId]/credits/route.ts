import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, CreditService, AuditLog } from "@toolhub/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  amount: z.number().int().positive(),
  note: z.string().default(""),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { userId } = params;
  await connectDB();

  const { newBalance } = await CreditService.addCredits(
    userId,
    parsed.data.amount,
    "manual_admin",
    { note: parsed.data.note, adminId: session.user.id }
  );

  await AuditLog.create({
    adminId: session.user.id,
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
