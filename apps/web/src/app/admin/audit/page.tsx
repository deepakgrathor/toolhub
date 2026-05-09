import type { Metadata } from "next";
import { AuditLogTable } from "@/components/admin/AuditLogTable";

export const metadata: Metadata = { title: "Audit Log — SetuLix Admin" };

export default function AuditLogPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-foreground mb-1">Audit Log</h1>
      <p className="text-sm text-muted-foreground mb-6">All admin actions — newest first</p>
      <AuditLogTable />
    </div>
  );
}
