import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserPlanSlug } from "@/lib/tool-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ planSlug: "free" });
  }

  const planSlug = await getUserPlanSlug(session.user.id);
  return NextResponse.json({ planSlug });
}
