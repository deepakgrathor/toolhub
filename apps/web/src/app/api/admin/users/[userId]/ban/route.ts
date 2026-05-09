import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, AuditLog } from "@toolhub/db";
import { z } from "zod";

const schema = z.object({ isBanned: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await connectDB();

  const user = await User.findByIdAndUpdate(
    params.userId,
    { isBanned: parsed.data.isBanned },
    { new: true }
  ).lean();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await AuditLog.create({
    adminId: session.user.id,
    action: parsed.data.isBanned ? "ban_user" : "unban_user",
    target: `user:${params.userId}`,
    after: { isBanned: parsed.data.isBanned },
  });

  return NextResponse.json({ success: true, isBanned: user.isBanned });
}
