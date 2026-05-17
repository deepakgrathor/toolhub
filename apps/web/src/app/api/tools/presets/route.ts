import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, Preset } from "@toolhub/db";
import { getUserPlan } from "@/lib/user-plan";
import { checkSavedPresetLimit, getSavedPresetLimit } from "@/lib/plan-limits";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planSlug = await getUserPlan(session.user.id);
  if (planSlug === "free" || planSlug === "lite") {
    return NextResponse.json(
      { error: "presets_not_available", message: "Presets require PRO plan or higher." },
      { status: 403 }
    );
  }

  const toolSlug = req.nextUrl.searchParams.get("toolSlug");
  if (!toolSlug) {
    return NextResponse.json({ error: "toolSlug is required" }, { status: 400 });
  }

  await connectDB();
  const [presets, limit] = await Promise.all([
    Preset.find({ userId: session.user.id, toolSlug }).sort({ createdAt: -1 }),
    getSavedPresetLimit(session.user.id),
  ]);

  return NextResponse.json({ presets, limit, current: presets.length });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planSlug = await getUserPlan(session.user.id);
  if (planSlug === "free" || planSlug === "lite") {
    return NextResponse.json(
      { error: "presets_not_available", message: "Presets require PRO plan or higher." },
      { status: 403 }
    );
  }

  const body = await req.json() as {
    toolSlug?: string;
    name?: string;
    inputs?: unknown;
  };

  const { toolSlug, name, inputs } = body;

  if (!toolSlug || !name || !inputs) {
    return NextResponse.json({ error: "toolSlug, name, inputs required" }, { status: 400 });
  }
  if (typeof name !== "string" || name.trim().length === 0 || name.length > 50) {
    return NextResponse.json({ error: "Name must be 1-50 characters" }, { status: 400 });
  }
  if (typeof inputs !== "object" || inputs === null || Array.isArray(inputs)) {
    return NextResponse.json({ error: "inputs must be an object" }, { status: 400 });
  }

  await connectDB();

  const currentCount = await Preset.countDocuments({ userId: session.user.id, toolSlug });
  const limitCheck = await checkSavedPresetLimit(session.user.id, currentCount);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: "Preset limit reached for your plan.",
        limit: limitCheck.limit,
        current: limitCheck.current,
        upgradeRequired: true,
      },
      { status: 403 }
    );
  }

  const preset = await Preset.create({
    userId: session.user.id,
    toolSlug,
    name: name.trim(),
    inputs,
    isDefault: false,
  });

  return NextResponse.json({ success: true, preset }, { status: 201 });
}
