import { Wrench } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { BRAND } from "@toolhub/shared";

export const metadata = {
  title: `Maintenance — ${BRAND.name}`,
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background">
      <div className="mb-8">
        <Logo size="md" href="/" />
      </div>
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-6">
        <Wrench className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">We&apos;ll Be Back Shortly</h1>
      <p className="text-muted-foreground max-w-sm">
        {BRAND.name} is undergoing scheduled maintenance. We&apos;ll be back up soon.
      </p>
    </div>
  );
}
