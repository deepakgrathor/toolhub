# Handoff Note
Updated: 2026-05-13 | Account: B | Session: #5 | Multi-profession + Recommendations + Sidebar redesign

## Where We Are
Session B5 done. **TypeScript: 0 errors.** Committed to main.

---

## What Was Done (Session B5)

### FIX 1 — Onboarding Step 4 Redirect
**Problem:** After clicking Launch, API returned success but page reloaded back to step 4 because `router.push('/dashboard')` issued a client-side navigation while the JWE cookie update from `await update()` hadn't propagated to the browser cookie store yet.

**Fix:** Replaced `router.push('/dashboard')` with `window.location.href = '/dashboard'`. The full page reload guarantees the browser sends the updated JWE cookie with the navigation request, so middleware sees `onboardingCompleted: true`.

---

### IMPLEMENT 3 — Multi-select Profession

**User model** (`packages/db/src/models/User.ts`):
- Added `professions: [String]` field (enum, default `[]`).
- Legacy `profession: String` kept for backwards compat.

**Onboarding page** (`apps/web/src/app/onboarding/page.tsx`):
- Step 1 now multi-select: clicking a card toggles it in/out of `professions[]` array.
- Selected cards show purple border + checkmark (same visual style, now toggles).
- Kit name auto-generated via `buildKitName()` from `recommendations.ts`.
- Minimum 1 profession required to Continue.

**API** (`api/onboarding/complete`):
- Accepts `professions: string[]` (falls back to `[profession]` for legacy clients).
- Saves both `professions` (array) and `profession` (first item) to user.

---

### IMPLEMENT 4 — Smart Recommendation Engine

**New file** `apps/web/src/lib/recommendations.ts`:
- `getRecommendedTools({ professions, teamSize, challenge })` — scores all 27 tools.
  - +30 if tool kit matches any selected profession kit
  - +20 if tool tags match challenge keyword
  - +15 if tool is free (lower barrier)
- `buildKitName(firstName, professions)` — generates kit name:
  - 1 profession → "Deepak Creator Pro Kit"
  - 2 professions → "Deepak Creator & Business Kit"
  - 3+ → "Deepak All-In-One Kit"

**API** (`api/onboarding/recommendations` — GET):
- Query params: `professions` (repeatable), `teamSize`, `challenge`.
- Returns scored tool list.

**Onboarding complete API** uses recommendation engine instead of hardcoded `PROFESSION_TOOLS`.

---

### IMPLEMENT 5 — Workspace Zustand Store + Instant Explore Sync

**New file** `apps/web/src/store/workspace-store.ts`:
- `useWorkspaceStore` — Zustand store: `kitName`, `professions`, `kitTools`, `addedTools`, `initialized`.
- `setWorkspace(data)` — populate on mount.
- `addTool(tool)` / `removeTool(slug)` — called from explore page on add/remove.

**Explore page** (`apps/web/src/app/(site)/explore/page.tsx`):
- On add: calls `addTool({ slug, name })` → sidebar updates instantly (no refresh).
- On remove: calls `removeTool(slug)` → sidebar updates instantly.

**Sidebar** loads workspace once via `useWorkspaceInit()` hook and reads reactively from `useWorkspaceStore`.

---

### IMPLEMENT 6 — Sidebar Redesign

New visual hierarchy in `Sidebar.tsx`:

```
Dashboard
Explore Tools
────────────
MY KIT               ← section label (10px uppercase)
┌─ Deepak Creator Pro Kit ─┐  ← kit header (bg-accent/5, border-accent/20)
└──────────────────────────┘
  pl-6 indented tools with border-l-2

MY TOOLS             ← section label
┌─ My Added Tools ──────────┐  ← added header (bg-muted/50, border-border)
└──────────────────────────┘
  pl-6 indented added tools
```

- Active tool: `text-primary font-medium border-l-primary` + left indicator bar.
- Loading skeleton (4 pulse bars) while `initialized = false`.
- Collapsed mode: icons only, no section headers.

---

## Architecture Notes (Updated)

### Workspace Data Flow
```
Mount → useWorkspaceInit() → GET /api/user/workspace
                           → setWorkspace(data) → store initialized

Explore Add → POST /api/explore/add
           → addTool({ slug, name }) → sidebar re-renders instantly

Explore Remove → DELETE /api/explore/remove
              → removeTool(slug) → sidebar re-renders instantly
```

### Profession → Kit → Tools mapping
- `professions[]` on user (new, multi-value)
- `profession` on user (legacy, = professions[0])
- Workspace API merges kit tools from ALL selected professions (de-duped)

---

## Previous Sessions

### Session B4 — HKDF Fix (Real Root Cause)
Fixed Auth.js v5 JWE key derivation: 64-byte HKDF key, salt = cookie name, info = "Auth.js Generated Encryption Key (${cookieName})". Eliminated infinite reload loop on production.

### Session B2 — Marketing Pages + Auth
Moved public pages to `(marketing)` route group, fixed Start Free button, fixed sidebar personalization, fixed dashboard auth gate, fixed auth modal light theme.

---

## Issues
None. TypeScript: 0 errors.
