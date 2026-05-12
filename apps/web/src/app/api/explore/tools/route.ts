import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User } from "@toolhub/db";
import { getAllTools } from "@/lib/tool-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const [tools, user] = await Promise.all([
    getAllTools(),
    User.findById(session.user.id).lean(),
  ]);

  const userAddedSlugs = user?.selectedTools ?? [];

  return NextResponse.json({ tools, userAddedSlugs });
}
