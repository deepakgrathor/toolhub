import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, BillingProfile } from "@toolhub/db";
import { z } from "zod";

const schema = z.object({
  accountType: z.enum(["individual", "business"]).default("individual"),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  businessName: z.string().optional(),
  gstState: z.string().optional(),
  contactPerson: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const profile = await BillingProfile.findOne({ userId: session.user.id }).lean();
  return NextResponse.json(profile ?? null);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await connectDB();

  const profile = await BillingProfile.findOneAndUpdate(
    { userId: session.user.id },
    { userId: session.user.id, ...parsed.data },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json(profile);
}
