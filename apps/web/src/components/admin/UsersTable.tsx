"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Coins, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AdminUserRow } from "@/app/admin/users/page";

interface ModalState {
  open: boolean;
  userId: string;
  userName: string;
  amount: string;
  note: string;
  loading: boolean;
}

const MODAL_CLOSED: ModalState = {
  open: false,
  userId: "",
  userName: "",
  amount: "",
  note: "",
  loading: false,
};

interface Props {
  initialUsers: AdminUserRow[];
  initialQuery: string;
}

export function UsersTable({ initialUsers, initialQuery }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [modal, setModal] = useState<ModalState>(MODAL_CLOSED);
  const [users, setUsers] = useState(initialUsers);
  const [successId, setSuccessId] = useState<string | null>(null);

  function handleSearch(q: string) {
    setQuery(q);
    const url = q
      ? `/admin/users?q=${encodeURIComponent(q)}`
      : "/admin/users";
    router.push(url);
  }

  function openModal(user: AdminUserRow) {
    setModal({
      open: true,
      userId: user._id,
      userName: user.name,
      amount: "",
      note: "",
      loading: false,
    });
  }

  async function handleAddCredits() {
    const amount = parseInt(modal.amount, 10);
    if (!amount || amount <= 0) return;

    setModal((m) => ({ ...m, loading: true }));

    try {
      const res = await fetch(`/api/admin/users/${modal.userId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, note: modal.note }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u._id === modal.userId ? { ...u, credits: data.newBalance } : u
          )
        );
        setSuccessId(modal.userId);
        setTimeout(() => setSuccessId(null), 2500);
        setModal(MODAL_CLOSED);
        toast.success("Credits added to user");
      }
    } finally {
      setModal((m) => ({ ...m, loading: false }));
    }
  }

  const amountNum = parseInt(modal.amount, 10);
  const canSubmit = !modal.loading && amountNum > 0;

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-lg border border-border bg-[#111111] pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
        />
        {query && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-[#111111]">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Name
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Email
              </th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground w-24">
                Credits
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-20">
                Plan
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-28">
                Joined
              </th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No users found.
                </td>
              </tr>
            )}

            {users.map((user, i) => (
              <tr
                key={user._id}
                className={cn(
                  "border-b border-border last:border-0",
                  i % 2 === 0 ? "bg-transparent" : "bg-[#111111]/40"
                )}
              >
                {/* Name + avatar initial */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-[#7c3aed]/20 flex items-center justify-center text-xs font-semibold text-[#7c3aed] shrink-0 select-none">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground leading-tight">
                        {user.name}
                      </p>
                      {user.role === "admin" && (
                        <span className="text-[10px] font-semibold text-[#7c3aed] leading-none">
                          ADMIN
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>

                {/* Credits — flashes green after successful add */}
                <td
                  className={cn(
                    "px-4 py-3 text-right font-semibold tabular-nums transition-colors duration-300",
                    successId === user._id
                      ? "text-[#10b981]"
                      : "text-foreground"
                  )}
                >
                  {user.credits.toLocaleString("en-IN")}
                </td>

                {/* Plan badge */}
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full border font-medium",
                      user.plan === "free"
                        ? "border-border text-muted-foreground"
                        : "border-[#7c3aed]/40 text-[#7c3aed] bg-[#7c3aed]/10"
                    )}
                  >
                    {user.plan}
                  </span>
                </td>

                {/* Joined date */}
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openModal(user)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/5 transition-colors"
                  >
                    <Coins className="h-3.5 w-3.5" />
                    Add Credits
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Credits modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !modal.loading && setModal(MODAL_CLOSED)}
          />

          <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-[#111111] p-6 shadow-2xl">
            {/* Close */}
            <button
              onClick={() => !modal.loading && setModal(MODAL_CLOSED)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-semibold text-foreground mb-1">
              Add Credits
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Adding to{" "}
              <span className="font-medium text-foreground">
                {modal.userName}
              </span>
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Amount
                </label>
                <input
                  type="number"
                  min={1}
                  value={modal.amount}
                  onChange={(e) =>
                    setModal((m) => ({ ...m, amount: e.target.value }))
                  }
                  placeholder="e.g. 100"
                  className="w-full rounded-lg border border-border bg-[#1a1a1a] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Note{" "}
                  <span className="font-normal text-muted-foreground/60">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={modal.note}
                  onChange={(e) =>
                    setModal((m) => ({ ...m, note: e.target.value }))
                  }
                  placeholder="e.g. Promo code INDIA50"
                  className="w-full rounded-lg border border-border bg-[#1a1a1a] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => !modal.loading && setModal(MODAL_CLOSED)}
                disabled={modal.loading}
                className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCredits}
                disabled={!canSubmit}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#7c3aed] py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modal.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Coins className="h-4 w-4" />
                    Add Credits
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
