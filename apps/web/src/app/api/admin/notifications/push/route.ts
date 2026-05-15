import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB, User, Notification } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";

const PushSchema = z.object({
  target: z.enum(["all", "specific"]),
  email: z.string().optional(),
  title: z.string().min(1, "Title required").max(100, "Title max 100 characters").trim(),
  message: z.string().min(1, "Message required").max(500, "Message max 500 characters").trim(),
});

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = PushSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { target, email } = parsed.data;
  const safeTitle = stripHtml(parsed.data.title);
  const safeMessage = stripHtml(parsed.data.message);

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
      title: safeTitle,
      message: safeMessage,
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
    title: safeTitle,
    message: safeMessage,
    isRead: false,
    createdAt: new Date(),
  }));

  await Notification.insertMany(docs, { ordered: false });

  return NextResponse.json({ success: true, sent: users.length });
}
