import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, Preset } from "@toolhub/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const preset = await Preset.findOne({ _id: params.id, userId: session.user.id });
  if (!preset) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }

  const body = await req.json() as {
    name?: string;
    inputs?: unknown;
    isDefault?: boolean;
  };

  if (body.isDefault === true) {
    await Preset.updateMany(
      { userId: session.user.id, toolSlug: preset.toolSlug },
      { $set: { isDefault: false } }
    );
    preset.isDefault = true;
  } else if (body.isDefault === false) {
    preset.isDefault = false;
  }

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0 || body.name.length > 50) {
      return NextResponse.json({ error: "Name must be 1-50 characters" }, { status: 400 });
    }
    preset.name = body.name.trim();
  }

  if (body.inputs !== undefined) {
    preset.inputs = body.inputs as Record<string, unknown>;
  }

  await preset.save();
  return NextResponse.json({ success: true, preset });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const preset = await Preset.findOne({ _id: params.id, userId: session.user.id });
  if (!preset) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }

  await Preset.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
