"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User, Building2, Camera, Lock, Loader2, Check,
  Globe, Phone, MapPin, Briefcase, FileText, AlertTriangle,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Static data ───────────────────────────────────────────────────────────────

const PROFESSION_OPTIONS = [
  { value: "creator",  label: "Content Creator" },
  { value: "sme",      label: "Business Owner" },
  { value: "hr",       label: "HR Professional" },
  { value: "legal",    label: "CA / Legal Pro" },
  { value: "marketer", label: "Marketer" },
  { value: "other",    label: "Other" },
];

const INDUSTRY_OPTIONS = [
  "Technology", "E-commerce", "Education", "Healthcare", "Finance",
  "Real Estate", "Food & Beverage", "Retail", "Manufacturing",
  "Media & Entertainment", "Consulting", "Legal", "Travel", "Logistics", "Other",
];

const TEAM_SIZE_OPTIONS = ["solo", "2-10", "11-50", "50+"];

const GST_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman & Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

// ── Interfaces ────────────────────────────────────────────────────────────────

interface ProfileData {
  user: {
    name: string; email: string; mobile?: string; address?: string;
    profession?: string; avatar?: string; profileScore: number;
  };
  business: {
    businessName?: string; businessType?: string; industry?: string;
    gstNumber?: string; gstState?: string; website?: string;
    teamSize?: string; phone?: string; businessAddress?: string; logo?: string;
  } | null;
  score: number;
}

// ── Avatar uploader ───────────────────────────────────────────────────────────

function AvatarUploader({
  currentUrl,
  name,
  onUpload,
}: {
  currentUrl?: string;
  name: string;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { update } = useSession();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        onUpload(data.url);
        await update({ image: data.url });
        toast.success("Avatar updated");
      } else toast.error(data.error ?? "Upload failed");
    } catch { toast.error("Upload failed"); }
    setUploading(false);
  }

  return (
    <div
      className="relative h-20 w-20 cursor-pointer group"
      onClick={() => inputRef.current?.click()}
    >
      <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border">
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {name?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
      </div>
      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading
          ? <Loader2 className="h-5 w-5 text-white animate-spin" />
          : <Camera className="h-5 w-5 text-white" />}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Logo uploader ─────────────────────────────────────────────────────────────

function LogoUploader({
  currentUrl,
  businessName,
  onUpload,
}: {
  currentUrl?: string;
  businessName?: string;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/profile/logo", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) { onUpload(data.url); toast.success("Logo updated"); }
      else toast.error(data.error ?? "Upload failed");
    } catch { toast.error("Upload failed"); }
    setUploading(false);
  }

  return (
    <div
      className="relative h-20 w-20 cursor-pointer group"
      onClick={() => inputRef.current?.click()}
    >
      <div className="h-20 w-20 rounded-xl overflow-hidden border-2 border-border bg-card flex items-center justify-center">
        {currentUrl ? (
          <img src={currentUrl} alt="Logo" className="h-full w-full object-contain p-1" />
        ) : (
          <span className="text-xs text-muted-foreground text-center px-1">
            {businessName?.[0]?.toUpperCase() ?? "B"}
          </span>
        )}
      </div>
      <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading
          ? <Loader2 className="h-5 w-5 text-white animate-spin" />
          : <Camera className="h-5 w-5 text-white" />}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-16 w-16">
        <svg className="-rotate-90" viewBox="0 0 64 64" width="64" height="64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
          <circle
            cx="32" cy="32" r={r} fill="none" stroke="#7c3aed" strokeWidth="4"
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">Profile Score</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"personal" | "business">("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProfileData | null>(null);

  // Personal form
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [profession, setProfession] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Business form
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [industry, setIndustry] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [gstState, setGstState] = useState("");
  const [website, setWebsite] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d: ProfileData) => {
        setData(d);
        setName(d.user.name ?? "");
        setMobile(d.user.mobile ?? "");
        setAddress(d.user.address ?? "");
        setProfession(d.user.profession ?? "");
        setAvatarUrl(d.user.avatar ?? "");
        setBusinessName(d.business?.businessName ?? "");
        setBusinessType(d.business?.businessType ?? "");
        setIndustry(d.business?.industry ?? "");
        setGstNumber(d.business?.gstNumber ?? "");
        setGstState(d.business?.gstState ?? "");
        setWebsite(d.business?.website ?? "");
        setTeamSize(d.business?.teamSize ?? "");
        setBizPhone(d.business?.phone ?? "");
        setBizAddress(d.business?.businessAddress ?? "");
        setLogoUrl(d.business?.logo ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  async function savePersonal() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/personal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile, address, profession }),
      });
      const d = await res.json() as { score?: number; error?: string };
      if (d.score !== undefined && data) {
        setData({ ...data, score: d.score });
      }
      if (res.ok) toast.success("Personal profile saved");
      else toast.error(d.error ?? "Save failed");
    } catch { toast.error("Save failed"); }
    setSaving(false);
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await fetch("/api/user/delete-account", { method: "POST" });
      await signOut({ callbackUrl: "/?deleted=true" });
    } catch {
      toast.error("Failed to delete account. Try again.");
    }
    setDeleting(false);
  }

  async function saveBusiness() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName, businessType, industry, gstNumber,
          gstState, website, teamSize, phone: bizPhone, businessAddress: bizAddress,
        }),
      });
      const d = await res.json() as { score?: number; error?: string };
      if (d.score !== undefined && data) {
        setData({ ...data, score: d.score });
      }
      if (res.ok) toast.success("Business profile saved");
      else toast.error(d.error ?? "Save failed");
    } catch { toast.error("Save failed"); }
    setSaving(false);
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) return null;

  const score = data?.score ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your personal and business info</p>
        </div>
        <ScoreRing score={score} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {(["personal", "business"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "personal" ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
            {tab === "personal" ? "Personal" : "Business"}
          </button>
        ))}
      </div>

      {/* Personal Tab */}
      {activeTab === "personal" && (
        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <AvatarUploader
              currentUrl={avatarUrl || data?.user.avatar || session.user.image || ""}
              name={name || session.user.name || "U"}
              onUpload={(url) => setAvatarUrl(url)}
            />
            <div>
              <p className="text-sm font-medium text-foreground">Profile Photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP. Max 2MB.</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="Your name"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
            <div className="relative">
              <input
                value={session.user.email ?? ""}
                disabled
                className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground outline-none pr-10"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Mobile
              </div>
            </label>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="+91 9876543210"
            />
          </div>

          {/* Role / Profession */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Role
              </div>
            </label>
            <select
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            >
              <option value="">Select role</option>
              {PROFESSION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Address
              </div>
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
              placeholder="Your address"
            />
          </div>

          <button
            onClick={savePersonal}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      )}

      {/* Business Tab */}
      {activeTab === "business" && (
        <div className="space-y-5">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <LogoUploader
              currentUrl={logoUrl}
              businessName={businessName}
              onUpload={(url) => setLogoUrl(url)}
            />
            <div>
              <p className="text-sm font-medium text-foreground">Business Logo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP. Max 2MB.</p>
            </div>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Business Name</label>
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="Your Business Name" />
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Business Type</label>
            <input value={businessType} onChange={(e) => setBusinessType(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="e.g. Pvt Ltd, Partnership, Sole Proprietor" />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Industry</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30">
              <option value="">Select industry</option>
              {INDUSTRY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* GST Number */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">GST Number</label>
            <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="22AAAAA0000A1Z5" maxLength={15} />
          </div>

          {/* GST State */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">GST State</label>
            <select value={gstState} onChange={(e) => setGstState(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30">
              <option value="">Select state</option>
              {GST_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              <div className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Website</div>
            </label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="https://yourbusiness.com" />
          </div>

          {/* Team Size */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Team Size</label>
            <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30">
              <option value="">Select team size</option>
              {TEAM_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Business Phone */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Business Phone</div>
            </label>
            <input value={bizPhone} onChange={(e) => setBizPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="+91 9876543210" />
          </div>

          {/* Business Address */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Business Address</div>
            </label>
            <textarea value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
              placeholder="Full business address" />
          </div>

          <button onClick={saveBusiness} disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      )}

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <div className="mt-10 rounded-xl border border-destructive/40 bg-destructive/5 p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h2 className="text-sm font-semibold text-destructive">Delete Account</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Your account will be deactivated. Data is kept for 30 days, after which it is permanently deleted.
          You will not be able to login.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="rounded-lg border border-destructive px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
        >
          Delete My Account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="text-base font-semibold text-foreground">Delete Account</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone within 30 days. Your account will be deactivated immediately.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm
              </label>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono text-foreground outline-none focus:border-destructive focus:ring-1 focus:ring-destructive/30"
                placeholder="DELETE"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
