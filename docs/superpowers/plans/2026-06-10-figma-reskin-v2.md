# KIRA PWA Figma Re-skin v2 (Iteration 10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the KIRA PWA to Angelina's new gradient Figma design and add splash, signup, profile, upgrade, and subscription pages (Stripe stubbed).

**Architecture:** Theme-first restyle in place — extend the existing token layer in `app/globals.css`, restyle each screen's CSS module, swap text logo for the Figma K-mark SVG, and add 4 new routes + a splash overlay. All data flows (Supabase auth, share-target ingest, chat, Exa deepen, PATCH edits) are already wired and stay untouched. New behavior (plan-gated Go Deeper, splash visibility, public signup path, unclassified filter, greeting name) is implemented as pure functions in `lib/` with vitest tests.

**Tech Stack:** Next.js 14 App Router, CSS modules, Supabase (`@supabase/ssr`), vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-10-figma-reskin-v2-design.md` (read it first — frame→route map and locked decisions live there).

---

## Reference material (read before starting)

- **Figma renders** of every screen: `/tmp/fig-*.png` (e.g. `/tmp/fig-2-6.png` = Splash, `/tmp/fig-1-363.png` = chat one-shot, `/tmp/fig-1-543.png` + `/tmp/fig-1-604.png` = post view, `/tmp/fig-1-665.png` = confirmation, `/tmp/fig-1-672.png` = login, `/tmp/fig-1-720.png` = signup, `/tmp/fig-1-689.png` = upgrade, `/tmp/fig-1-208.png` = subscription, `/tmp/fig-1-315.png`/`fig-1-265.png` = profile free/pro, `/tmp/fig-1-745.png` = categories index, `/tmp/fig-1-808.png` = category list, `/tmp/fig-1-87.png` = history, `/tmp/fig-1-5.png` = home, `/tmp/fig-1-160.png` = unclassified). If missing, re-render:
  ```bash
  export FIGMA_TOKEN=$(cat /root/hackathon/.figma-token)
  curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
    "https://api.figma.com/v1/images/LLVi0rjpxodSJCimxzZWaf?ids=2:6,1:5,1:87,1:160,1:208,1:265,1:315,1:363,1:543,1:604,1:665,1:672,1:689,1:720,1:745,1:808&scale=2&format=png" \
    | jq -r '.images | to_entries[] | "\(.key) \(.value)"' \
    | while read id url; do curl -s -o "/tmp/fig-$(echo $id | tr ':' '-').png" "$url"; done
  ```
- **Do NOT use the Figma MCP server** — Starter plan quota (6 calls/month) is exhausted. REST API only.
- **Exact palette** (verified from file JSON): navy `#0e3057`, deep navy `#052d47`, steel blue `#4a7fa5`, ink `#1a1a1d`, muted `#747680`, border `#d9dee5`, bg `#f9f9f9`, nav `rgba(251,252,253,0.8)`, **coral `#e27c74`** (signup CTA, splash tagline, install-box gradient end), **red `#d4332b`** (upgrade CTA, install-box border), **question bubble `#bdc6d0`**, **insight card `#c3cbd4`**, plan-card text `#e6f6f5`. Page gradient: `#f9f9f9` → `#0e3057` (splash/upgrade hold white until ~25%).

## File structure

```
app/
  globals.css                 MODIFY  add coral/red/bubble/insight tokens
  layout.tsx                  MODIFY  mount <Splash />
  page.tsx                    MODIFY  greeting name, "Knowledge" heading
  home.module.css             MODIFY  (only if needed for greeting)
  InstallPrompt.tsx           MODIFY  K-mark + Figma copy
  InstallPrompt.module.css    MODIFY  white→coral gradient card, red border
  login/page.tsx + .css       MODIFY  Figma login + Sign up! link
  signup/page.tsx + .css      CREATE  frontend-only signup
  profile/page.tsx + .css     CREATE  free/pro profile
  upgrade/page.tsx + .css     CREATE  Upgrade your KIRA (Stripe TODO)
  subscription/page.tsx + .css CREATE Subscription Details (Stripe TODO)
  chat/page.tsx + chat.module.css     MODIFY  Think KIRA header, bubble, 85%, gated Go Deeper
  post/[id]/page.tsx + post.module.css MODIFY  read-mode + pencil→Save pill
  share/page.tsx + share.module.css   MODIFY  Saved! confirmation + animation
  history/page.tsx            MODIFY  "Explore other Knowledge" label
  categories/page.tsx + .css  MODIFY  overlap fix + Unclassified row
  category/[name]/page.tsx    MODIFY  back-chevron header, Unclassified support, label
components/
  Splash.tsx + Splash.module.css      CREATE
  TopBar.tsx + TopBar.module.css      MODIFY  K-mark, avatar→/profile, badge removed
  BottomNav.tsx                       MODIFY  Categories→Knowledge label/icon
  icons/Icons.tsx                     MODIFY  add KiraMark, KnowledgeIcon (SVG from Figma)
lib/
  name.ts + name.test.ts              CREATE  firstNameFrom()
  splash.ts + splash.test.ts          CREATE  shouldShowSplash()
  authPaths.ts                        MODIFY  add /signup
  authPaths.test.ts                   CREATE
  goDeeper.ts + goDeeper.test.ts      CREATE  plan→button behavior
  categoryFilter.ts + categoryFilter.test.ts  MODIFY  add filterUnclassified()
  useUser.ts                          CREATE  email + full name hook
```

**Branch:** `figma-reskin-v2` off `main`. Commit after every task.

```bash
cd /root/hackathon/kira-pwa && git checkout -b figma-reskin-v2
```

---

### Task 1: Design tokens + icon SVG assets

**Files:**
- Modify: `app/globals.css`
- Modify: `components/icons/Icons.tsx`

- [ ] **Step 1: Add new tokens to `app/globals.css`** — extend the existing `:root` block (keep all current vars):

```css
:root {
  /* …existing vars unchanged… */
  --coral: #e27c74;
  --red: #d4332b;
  --bubble: #bdc6d0;
  --insight-bg: #c3cbd4;
  --plan-card-text: #e6f6f5;
}
```

- [ ] **Step 2: Export the Figma K-mark and Knowledge icon as SVGs.** The K-mark is the vector inside Home's "Frame 11" (node `1:9`, 38×37); the Knowledge (tree) icon is inside bottom-nav "Frame 28" (node `1:83`); also export the big splash mark (vector inside `2:6` — find via `1:919` Group if needed):

```bash
export FIGMA_TOKEN=$(cat /root/hackathon/.figma-token)
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/images/LLVi0rjpxodSJCimxzZWaf?ids=1:9,1:83,1:75,1:79&format=svg" \
  | jq -r '.images | to_entries[] | "\(.key) \(.value)"' \
  | while read id url; do curl -s -o "/tmp/icon-$(echo $id | tr ':' '-').svg" "$url"; done
ls -la /tmp/icon-*.svg && head -c 400 /tmp/icon-1-9.svg
```
Expected: 4 SVG files with real path data. Visually sanity-check each (open or read the path count).

- [ ] **Step 3: Add `KiraMark` and `KnowledgeIcon` to `components/icons/Icons.tsx`** — inline the downloaded path data as React components, following the existing icon component pattern in that file. `KiraMark` must accept a `size` prop and render the navy rounded square (`fill: #052d47`, `rx≈10`) with the light K-arrow paths (`#f9f9f9`) exactly as exported. `KnowledgeIcon` replaces `CategoriesIcon`'s art but keep `CategoriesIcon` exported as an alias to avoid breaking imports:

```tsx
export function KiraMark({ size = 38 }: IconProps) {
  return (
    <svg width={size} height={size * (37 / 38)} viewBox="0 0 38 37" fill="none">
      <rect width="38" height="37" rx="10" fill="#052D47" />
      {/* paths pasted verbatim from /tmp/icon-1-9.svg */}
    </svg>
  );
}

export function KnowledgeIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* paths pasted verbatim from /tmp/icon-1-83.svg, fill currentColor */}
    </svg>
  );
}
```
Replace hard-coded fills inside the knowledge icon paths with `currentColor` so the active/inactive nav states tint it.

- [ ] **Step 4: Build check** — `npm run build`. Expected: compiles clean.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: new design tokens + Figma K-mark and Knowledge icons"`

### Task 2: TopBar — K-mark + avatar → /profile

**Files:**
- Modify: `components/TopBar.tsx`
- Modify: `components/TopBar.module.css`

- [ ] **Step 1: Rewrite `TopBar.tsx`.** The avatar now navigates to `/profile` (sign-out moves to the profile page in Task 8); the FREE/PRO badge is removed (Figma top bar = logo + avatar only; plan state shows on the profile page):

```tsx
"use client";
import { useRouter } from "next/navigation";
import styles from "./TopBar.module.css";
import { KiraMark, ProfileIcon } from "./icons/Icons";

export default function TopBar() {
  const router = useRouter();
  return (
    <div className={styles.bar}>
      <KiraMark size={38} />
      <button
        type="button"
        className={styles.profile}
        onClick={() => router.push("/profile")}
        aria-label="Profile"
      >
        <ProfileIcon size={38} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update `TopBar.module.css`** — delete the now-unused `.logo`, `.account`, `.badge`, `.pro` rules; keep `.bar` (flex, space-between) and `.profile` (steel-blue `#4a7fa5` rounded square per Figma — `background: var(--accent); border-radius: 10px; width: 38px; height: 37px; border: none; display: grid; place-items: center; cursor: pointer;`).
- [ ] **Step 3: Build + grep for stale imports** — `npm run build && grep -rn "usePlan" components/TopBar.tsx` (expected: no usePlan import remains).
- [ ] **Step 4: Commit** — `git commit -am "feat: TopBar K-mark + avatar navigates to /profile"`

### Task 3: BottomNav — Categories → Knowledge

**Files:**
- Modify: `components/BottomNav.tsx`

- [ ] **Step 1: Edit the TABS array** — keep tab key + route (`/categories`) so `active` props elsewhere keep working; change only label + icon:

```tsx
import { KnowledgeIcon, HistoryIcon, HomeIcon } from "./icons/Icons";
// …
  { tab: "categories" as Tab, href: "/categories", label: "Knowledge", Icon: KnowledgeIcon },
```

- [ ] **Step 2: Verify no other "Categories" labels remain in the nav** — `grep -rn "Categories" components/BottomNav.tsx` → only the type/tab key (lowercase `categories`) should remain.
- [ ] **Step 3: Build, commit** — `npm run build && git commit -am "feat: bottom nav Categories -> Knowledge"`

### Task 4: Splash screen (pure logic TDD + overlay)

**Files:**
- Create: `lib/splash.ts`, `lib/splash.test.ts`
- Create: `components/Splash.tsx`, `components/Splash.module.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write the failing test** `lib/splash.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { shouldShowSplash } from "./splash";

describe("shouldShowSplash", () => {
  it("shows on first visit to a normal page", () => {
    expect(shouldShowSplash("/", null)).toBe(true);
    expect(shouldShowSplash("/login", null)).toBe(true);
  });
  it("never shows on the share target (must not delay ingest)", () => {
    expect(shouldShowSplash("/share", null)).toBe(false);
    expect(shouldShowSplash("/share?url=x", null)).toBe(false);
  });
  it("shows only once per session", () => {
    expect(shouldShowSplash("/", "1")).toBe(false);
  });
});
```

- [ ] **Step 2: Run it** — `npm test -- splash`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement `lib/splash.ts`:**

```ts
// Pure: decide splash visibility from path + the sessionStorage flag value.
export function shouldShowSplash(path: string, shownFlag: string | null): boolean {
  if (shownFlag !== null) return false;
  return !path.startsWith("/share");
}
```

- [ ] **Step 4: Run tests** — `npm test -- splash`. Expected: PASS.
- [ ] **Step 5: Create `components/Splash.tsx`** — client overlay, sessionStorage-once, bottom-to-top rise, auto-dismiss ~1.6s + fade:

```tsx
"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./Splash.module.css";
import { KiraMark } from "./icons/Icons";
import { shouldShowSplash } from "../lib/splash";

const FLAG = "kira-splash-shown";

export default function Splash() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"hidden" | "showing" | "leaving">("hidden");

  useEffect(() => {
    let flag: string | null = null;
    try {
      flag = sessionStorage.getItem(FLAG);
    } catch {
      flag = "1"; // storage unavailable -> never block the app
    }
    if (!shouldShowSplash(pathname ?? "/", flag)) return;
    try {
      sessionStorage.setItem(FLAG, "1");
    } catch {}
    setPhase("showing");
    const leave = setTimeout(() => setPhase("leaving"), 1600);
    const gone = setTimeout(() => setPhase("hidden"), 2100);
    return () => {
      clearTimeout(leave);
      clearTimeout(gone);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "hidden") return null;
  return (
    <div className={phase === "leaving" ? `${styles.splash} ${styles.leaving}` : styles.splash} aria-hidden>
      <div className={styles.content}>
        <h1 className={styles.title}>Welcome to KIRA!</h1>
        <div className={styles.mark}>
          <KiraMark size={170} />
        </div>
        <p className={styles.tagline}>Find what&rsquo;s forgotten?</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create `components/Splash.module.css`** — gradient holds white to ~25% per Figma node `2:6`; content rises from bottom:

```css
.splash {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: linear-gradient(180deg, #f9f9f9 25%, #0e3057 100%);
  display: grid;
  place-items: center;
  opacity: 1;
  transition: opacity 0.5s ease;
}
.leaving { opacity: 0; pointer-events: none; }
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  animation: rise 0.9s ease-out both;
}
@keyframes rise {
  from { transform: translateY(40vh); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.title { color: var(--navy); font-size: 24px; font-weight: 700; margin: 0; }
.mark { /* big centered K */ }
.tagline { color: var(--coral); font-size: 18px; font-weight: 500; margin: 0; }
```
Note: Figma splash shows the K-mark glyph alone (no rounded square) at large size — if `KiraMark`'s rect looks wrong at 170px vs `/tmp/fig-2-6.png`, add a `plain` prop to `KiraMark` that skips the `<rect>` and renders the navy paths (`fill #052d47`).

- [ ] **Step 7: Mount in `app/layout.tsx`** — add `<Splash />` as the first child of `<body>`:

```tsx
import Splash from "../components/Splash";
// inside <body> before {children}:
<Splash />
```

- [ ] **Step 8: Verify in dev** — `npm run dev` (port may fall back to 3002), open `/` → splash rises then fades; reload in same tab → no splash. Open `/share` in a fresh tab → no splash.
- [ ] **Step 9: Commit** — `git add -A && git commit -m "feat: animated splash screen (session-once, skips /share)"`

### Task 5: `useUser` hook + greeting name (TDD on the pure part)

**Files:**
- Create: `lib/name.ts`, `lib/name.test.ts`, `lib/useUser.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Failing test** `lib/name.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { firstNameFrom } from "./name";

describe("firstNameFrom", () => {
  it("uses the first word of full_name", () => {
    expect(firstNameFrom("Ada Lovelace", "ada@x.com")).toBe("Ada");
  });
  it("falls back to the email local part, capitalized", () => {
    expect(firstNameFrom(undefined, "free@kira.demo")).toBe("Free");
  });
  it("falls back to null with no data", () => {
    expect(firstNameFrom(undefined, undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run** — `npm test -- name`. Expected: FAIL.
- [ ] **Step 3: Implement `lib/name.ts`:**

```ts
// Pure: best-effort first name from Supabase user metadata / email.
export function firstNameFrom(
  fullName: string | undefined,
  email: string | undefined
): string | null {
  const fromName = fullName?.trim().split(/\s+/)[0];
  if (fromName) return fromName;
  const local = email?.split("@")[0];
  if (!local) return null;
  return local.charAt(0).toUpperCase() + local.slice(1);
}
```

- [ ] **Step 4: Run** — `npm test -- name`. Expected: PASS.
- [ ] **Step 5: Create `lib/useUser.ts`** (same shape/conventions as `lib/usePlan.ts`):

```ts
"use client";
import { useEffect, useState } from "react";
import { createClient } from "./supabase/client";

export type UserInfo = {
  email: string | undefined;
  fullName: string | undefined;
  loading: boolean;
};

// Display-only user reader (greeting + profile page). Gating stays server-side.
export function useUser(): UserInfo {
  const [info, setInfo] = useState<UserInfo>({
    email: undefined,
    fullName: undefined,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const {
          data: { user },
        } = await createClient().auth.getUser();
        if (!active) return;
        setInfo({
          email: user?.email,
          fullName:
            (user?.user_metadata?.full_name as string | undefined) ??
            (user?.user_metadata?.name as string | undefined),
          loading: false,
        });
      } catch {
        if (active) setInfo({ email: undefined, fullName: undefined, loading: false });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return info;
}
```

- [ ] **Step 6: Use it on Home** (`app/page.tsx`) — replace the static greeting and rename the pills heading (Figma home heading is "Knowledge"):

```tsx
import { useUser } from "../lib/useUser";
import { firstNameFrom } from "../lib/name";
// inside Library():
const { email, fullName } = useUser();
const first = firstNameFrom(fullName, email);
// JSX:
<p className={styles.greeting}>{first ? `Hi ${first}!` : "Hi there!"}</p>
// and:
<h2 className={shared.sectionTitle}>Knowledge</h2>
```

- [ ] **Step 7: Build + dev check** — greeting shows "Hi Free!" when signed in as free@kira.demo.
- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat: greeting with first name + Knowledge heading on home"`

### Task 6: Login re-skin + signup link; `/signup` goes public

**Files:**
- Modify: `app/login/page.tsx`, `app/login/login.module.css`
- Modify: `lib/authPaths.ts`
- Create: `lib/authPaths.test.ts`

- [ ] **Step 1: Failing test** `lib/authPaths.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isPublicPath } from "./authPaths";

describe("isPublicPath", () => {
  it("login and signup are public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/signup")).toBe(true);
  });
  it("everything else is gated", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/profile")).toBe(false);
  });
});
```

- [ ] **Step 2: Run** — `npm test -- authPaths`. Expected: FAIL on `/signup`.
- [ ] **Step 3: Fix `lib/authPaths.ts`:** `const PUBLIC_PREFIXES = ["/login", "/signup"];`
- [ ] **Step 4: Run** — `npm test -- authPaths`. Expected: PASS.
- [ ] **Step 5: Re-skin `app/login/page.tsx`** per `/tmp/fig-1-672.png` — keep the working Supabase submit handler EXACTLY as-is; change only the JSX/labels:

```tsx
return (
  <main className={styles.wrap}>
    <h1 className={styles.title}>Welcome back!</h1>
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.label}>Username</label>
      <input
        className={styles.input}
        type="email"
        placeholder="Email ID"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <label className={styles.label}>Password</label>
      <input
        className={styles.input}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.button} type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Log In"}
      </button>
    </form>
    <div className={styles.footer}>
      <p className={styles.footerLead}>Ready to find what&rsquo;s forgotten?</p>
      <a className={styles.footerLink} href="/signup">Sign up!</a>
    </div>
  </main>
);
```

- [ ] **Step 6: Restyle `login.module.css`** to match the render: centered column, `.title` navy 24px/700 centered; `.label` navy 14px/500 self-start; `.input` white card (`background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 12px 15px;`); `.button` steel blue (`background: var(--accent); color: #fff; border-radius: 10px; padding: 12px; border: none; width: 100%;`); `.footer` pinned low (`margin-top: auto; text-align: center; padding-bottom: 48px;`), `.footerLead` light (`color: #f9f9f9`), `.footerLink` bold white 22px. `.wrap` must be `min-height: 100vh; display: flex; flex-direction: column;` with the page gradient showing through (no background override).
- [ ] **Step 7: Verify** — dev: `/login` matches render; login as free@kira.demo (pw `kira-demo-2026`) still works; "Sign up!" navigates to `/signup` (404 until Task 7 — fine).
- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat: login re-skin + public /signup path"`

### Task 7: Sign Up page (frontend-only)

**Files:**
- Create: `app/signup/page.tsx`, `app/signup/signup.module.css`

- [ ] **Step 1: Create `app/signup/page.tsx`** per `/tmp/fig-1-720.png`. Client-side validation only; success → `/login`. No Supabase call:

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    // Frontend-only for the demo: no account is created yet.
    setDone(true);
    setTimeout(() => router.push("/login"), 1400);
  }

  return (
    <main className={styles.wrap}>
      <button className={styles.back} onClick={() => router.push("/login")} aria-label="Back to log in">
        ‹
      </button>
      <h1 className={styles.title}>Welcome to KIRA!</h1>
      {done ? (
        <p className={styles.success}>Account created — taking you to log in…</p>
      ) : (
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.label}>Name</label>
          <input className={styles.input} placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <label className={styles.label}>Username</label>
          <input className={styles.input} type="email" placeholder="Email ID" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <label className={styles.label}>Password</label>
          <input className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <label className={styles.label}>Confirm Password</label>
          <input className={styles.input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit">Sign Up</button>
          <p className={styles.fine}>All your data is confidential.</p>
        </form>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Create `signup.module.css`** — same input/label/wrap styles as login (copy the blocks; the two pages are visually siblings) with `.button { background: var(--coral); }`, `.fine { color: #f9f9f9; font-size: 11px; text-align: center; }`, `.back { background: none; border: none; color: var(--navy); font-size: 28px; align-self: flex-start; cursor: pointer; }`.
- [ ] **Step 3: Verify** — dev, signed-out: `/signup` reachable without auth (middleware allows it after Task 6); mismatch passwords → inline error; valid submit → success → lands on `/login`; back chevron → `/login`. Compare to `/tmp/fig-1-720.png`.
- [ ] **Step 4: Build + commit** — `npm run build && git add -A && git commit -m "feat: frontend-only signup page"`

### Task 8: Profile page (free/pro)

**Files:**
- Create: `app/profile/page.tsx`, `app/profile/profile.module.css`

- [ ] **Step 1: Create `app/profile/page.tsx`** per `/tmp/fig-1-315.png` (free) / `/tmp/fig-1-265.png` (pro). Sign-out logic moves here from the old TopBar (same `createClient().auth.signOut()` pattern):

```tsx
"use client";
import { useRouter } from "next/navigation";
import BottomNav from "../../components/BottomNav";
import { usePlan } from "../../lib/usePlan";
import { useUser } from "../../lib/useUser";
import { createClient } from "../../lib/supabase/client";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { plan, loading } = usePlan();
  const { email, fullName } = useUser();

  async function logOut() {
    try {
      await createClient().auth.signOut();
    } catch {
      // session may already be gone — head to /login regardless
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <main className={styles.wrap}>
      <button className={styles.close} onClick={() => router.back()} aria-label="Close">✕</button>
      <div className={styles.avatar} />
      <h1 className={styles.name}>{fullName ?? email ?? "Your account"}</h1>

      <section className={styles.card}>
        <div className={styles.cardHead}>Contact Details</div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Email ID</span>
          <span className={styles.rowValue}>{email ?? "—"}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}></span>
          <span className={styles.rowHint}>Reset Password</span>
        </div>
        {plan === "pro" ? (
          <button className={styles.row} onClick={() => router.push("/subscription")}>
            <span className={styles.rowLabel}>Status</span>
            <span className={styles.rowValue}>Pro User ›</span>
          </button>
        ) : (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Status</span>
            <span className={styles.rowValue}>Free User</span>
          </div>
        )}
      </section>

      {!loading && plan === "free" && (
        <button className={styles.primary} onClick={() => router.push("/upgrade")}>
          Upgrade
        </button>
      )}
      {!loading && plan === "pro" && (
        <button className={styles.primary} onClick={() => router.push("/")}>
          Return to Home Page
        </button>
      )}
      <button className={styles.logout} onClick={logOut}>Log Out</button>
      <BottomNav />
    </main>
  );
}
```

- [ ] **Step 2: Create `profile.module.css`** per renders: `.close` coral square top-right (`background: var(--coral); color: #fff; border-radius: 10px; width: 38px; height: 37px; border: none; margin-left: auto;`); `.avatar` 120px navy circle centered (`background: var(--navy-deep); border-radius: 50%;`); `.name` centered navy 20px/700; `.card` white rounded card with rows (label muted left, value right, `border-top: 1px solid var(--border)` between rows); `.primary` white pill button (`background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 12px; width: 100%; color: var(--navy); font-weight: 600;`) sitting low (`margin-top: auto`); `.logout` text-only light (`color: #f9f9f9; background: none; border: none; text-align: center; padding-bottom: 90px;` — leaves room above BottomNav). `.wrap`: `min-height: 100vh; display: flex; flex-direction: column; padding: 23px 21px;`.
- [ ] **Step 3: Verify** — dev: avatar in TopBar (any page) → `/profile`. As free@: status "Free User", Upgrade → `/upgrade` (404 until Task 9). As pro@: "Pro User ›" row → `/subscription`, "Return to Home Page" → `/`. Log Out → `/login`.
- [ ] **Step 4: Build + commit** — `git add -A && git commit -m "feat: profile page with plan-aware actions"`

### Task 9: Upgrade page (Stripe stub)

**Files:**
- Create: `app/upgrade/page.tsx`, `app/upgrade/upgrade.module.css`

- [ ] **Step 1: Create `app/upgrade/page.tsx`** per `/tmp/fig-1-689.png`:

```tsx
"use client";
import { useRouter } from "next/navigation";
import styles from "./upgrade.module.css";

const FEATURES: Array<[string, string]> = [
  ["Enhancement", "Find more suggestions similar to your saves"],
  ["Verification", "Validate content shared by creators online"],
  ["Brief BuilderAuto", "Generates a structured brief from all saves on a topic"],
  ["Knowledge Gaps", "Shows what you haven't saved, the blind spots in your topics"],
  ["Trend Alerts", "Notifies you when a topic in your KB is spiking online (via Exa)"],
  ["Stale Content Flag", "Marks saves that are outdated based on newer web info"],
];

export default function UpgradePage() {
  const router = useRouter();

  function startCheckout() {
    // TODO: Stripe Checkout — create a Checkout Session server-side and redirect.
    // Wire here when Stripe is integrated; until then this is a visual stub.
  }

  return (
    <main className={styles.wrap}>
      <button className={styles.back} onClick={() => router.back()} aria-label="Back">‹</button>
      <h1 className={styles.title}>Upgrade your KIRA</h1>
      <h2 className={styles.subtitle}>Want more from what you save?</h2>
      <p className={styles.lead}>
        Upgrade your KIRA to get advanced search and unlock all our features!
      </p>
      <ul className={styles.list}>
        {FEATURES.map(([k, v]) => (
          <li key={k} className={styles.item}>
            <span className={styles.check}>✓</span>
            <span><strong>{k}</strong> - {v}</span>
          </li>
        ))}
      </ul>
      <button className={styles.cta} onClick={startCheckout}>Sign Up</button>
    </main>
  );
}
```

- [ ] **Step 2: Create `upgrade.module.css`** — `.title` deep-navy 32px/700; `.subtitle` navy 18px/600; `.lead` ink 14px; `.item` flex row, `gap: 10px`, ink 14px, `.check` navy bold; `.cta` red (`background: var(--red); color: #fff; border-radius: 10px; padding: 14px; width: 100%; border: none; font-weight: 600; margin-top: auto; margin-bottom: 48px;`). `.wrap` as profile's. Gradient holds white to ~25% here per Figma — acceptable to leave the global body gradient as-is (visual check decides; do NOT add a per-page background that hides cards elsewhere).
- [ ] **Step 3: Verify against `/tmp/fig-1-689.png`**, build, commit — `git add -A && git commit -m "feat: upgrade page with Stripe checkout stub"`

### Task 10: Subscription Details page (Stripe stub)

**Files:**
- Create: `app/subscription/page.tsx`, `app/subscription/subscription.module.css`

- [ ] **Step 1: Create `app/subscription/page.tsx`** per `/tmp/fig-1-208.png`. Static demo values until Stripe:

```tsx
"use client";
import { useRouter } from "next/navigation";
import TopBar from "../../components/TopBar";
import BottomNav from "../../components/BottomNav";
import styles from "./subscription.module.css";

const DETAILS: Array<[string, string]> = [
  ["Plan", "Monthly plan"],
  ["Start Date", "21 June 2025"],
  ["Next Renewal", "20 July 2026"],
  ["Amount Paid", "$2"],
];

export default function SubscriptionPage() {
  const router = useRouter();

  function cancelSubscription() {
    // TODO: Stripe customer portal — redirect to the billing portal session.
  }

  return (
    <main className={styles.wrap}>
      <TopBar />
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.back()} aria-label="Back">‹</button>
        <h1 className={styles.title}>Subscription Details</h1>
      </header>

      <section className={styles.planCard}>
        <div>
          <div className={styles.planName}>Your plan</div>
          <div className={styles.planSub}>Monthly payment</div>
        </div>
        <div className={styles.planPrice}>$2</div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHead}>Subscription Details</div>
        {DETAILS.map(([k, v]) => (
          <div key={k} className={styles.row}>
            <span className={styles.rowLabel}>{k}</span>
            <span className={styles.rowValue}>{v}</span>
          </div>
        ))}
      </section>

      <p className={styles.disclaimer}>Disclaimer: All plans can be cancelled at any time.</p>
      <button className={styles.primary} onClick={() => router.push("/")}>Return Home</button>
      <button className={styles.cancel} onClick={cancelSubscription}>Cancel Subscription</button>
      <BottomNav />
    </main>
  );
}
```

- [ ] **Step 2: Create `subscription.module.css`** — `.planCard` steel blue (`background: var(--accent); border-radius: 10px; color: #fff; display: flex; justify-content: space-between; align-items: center; padding: 16px;`), `.planSub { color: var(--plan-card-text); font-size: 12px; }`, `.planPrice` 24px/700; `.card` white card with bordered rows like profile's; `.disclaimer` light small centered (`color: #f9f9f9; font-size: 12px;`) low on the gradient; `.primary` white pill (as profile); `.cancel` text-only light, `padding-bottom: 90px`.
- [ ] **Step 3: Verify vs `/tmp/fig-1-208.png`**, build, commit — `git add -A && git commit -m "feat: subscription details page with Stripe portal stub"`

### Task 11: Go Deeper plan gating (TDD) + chat re-skin

**Files:**
- Create: `lib/goDeeper.ts`, `lib/goDeeper.test.ts`
- Modify: `app/chat/page.tsx`, `app/chat/chat.module.css`

- [ ] **Step 1: Failing test** `lib/goDeeper.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { goDeeperButton } from "./goDeeper";

describe("goDeeperButton", () => {
  it("pro users run the web search", () => {
    expect(goDeeperButton("pro")).toEqual({ label: "Go Deeper", action: "deepen" });
  });
  it("free users are sent to upgrade", () => {
    expect(goDeeperButton("free")).toEqual({
      label: "Go Deeper • Get it with PRO",
      action: "upgrade",
    });
  });
});
```

- [ ] **Step 2: Run** — `npm test -- goDeeper`. Expected: FAIL.
- [ ] **Step 3: Implement `lib/goDeeper.ts`:**

```ts
import type { Plan } from "./auth";

export type GoDeeperButton = { label: string; action: "deepen" | "upgrade" };

// Pure: what the Go Deeper button says/does for a plan (Figma: free sees the PRO upsell).
export function goDeeperButton(plan: Plan): GoDeeperButton {
  return plan === "pro"
    ? { label: "Go Deeper", action: "deepen" }
    : { label: "Go Deeper • Get it with PRO", action: "upgrade" };
}
```

- [ ] **Step 4: Run** — `npm test -- goDeeper`. Expected: PASS.
- [ ] **Step 5: Wire into `app/chat/page.tsx`** — add imports + plan, replace the header block and the deepen button; everything else (ask/submit/goDeeper/history logic) unchanged:

```tsx
import { usePlan } from "../../lib/usePlan";
import { goDeeperButton } from "../../lib/goDeeper";
// in ChatInner():
const { plan } = usePlan();
const deeperBtn = goDeeperButton(plan);
// header JSX (title default stays "Ask KIRA" for theme-scoped flows; the base header copy changes):
<header className={styles.header}>
  <button className={styles.back} onClick={() => router.push("/")} aria-label="Back">‹</button>
  <h1 className={styles.title}>{title === "Ask KIRA" ? "Think KIRA" : title}</h1>
  <span className={styles.tagline}>Your knowledge, on demand.</span>
  <button className={styles.history} onClick={() => router.push("/history")}>History</button>
</header>
// deepen button JSX:
<button
  className={styles.deepen}
  onClick={deeperBtn.action === "deepen" ? goDeeper : () => router.push("/upgrade")}
  disabled={deepen.status === "loading"}
>
  {deeperBtn.label}
</button>
```

- [ ] **Step 6: Restyle `chat.module.css`** to `/tmp/fig-1-363.png`:
  - `.question` (user bubble): `background: var(--bubble); color: var(--ink); border-radius: 10px; padding: 12px 16px; margin-left: auto; max-width: 80%; width: fit-content;` (right-aligned).
  - Answer area: wrap `AnswerWithCitations` output in a white card — add `.answerCard { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; max-width: 85%; }` and apply it around `<AnswerWithCitations …/>` in the JSX (**point 5: never wider than 85%, anchored left** — no `margin-left: auto`).
  - `.sources`: white card (`background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px;`) with heading "Sources" — change the JSX label from `SOURCES` to `Sources` and style `.recentLabel` inside sources as navy 16px/600 (or add a `.sourcesLabel`).
  - `.chip` ("More on …" pills): `background: var(--card); border: 1px solid var(--accent); color: var(--accent); border-radius: 25px; padding: 6px 16px;`.
  - `.deepen`: `background: var(--accent); color: #fff; border-radius: 10px; padding: 14px; width: 100%; border: none; font-weight: 600;` (italic the "Get it with PRO" part is optional — skip; single label string is fine).
  - `.tagline`: muted 12px.
  - Keep `.askBar` fixed bottom but restyle inputs to the white-card style.
- [ ] **Step 7: Verify in dev** — as pro@: ask a question (needs orchestrator+tunnel up — see RESUME CHECKLIST in `~/.claude/.../kira-iteration3.md` memory; if backend is down, verify layout with the error state and a history record), bubble right, answer card ≤85%, Go Deeper runs Exa. As free@: button reads "Go Deeper • Get it with PRO" and navigates to `/upgrade`.
- [ ] **Step 8: Build + commit** — `git add -A && git commit -m "feat: Think KIRA chat re-skin + plan-gated Go Deeper"`

### Task 12: Saved post view — read-mode + pencil→Save pill

**Files:**
- Modify: `app/post/[id]/page.tsx`, `app/post/[id]/post.module.css`

- [ ] **Step 1: Add an `editing` mode to `app/post/[id]/page.tsx`.** Keep ALL existing state/logic (`edit`, `save()`, `postEdit` helpers, category fetch). Add `const [editing, setEditing] = useState(false);` and restructure the JSX per `/tmp/fig-1-543.png` (read) / `/tmp/fig-1-604.png` (editing):

```tsx
<main className={styles.wrap}>
  <header className={styles.header}>
    <button className={styles.linkBtn} onClick={() => router.back()} aria-label="Back">‹</button>
    <a className={styles.source} href={item.source_url} target="_blank" rel="noreferrer">Source ↗</a>
  </header>
  <h1 className={styles.title}>{item.title}</h1>

  <section className={styles.card}>
    <div className={styles.cardHead}>
      <span>Summary</span>
      {editing ? (
        <button className={styles.savePill} onClick={async () => { await save(); setEditing(false); }} disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save"}
        </button>
      ) : (
        <button className={styles.pencil} onClick={() => setEditing(true)} aria-label="Edit">✎</button>
      )}
    </div>
    {editing ? (
      <textarea className={styles.textarea} value={edit.summary} onChange={(e) => setEdit(setSummary(edit, e.target.value))} />
    ) : (
      <p className={styles.summaryText}>{edit.summary}</p>
    )}
  </section>

  <div className={styles.metaChip}>
    {[category, "Instagram", item.author].filter(Boolean).join(" • ")}
  </div>

  <section className={styles.card}>
    <div className={styles.cardHead}><span>Key Insights</span></div>
    {editing ? (
      <>
        {edit.key_insights.map((ins, i) => (
          <div key={i} className={styles.row}>
            <input className={styles.input} value={ins} onChange={(e) => setEdit(setInsight(edit, i, e.target.value))} />
            <button className={styles.remove} onClick={() => setEdit(removeInsight(edit, i))}>✕</button>
          </div>
        ))}
        <button className={styles.add} onClick={() => setEdit(addInsight(edit))}>+ Add insight</button>
      </>
    ) : (
      edit.key_insights.map((ins, i) => (
        <div key={i} className={styles.insight}>{ins}</div>
      ))
    )}
  </section>

  {editing && (
    <>
      <label className={styles.label}>Tags</label>
      {/* existing tag editor JSX unchanged */}
    </>
  )}
  {status === "error" && (
    <span className={styles.err}>Couldn&rsquo;t save — your edits are kept, try again.</span>
  )}
  <BottomNav />
</main>
```
Category chip: replace the old standalone `categoryChip` button with the joined `metaChip` line above (it still navigates if you keep it as a button → `/category/{category}`; keep navigation when `category` exists).

- [ ] **Step 2: Restyle `post.module.css`** — `.card` white rounded card; `.cardHead` flex space-between, ink 15px/600; `.pencil` borderless navy; `.savePill { background: var(--red); color: #fff; border-radius: 25px; padding: 4px 18px; border: none; font-size: 13px; }`; `.summaryText` ink 14px, `white-space: pre-wrap`; `.insight { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; font-size: 13px; }` (cards-within-card per render, on the `--insight-bg`-tinted section: set the Key Insights `.card` background to `var(--insight-bg)`); `.metaChip { background: var(--bubble); border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px; font-size: 13px; width: fit-content; }`.
- [ ] **Step 3: Verify persistence end-to-end** (orchestrator must be running) — open a post, pencil → edit summary text, Save → pill disappears back to pencil; reload the page → edited text still there (it round-trips through `PATCH /api/items/{id}` → orchestrator `items.json`). If the orchestrator is down, verify the error banner appears and edits stay in the form.
- [ ] **Step 4: Build + commit** — `git add -A && git commit -m "feat: post view read-mode with pencil edit and Save pill (persisted)"`

### Task 13: Share confirmation page

**Files:**
- Modify: `app/share/page.tsx`, `app/share/share.module.css`

- [ ] **Step 1: Replace the JSX in `app/share/page.tsx`** — keep ALL hooks/effects (ingest fetch, auto `window.close()` + `showReturn` fallback) exactly as they are; only the render changes per `/tmp/fig-1-665.png`:

```tsx
return (
  <main className={styles.wrap}>
    {phase === "saving" && <div className={styles.big}>Saving to KIRA…</div>}
    {phase === "saved" && (
      <div className={styles.confirm}>
        <h1 className={styles.savedTitle}>Saved!</h1>
        <div className={styles.checkCircle}>
          <svg viewBox="0 0 52 52" className={styles.checkSvg}>
            <path className={styles.checkPath} fill="none" stroke="#fff" strokeWidth="5"
              strokeLinecap="round" d="M14 27l8 8 16-18" />
          </svg>
        </div>
        <p className={styles.savedSub}>Your post has been saved to KIRA</p>
        {showReturn && <p className={styles.hint}>You can return to Instagram.</p>}
      </div>
    )}
    {(phase === "nolink" || phase === "error") && (
      <div className={styles.confirm}>
        <div className={styles.big}>
          {phase === "nolink" ? "No Instagram link found" : "Couldn't save"}
        </div>
        <a className={styles.link} href="/">Open KIRA →</a>
      </div>
    )}
  </main>
);
```

- [ ] **Step 2: Restyle `share.module.css`** with the animation (circle pops, check draws, text rises):

```css
.wrap { min-height: 100vh; display: grid; place-items: center; }
.confirm { display: flex; flex-direction: column; align-items: center; gap: 28px; animation: rise 0.5s ease-out both; }
@keyframes rise { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.savedTitle { color: var(--navy); font-size: 28px; font-weight: 700; margin: 0; }
.checkCircle {
  width: 96px; height: 96px; border-radius: 50%; background: var(--navy-deep);
  display: grid; place-items: center; animation: pop 0.35s ease-out both 0.15s;
}
@keyframes pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.checkSvg { width: 52px; height: 52px; }
.checkPath { stroke-dasharray: 48; stroke-dashoffset: 48; animation: draw 0.4s ease-out forwards 0.45s; }
@keyframes draw { to { stroke-dashoffset: 0; } }
.savedSub { color: var(--navy); font-size: 18px; font-weight: 500; text-align: center; max-width: 260px; margin: 0; }
.hint { color: var(--muted); font-size: 13px; }
.big { color: var(--navy); font-size: 22px; font-weight: 600; }
.link { color: var(--accent); }
```
Keep/move any still-referenced legacy classes; delete unreferenced ones.

- [ ] **Step 3: Verify** — dev: `http://localhost:3000/share?url=https://www.instagram.com/reel/FAKE/` (orchestrator down → error state styled). With orchestrator up: real reel URL → Saved! animation plays, auto-close attempt after ~0.9s (desktop: blocked → "You can return to Instagram." hint appears under the design).
- [ ] **Step 4: Build + commit** — `git add -A && git commit -m "feat: Saved! confirmation page with check animation"`

### Task 14: Categories index — overlap fix + Unclassified (TDD)

**Files:**
- Modify: `lib/categoryFilter.ts`; Create: `lib/categoryFilter.test.ts`
- Modify: `app/categories/page.tsx`, `app/categories/categories.module.css`
- Modify: `app/category/[name]/page.tsx`

- [ ] **Step 1: Failing test** `lib/categoryFilter.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { filterByCategory, filterUnclassified } from "./categoryFilter";

const items = [
  { source_url: "https://a" },
  { source_url: "https://b" },
  { source_url: "https://c" },
];

describe("filterUnclassified", () => {
  it("returns items not covered by any theme", () => {
    const themes = [{ source_urls: ["https://a"] }, { source_urls: ["https://b"] }];
    expect(filterUnclassified(items, themes)).toEqual([{ source_url: "https://c" }]);
  });
  it("returns all items when there are no themes", () => {
    expect(filterUnclassified(items, [])).toEqual(items);
  });
});

describe("filterByCategory (existing)", () => {
  it("keeps matching source urls", () => {
    expect(filterByCategory(items, ["https://b"])).toEqual([{ source_url: "https://b" }]);
  });
});
```

- [ ] **Step 2: Run** — `npm test -- categoryFilter`. Expected: FAIL (`filterUnclassified` missing).
- [ ] **Step 3: Implement in `lib/categoryFilter.ts`** (append; do not change `filterByCategory`):

```ts
export function filterUnclassified<T extends HasSourceUrl>(
  items: T[],
  themes: Array<{ source_urls?: string[] }>
): T[] {
  const covered = new Set(themes.flatMap((t) => t.source_urls ?? []));
  return items.filter((it) => !covered.has(it.source_url));
}
```

- [ ] **Step 4: Run** — `npm test -- categoryFilter`. Expected: PASS.
- [ ] **Step 5: Overlap fix + Unclassified row in `app/categories/page.tsx`.** Fetch `/api/library` alongside themes to compute the unclassified count; append an "Unclassified" row when count > 0:

```tsx
// extra state:
const [unclassified, setUnclassified] = useState(0);
// in the effect, fetch both:
Promise.all([
  fetch("/api/themes", { cache: "no-store" }).then((r) => r.json()),
  fetch("/api/library", { cache: "no-store" }).then((r) => r.json()),
])
  .then(([d, lib]) => {
    const th = Array.isArray(d?.themes) ? d.themes : [];
    setThemes(th);
    setReady(d?.ready !== false);
    const all = Array.isArray(lib) ? lib : [];
    setUnclassified(filterUnclassified(all, th).length);
  })
  .catch(() => setThemes([]));
// after the themes map, before </div>:
{unclassified > 0 && (
  <button
    className={`${shared.card} ${styles.row}`}
    onClick={() => router.push("/category/Unclassified")}
  >
    <div className={styles.rowText}>
      <div className={styles.rowName}>Unclassified</div>
      <div className={styles.rowWhy}>Saves KIRA hasn&rsquo;t grouped yet.</div>
    </div>
    <span className={styles.rowCount}>{unclassified}</span>
  </button>
)}
```
(The Figma "View All" header link is intentionally omitted — the index already lists everything; a dead control would be worse than a small deviation. Documented here.)

- [ ] **Step 6: Fix the overlap in `categories.module.css`** (point 3 — big counts must never collide with the tagline):

```css
.row { display: flex; align-items: center; gap: 12px; }
.rowText { flex: 1; min-width: 0; }
.rowWhy {
  max-width: 85%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.rowCount { flex-shrink: 0; color: var(--navy); font-weight: 700; }
```

- [ ] **Step 7: Unclassified support in `app/category/[name]/page.tsx`** — special-case the name before the theme lookup:

```tsx
import { filterByCategory, filterUnclassified } from "../../../lib/categoryFilter";
// inside the effect, after parsing td/all:
if (name === "Unclassified") {
  setItems(filterUnclassified(all, td?.themes ?? []));
  return;
}
```
Also change the page's section labels: heading becomes `‹ {name}` (back chevron button + name in one header row per `/tmp/fig-1-808.png`), and "Explore other categories" → "Explore other Knowledge".

- [ ] **Step 8: Verify** — dev: Knowledge tab → index rows don't overlap even with a wide count (temporarily inflate a count in devtools to eyeball); Unclassified row appears if any saves are ungrouped → opens the list.
- [ ] **Step 9: Build + commit** — `git add -A && git commit -m "feat: categories overlap fix + Unclassified category"`

### Task 15: Home install box + history label sweep

**Files:**
- Modify: `app/InstallPrompt.tsx`, `app/InstallPrompt.module.css`
- Modify: `app/history/page.tsx`

- [ ] **Step 1: Restyle the install card** per `/tmp/fig-1-5.png` (point 2 — gradient inside the box): in `InstallPrompt.tsx` swap the emoji/copy to the Figma layout — K-mark left, texts right:

```tsx
import { KiraMark } from "../components/icons/Icons";
// install-available branch:
<button className={styles.installCard} onClick={handleInstall}>
  <KiraMark size={40} />
  <span className={styles.installCol}>
    <span className={styles.installTitle}>Add KIRA to your phone!</span>
    <span className={styles.installSub}>
      In your browser → Select <strong>Add to Home Screen</strong> to enable direct sharing via your Instagram App.
    </span>
  </span>
</button>
```
Keep the standalone (`✅ installed`) branch's logic; restyle it with the same card class.

- [ ] **Step 2: `InstallPrompt.module.css`:**

```css
.installCard {
  display: flex; align-items: center; gap: 14px; width: 100%; text-align: left;
  background: linear-gradient(135deg, #ffffff 36%, var(--coral) 100%);
  border: 1.5px solid var(--red); border-radius: 10px; padding: 14px 15px; cursor: pointer;
}
.installTitle { color: var(--red); font-weight: 700; font-size: 15px; }
.installSub { color: var(--red); font-size: 11px; }
```

- [ ] **Step 3: History page label** — in `app/history/page.tsx` change `Explore other categories` → `Explore other Knowledge` (the home heading was already changed in Task 5; grep to catch stragglers):

```bash
grep -rn "other categories" app/ components/
```
Expected after edit: no hits.

- [ ] **Step 4: Build + commit** — `git add -A && git commit -m "feat: Figma install box + Knowledge label sweep"`

### Task 16: Full verification + deploy

**Files:** none (verification)

- [ ] **Step 1: Unit tests + build** — `npm test && npm run build`. Expected: all green.
- [ ] **Step 2: Backend up** (for data screens): follow the RESUME CHECKLIST in memory `kira-iteration3.md` — orchestrator on :8000 (restart with `pkill -f uvicorn`, NEVER `fuser -k 8000` — it kills the tunnel), Cloudflare tunnel, fresh AWS creds, Vercel env `ORCHESTRATOR_URL` if the tunnel URL changed.
- [ ] **Step 3: Playwright sweep against local dev** (both accounts, pw `kira-demo-2026`):
  1. Fresh session `/` → splash rises bottom-to-top, fades → home: greeting, search, suggested prompt, red install box, Knowledge pills, saved posts; gradient visible.
  2. Bottom nav shows History / Home / **Knowledge** on every tabbed page.
  3. `/login`: Welcome back! → log in free@ works; Sign up! → `/signup`; signup validation + success → back at `/login`; back chevron works signed-out.
  4. free@: avatar → profile (Free User, Upgrade) → `/upgrade` (feature list, red CTA); chat answer → "Go Deeper • Get it with PRO" → `/upgrade`.
  5. pro@: profile → "Pro User ›" → `/subscription` (plan card, rows, Return Home); chat → Go Deeper runs Exa → FROM THE WEB renders.
  6. Chat: question bubble right, answer card ≤85% width (assert via bounding box), Sources card numbered.
  7. Post: pencil → edit summary → Save pill → reload → text persisted.
  8. `/share?url=<real reel>` → Saved! animation (no splash on this route).
  9. Knowledge index: no count/tagline overlap; Unclassified row → list; category page header chevron; "Explore other Knowledge".
- [ ] **Step 4: Screenshot each screen** and eyeball against `/tmp/fig-*.png`; fix obvious mismatches.
- [ ] **Step 5: Merge + deploy** — merge `figma-reskin-v2` → `main`, deploy via the existing Vercel CLI flow to `kira-pwa-rho.vercel.app`, re-verify live (at minimum: splash, login, home, chat free-gating, profile), push to GitHub.
- [ ] **Step 6: Final commit/tag** — ensure clean tree; update `docs/UI_SCREENS.md` if it references renamed labels.

---

## Self-review notes

- Spec coverage: gradient everywhere (tokens exist; tasks avoid per-page background overrides) ✓; Add-KIRA box w/ gradient (T15) ✓; tagline/count overlap (T14) ✓; category list per Figma (T14) ✓; 85% answers (T11) ✓; one-shot + Sources + Go Deeper (T11) ✓; multi-shot deferred ✓; post save feature + logo (T12, T1/T2) ✓; confirmation + animation (T13) ✓; login/register frontend (T6/T7) ✓; Upgrade page (T9) ✓; two Stripe pages (T9/T10) ✓; access rules free/pro (T8/T11) ✓; Knowledge rename (T3/T5/T14/T15) ✓; animated splash (T4) ✓.
- Deviation (documented): Figma "View All" on the index is omitted as a dead control; Unclassified row added instead.
- Type consistency: `goDeeperButton` returns `{label, action}` used in T11; `filterUnclassified` signature matches T14 usage; `useUser` returns `{email, fullName, loading}` used in T5/T8.
