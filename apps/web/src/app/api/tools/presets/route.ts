import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, Preset } from "@toolhub/db";
import { getUserPlan } from "@/lib/user-plan";

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
  const presets = await Preset.find({
    userId: session.user.id,
    toolSlug,
  }).sort({ createdAt: -1 });

  return NextResponse.json({ presets });
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

  const count = await Preset.countDocuments({ userId: session.user.id, toolSlug });
  if (planSlug === "pro" && count >= 5) {
    return NextResponse.json(
      {
        error: "preset_limit_reached",
        message: "PRO plan allows max 5 presets per tool. Delete one to add more.",
      },
      { status: 400 }
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
