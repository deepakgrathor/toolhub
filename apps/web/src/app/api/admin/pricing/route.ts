import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, CreditPack, AuditLog } from "@toolhub/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  credits: z.number().int().min(1),
  priceInr: z.number().min(0),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  razorpayPlanId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectDB();

  const pack = await CreditPack.create(parsed.data);

  await AuditLog.create({
    adminId: session.user.id,
    action: "create_credit_pack",
    target: `pack:${pack._id}`,
    before: null,
    after: {
      name: pack.name,
      credits: pack.credits,
      priceInr: pack.priceInr,
      isFeatured: pack.isFeatured,
      isActive: pack.isActive,
    },
  });

  return NextResponse.json({ success: true, pack }, { status: 201 });
}
