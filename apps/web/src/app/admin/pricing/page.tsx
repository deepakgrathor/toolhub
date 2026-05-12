import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Admin Pricing — ToolHub" };

export default function AdminPricingPage() {
  redirect("/admin/credit-packs");
}
