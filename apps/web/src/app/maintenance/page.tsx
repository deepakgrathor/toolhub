import { Wrench } from "lucide-react";

export const metadata = {
  title: "Maintenance — Toolspire",
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-[#0a0a0a]">
      <Wrench className="w-16 h-16 text-[#7c3aed] mb-6" />
      <h1 className="text-2xl font-bold text-white mb-2">We&apos;ll Be Back Soon</h1>
      <p className="text-[#888888] max-w-sm">
        Toolspire is undergoing maintenance. Check back shortly.
      </p>
    </div>
  );
}
