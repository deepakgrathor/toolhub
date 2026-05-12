import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, Notification } from "@toolhub/db";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectDB();

  await Notification.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: { isRead: true } }
  );

  return NextResponse.json({ success: true });
}
