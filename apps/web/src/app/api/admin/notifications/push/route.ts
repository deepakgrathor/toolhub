import { NextRequest, NextResponse } from "next/server";
import { connectDB, User, Notification } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";

interface PushBody {
  target: "all" | "specific";
  email?: string;
  title: string;
  message: string;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as PushBody;
  const { target, email, title, message } = body;

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }

  await connectDB();

  if (target === "specific") {
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email required for specific target" }, { status: 400 });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("_id").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    await Notification.create({
      userId: user._id,
      type: "admin_push",
      title,
      message,
    });
    return NextResponse.json({ success: true, sent: 1 });
  }

  // target === 'all' — batch insert
  const users = await User.find({}).select("_id").lean();
  if (users.length === 0) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  const docs = users.map((u) => ({
    userId: u._id,
    type: "admin_push" as const,
    title,
    message,
    isRead: false,
    createdAt: new Date(),
  }));

  await Notification.insertMany(docs, { ordered: false });

  return NextResponse.json({ success: true, sent: users.length });
}
