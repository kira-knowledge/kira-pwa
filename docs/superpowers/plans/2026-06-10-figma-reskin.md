# KIRA PWA Figma Re-skin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin Home, History, Categories, and Category-list screens to Angelina's Figma hi-fi design (light navy theme), plus a colors-only pass on chat/share/post — zero logic changes.

**Architecture:** Approach A from the approved spec (`docs/superpowers/specs/2026-06-10-figma-reskin-design.md`): a global CSS-token layer + DM Sans, new shared presentational components (TopBar, SearchBox, CategoryPills), the shared `app/page.module.css` split into per-screen modules, then each screen's JSX rebuilt presentation-only. All data fetching, routing, share-target, and chat logic stay byte-identical.

**Tech Stack:** Next.js 14 App Router, plain CSS Modules (no Tailwind), `next/font/google`, TypeScript.

**Branch:** `figma-reskin` (already created; spec and Figma SVG icons already committed — see `components/icons/*.svg`).

**Verification model:** This repo has no unit-test infra; per the approved spec §8, every task is verified with `npm run build` (must be green) plus a rendered-page check, and the full flow walk happens in Task 10. Dev server: `npm run dev` (port 3000). Note: without the orchestrator backend running, `/api/themes` and `/api/library` return errors — screens then show their error/empty states, which is sufficient for layout verification.

**Design tokens (single source of truth, from Figma frames 33:2638/2721/2859/2930):**

| Token | Value |
|---|---|
| background gradient | `linear-gradient(180deg, #f9f9f9 45%, #0e3057 100%)` |
| ink (body text) | `#1a1a1d` |
| muted | `#747680` |
| navy (headings) | `#0e3057` |
| navy-deep (logo) | `#052d47` |
| accent (links, dates, navy search bar) | `#4a7fa5` |
| border | `#d9dee5` |
| card | `#ffffff` |
| pill | `#fefdfc` |
| nav bar | `rgba(251,252,253,0.8)` + `backdrop-filter: blur(7px)` |
| card radius 10px, pill radius 25px | |

---

### Task 1: Global tokens, gradient background, DM Sans

**Files:**
- Create: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `app/globals.css`**

```css
:root {
  --ink: #1a1a1d;
  --muted: #747680;
  --navy: #0e3057;
  --navy-deep: #052d47;
  --accent: #4a7fa5;
  --border: #d9dee5;
  --card: #ffffff;
  --pill: #fefdfc;
  --nav-bg: rgba(251, 252, 253, 0.8);
  --radius-card: 10px;
  --radius-pill: 25px;
}

html,
body {
  margin: 0;
  min-height: 100vh;
  color: var(--ink);
  background: #f9f9f9;
}

/* Fixed gradient layer — robust on mobile where background-attachment: fixed is flaky. */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, #f9f9f9 45%, #0e3057 100%);
}

button {
  font: inherit;
}
```

- [ ] **Step 2: Rewrite `app/layout.tsx`**

Replace the whole file (this removes the inline dark style and adds DM Sans):

```tsx
import "./globals.css";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata = { title: "KIRA", manifest: "/manifest.webmanifest" };
export const viewport = { themeColor: "#f9f9f9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`,
          }}
        />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: green. If the build fails fetching DM Sans (offline build env), fall back per spec §7: download DM Sans woff2 into `public/fonts/`, add an `@font-face` block to `globals.css` with `font-family: "DM Sans"`, set `body { font-family: "DM Sans", system-ui, sans-serif; }`, and drop the `next/font` import.

- [ ] **Step 4: Render check**

Start `npm run dev` (background), load `http://localhost:3000` with Playwright. Expected: page now has the light→navy gradient; screens look broken/dark-on-light — that's fine, they're restyled in Tasks 4–7.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: add light design tokens, gradient background, DM Sans"
```

---

### Task 2: Inline SVG icon components + BottomNav restyle

**Files:**
- Create: `components/icons/Icons.tsx`
- Modify: `components/BottomNav.tsx`, `components/BottomNav.module.css`

- [ ] **Step 1: Create `components/icons/Icons.tsx`**

The five SVG source files are already committed at `components/icons/{history,home,categories,search,profile}.svg`. Build one React component per icon by copying each file's `viewBox` and `<path d="…">` data **verbatim** from the corresponding `.svg` file. Nav and search icons take `fill="currentColor"` so CSS controls their color; the profile icon keeps its literal fills (it's a self-contained badge: rounded rect `#4A7FA5` + white glyph).

Skeleton (repeat the pattern for all five — paste the full `d` attribute from each file; do not retype or truncate it):

```tsx
type IconProps = { size?: number };

export function HomeIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 23 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="(paste d from components/icons/home.svg)" fill="currentColor" />
    </svg>
  );
}

export function HistoryIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="(paste d from history.svg)" fill="currentColor" />
    </svg>
  );
}

export function CategoriesIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="(paste d from categories.svg)" fill="currentColor" />
    </svg>
  );
}

export function SearchIcon({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 47 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="(paste d from search.svg)" fill="currentColor" />
    </svg>
  );
}

export function ProfileIcon({ size = 38 }: IconProps) {
  return (
    <svg width={size} height={size * (37 / 38)} viewBox="0 0 38 37" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="37" rx="10" fill="#4A7FA5" />
      <path d="(paste d from profile.svg)" fill="white" />
    </svg>
  );
}
```

Notes: `history.svg` and `categories.svg` may contain more than one `<path>` — copy ALL paths, each with `fill="currentColor"`. Convert any `fill-rule`/`clip-rule` attributes to JSX camelCase (`fillRule`/`clipRule`). Drop the wrapper `<g>` and any `style`/`preserveAspectRatio` attributes from the source files.

- [ ] **Step 2: Rewrite `components/BottomNav.tsx`**

Same props and routes — only the rendering changes:

```tsx
"use client";
import { useRouter } from "next/navigation";
import styles from "./BottomNav.module.css";
import { CategoriesIcon, HistoryIcon, HomeIcon } from "./icons/Icons";

type Tab = "history" | "home" | "categories";

const TABS = [
  { tab: "history" as Tab, href: "/history", label: "History", Icon: HistoryIcon },
  { tab: "home" as Tab, href: "/", label: "Home", Icon: HomeIcon },
  { tab: "categories" as Tab, href: "/categories", label: "Categories", Icon: CategoriesIcon },
];

export default function BottomNav({ active }: { active?: Tab }) {
  const router = useRouter();
  return (
    <nav className={styles.bar}>
      {TABS.map(({ tab, href, label, Icon }) => (
        <button
          key={tab}
          className={active === tab ? `${styles.item} ${styles.active}` : styles.item}
          onClick={() => router.push(href)}
        >
          <Icon size={24} />
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Replace `components/BottomNav.module.css`**

```css
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--nav-bg);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
  box-shadow: 0 -6px 22px rgba(21, 29, 41, 0.08);
  padding: 10px 0 calc(10px + env(safe-area-inset-bottom));
  z-index: 50;
}
.item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
}
.active {
  color: var(--navy);
}
.label {
  font-size: 10px;
}
```

- [ ] **Step 4: Build + render check**

Run: `npm run build` → green. Load `/`, `/history`, `/categories` — the frosted nav with SVG icons shows on all, active tab navy.

- [ ] **Step 5: Commit**

```bash
git add components/icons/Icons.tsx components/BottomNav.tsx components/BottomNav.module.css
git commit -m "feat: inline Figma SVG icons and restyle BottomNav to frosted light bar"
```

---

### Task 3: Shared presentational components (TopBar, SearchBox, CategoryPills) + shared page styles + savedLabel helper

**Files:**
- Create: `components/TopBar.tsx`, `components/TopBar.module.css`
- Create: `components/SearchBox.tsx`, `components/SearchBox.module.css`
- Create: `components/CategoryPills.tsx`, `components/CategoryPills.module.css`
- Create: `app/shared.module.css`
- Create: `lib/savedLabel.ts`

- [ ] **Step 1: Create `components/TopBar.tsx`**

```tsx
import styles from "./TopBar.module.css";
import { ProfileIcon } from "./icons/Icons";

export default function TopBar() {
  return (
    <div className={styles.bar}>
      <span className={styles.logo}>K</span>
      {/* Decorative — the app has no accounts (spec decision 4). */}
      <span className={styles.profile} aria-hidden="true">
        <ProfileIcon size={38} />
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/TopBar.module.css`**

```css
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 21px;
}
.logo {
  width: 38px;
  height: 37px;
  border-radius: 10px;
  background: var(--navy-deep);
  color: #fff;
  font-size: 21px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile {
  line-height: 0;
}
```

- [ ] **Step 3: Create `components/SearchBox.tsx`**

Same submit behavior as the old askBar: push to `/chat?q=…`.

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SearchBox.module.css";
import { SearchIcon } from "./icons/Icons";

export default function SearchBox({
  placeholder,
  variant = "light",
}: {
  placeholder: string;
  variant?: "light" | "navy";
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/chat?q=${encodeURIComponent(query)}`);
  }

  return (
    <form
      className={variant === "navy" ? `${styles.box} ${styles.navy}` : styles.box}
      onSubmit={submit}
    >
      <input
        className={styles.input}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
      />
      <button className={styles.iconBtn} type="submit" aria-label="Search">
        <SearchIcon size={28} />
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Create `components/SearchBox.module.css`**

```css
.box {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 54px;
  box-sizing: border-box;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 3px 8px 3px 15px;
}
.input {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  font: inherit;
  font-size: 16px;
  color: var(--ink);
  outline: none;
}
.input::placeholder {
  color: var(--muted);
}
.iconBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent);
  line-height: 0;
  padding: 6px;
}
.navy {
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 4px 2px rgba(0, 0, 0, 0.25);
}
.navy .input {
  color: #fff;
}
.navy .input::placeholder {
  color: rgba(255, 255, 255, 0.9);
}
.navy .iconBtn {
  color: #fff;
}
```

- [ ] **Step 5: Create `components/CategoryPills.tsx`**

Used on home (themes passed in from existing polling), history and category list (self-fetching). "More..." always routes to `/categories` (spec §2).

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./CategoryPills.module.css";

export type PillTheme = { name: string; why: string; count: number };

export default function CategoryPills({
  themes: external,
  max = 7,
}: {
  themes?: PillTheme[];
  max?: number;
}) {
  const router = useRouter();
  const [fetched, setFetched] = useState<PillTheme[]>([]);

  useEffect(() => {
    if (external) return;
    fetch("/api/themes", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setFetched(Array.isArray(d?.themes) ? d.themes : []))
      .catch(() => setFetched([]));
  }, [external]);

  const themes = external ?? fetched;

  return (
    <div className={styles.row}>
      {themes.slice(0, max).map((t) => (
        <button
          key={t.name}
          className={styles.pill}
          onClick={() => router.push(`/category/${encodeURIComponent(t.name)}`)}
        >
          {t.name}
        </button>
      ))}
      <button className={styles.pill} onClick={() => router.push("/categories")}>
        More...
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Create `components/CategoryPills.module.css`**

```css
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 11px;
  justify-content: center;
}
.pill {
  background: var(--pill);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  padding: 5px 20px;
  font-size: 12px;
  color: var(--ink);
  cursor: pointer;
}
.pill:hover {
  border-color: var(--accent);
}
```

- [ ] **Step 7: Create `app/shared.module.css`**

Patterns repeated across the four screens (replaces the old shared `page.module.css` blast radius with an explicit, small contract):

```css
.wrap {
  max-width: 480px;
  margin: 0 auto;
  padding: 22px 22px 130px;
}
.sectionTitle {
  font-size: 22px;
  font-weight: 500;
  color: var(--navy);
  margin: 25px 0 12px;
}
.card {
  display: block;
  width: 100%;
  text-align: left;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 12px 15px;
  color: var(--ink);
  cursor: pointer;
}
.cardList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.muted {
  color: var(--muted);
}
.error {
  color: #c0392b;
}
```

- [ ] **Step 8: Create `lib/savedLabel.ts`**

Used by home (`created_at` ISO string) and history (`ts` epoch ms). Pure, no mutation.

```ts
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function savedLabel(input: string | number): string {
  const saved = new Date(input);
  if (isNaN(saved.getTime())) return "";
  const days = Math.round((startOfDay(new Date()) - startOfDay(saved)) / 86400000);
  if (days <= 0) return "Saved today";
  if (days === 1) return "Saved yesterday";
  return `Saved ${saved.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}
```

- [ ] **Step 9: Build**

Run: `npm run build` → green (components exist but are unused so far; Next tolerates that).

- [ ] **Step 10: Commit**

```bash
git add components/TopBar.tsx components/TopBar.module.css components/SearchBox.tsx components/SearchBox.module.css components/CategoryPills.tsx components/CategoryPills.module.css app/shared.module.css lib/savedLabel.ts
git commit -m "feat: add TopBar, SearchBox, CategoryPills, shared page styles, savedLabel"
```

---

### Task 4: Home screen (frame 33:2638) + InstallPrompt restyle

**Files:**
- Create: `app/home.module.css`
- Create: `app/InstallPrompt.module.css`
- Modify: `app/page.tsx` (full rewrite of render; data logic preserved)
- Modify: `app/InstallPrompt.tsx:4` (only the styles import changes)

- [ ] **Step 1: Create `app/home.module.css`**

```css
.greeting {
  font-size: 18px;
  font-weight: 500;
  color: var(--ink);
  margin: 0 0 15px;
}
.suggested {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  text-align: left;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 12px 15px;
  margin-top: 15px;
  cursor: pointer;
}
.suggestedLabel {
  font-size: 11px;
  color: var(--muted);
}
.suggestedText {
  font-size: 18px;
  font-weight: 500;
  color: var(--ink);
  line-height: 24px;
}
.saveCard {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.saveTitle {
  font-size: 15px;
  font-weight: 500;
  line-height: 21px;
}
.saveMeta {
  font-size: 12px;
  color: var(--muted);
}
.saveDate {
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  margin-top: 4px;
}
.empty {
  text-align: center;
  padding: 24px 0;
}
```

- [ ] **Step 2: Create `app/InstallPrompt.module.css`**

Same class names InstallPrompt already uses, light theme:

```css
.installCard {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 14px 16px;
  margin-top: 15px;
}
.installEmoji {
  font-size: 26px;
  line-height: 1;
}
.installText {
  flex: 1;
  min-width: 0;
}
.installText strong {
  color: var(--ink);
  font-size: 15px;
}
.installHint {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.4;
}
.installHint b {
  color: var(--accent);
  font-weight: 600;
}
.installBtn {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.installBtn:hover {
  background: var(--navy);
}
```

- [ ] **Step 3: Update `app/InstallPrompt.tsx` import**

Change line 4 from `import styles from "./page.module.css";` to:

```tsx
import styles from "./InstallPrompt.module.css";
```

No other changes to that file.

- [ ] **Step 4: Rewrite `app/page.tsx`**

Keep: Item type, items/themes/err state, `loadThemes`, `load`, `lastThemeCount`, 5s polling effect, `refresh` is **removed** (the header Refresh button is gone per spec; polling already refreshes). Removed: `ask` state and `submitAsk` (SearchBox owns that), `ThemeBubbles` import/render, `PostCard` import (home now renders its own save cards).

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./home.module.css";
import shared from "./shared.module.css";
import InstallPrompt from "./InstallPrompt";
import TopBar from "../components/TopBar";
import SearchBox from "../components/SearchBox";
import CategoryPills, { PillTheme } from "../components/CategoryPills";
import BottomNav from "../components/BottomNav";
import { savedLabel } from "../lib/savedLabel";

type Item = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  author: string;
  thumbnail: string;
  source_url: string;
  created_at: string;
};

const SUGGESTED_PROMPT = "Build me a 3-day Tokyo itinerary from my saved reels";

export default function Library() {
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  const [themes, setThemes] = useState<PillTheme[]>([]);
  const [err, setErr] = useState("");
  const lastThemeCount = useRef<number>(-1);

  async function loadThemes() {
    try {
      const r = await fetch("/api/themes", { cache: "no-store" });
      const data = await r.json();
      setThemes(Array.isArray(data?.themes) ? data.themes : []);
    } catch {
      setThemes([]);
    }
  }

  async function load() {
    try {
      const r = await fetch("/api/library", { cache: "no-store" });
      const data = await r.json();
      const list: Item[] = Array.isArray(data) ? data : [];
      setItems(list);
      setErr("");
      if (list.length !== lastThemeCount.current) {
        lastThemeCount.current = list.length;
        await loadThemes();
      }
    } catch (e: any) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className={shared.wrap}>
      <TopBar />
      <p className={styles.greeting}>Hi there!</p>
      <SearchBox placeholder="What are we looking for today?" />
      <button
        className={styles.suggested}
        onClick={() => router.push(`/chat?q=${encodeURIComponent(SUGGESTED_PROMPT)}`)}
      >
        <span className={styles.suggestedLabel}>Suggested prompt</span>
        <span className={styles.suggestedText}>{SUGGESTED_PROMPT}</span>
      </button>

      <InstallPrompt />

      <h2 className={shared.sectionTitle}>Categories</h2>
      {themes.length === 0 ? (
        <p className={shared.muted}>Save a few more reels and KIRA will group them into categories.</p>
      ) : (
        <CategoryPills themes={themes} />
      )}

      <h2 className={shared.sectionTitle}>Recent saves</h2>
      {err && <p className={shared.error}>Couldn&rsquo;t reach KIRA: {err}</p>}
      {items === null && <p className={shared.muted}>Loading your library&hellip;</p>}
      {items?.length === 0 && (
        <div className={styles.empty}>
          <p>Your library is empty.</p>
          <p className={shared.muted}>Share an Instagram reel to KIRA to see it here.</p>
        </div>
      )}
      <div className={shared.cardList}>
        {items?.slice(0, 3).map((it) => (
          <button
            key={it.id}
            className={`${shared.card} ${styles.saveCard}`}
            onClick={() => router.push(`/post/${encodeURIComponent(it.id)}`)}
          >
            <span className={styles.saveTitle}>{it.title}</span>
            <span className={styles.saveMeta}>Instagram &bull; {it.author}</span>
            <span className={styles.saveDate}>{savedLabel(it.created_at)}</span>
          </button>
        ))}
      </div>

      <BottomNav active="home" />
    </main>
  );
}
```

- [ ] **Step 5: Build + render check**

Run: `npm run build` → green (note: `app/page.module.css` still exists — history/categories/category pages still import it; it dies in Task 8). Load `/`: TopBar, greeting, search box, suggested prompt, pills (or empty-state line), recent saves (or empty state), frosted nav. Compare against Figma frame 33:2638.

- [ ] **Step 6: Commit**

```bash
git add app/home.module.css app/InstallPrompt.module.css app/InstallPrompt.tsx app/page.tsx
git commit -m "feat: re-skin home screen to Figma hi-fi design"
```

---

### Task 5: History screen (frame 33:2721)

**Files:**
- Create: `app/history/history.module.css`
- Modify: `app/history/page.tsx` (full rewrite of render; loadHistory logic preserved)

- [ ] **Step 1: Create `app/history/history.module.css`**

```css
.chatCard {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.chatQuestion {
  font-size: 15px;
  font-weight: 500;
  line-height: 21px;
}
.chatTheme {
  font-size: 12px;
  color: var(--muted);
}
.chatDate {
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  margin-top: 4px;
}
.finePrint {
  font-size: 11px;
  color: var(--muted);
  text-align: right;
  margin: 8px 0 25px;
}
```

- [ ] **Step 2: Rewrite `app/history/page.tsx`**

The chat-history cap is exactly 10 (`lib/chatHistory.ts` `MAX = 10`), so the Figma fine print is used verbatim. The date line uses `savedLabel(h.ts)` (epoch ms). Per spec, the Figma's "Instagram • Creator Handle" subtitle is dropped for chats; the existing optional `theme` line stays.

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./history.module.css";
import shared from "../shared.module.css";
import TopBar from "../../components/TopBar";
import SearchBox from "../../components/SearchBox";
import CategoryPills from "../../components/CategoryPills";
import BottomNav from "../../components/BottomNav";
import { ChatRecord, loadHistory } from "../../lib/chatHistory";
import { savedLabel } from "../../lib/savedLabel";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ChatRecord[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  return (
    <main className={shared.wrap}>
      <TopBar />
      <h2 className={shared.sectionTitle}>Your recent searches</h2>
      {history.length === 0 && <p className={shared.muted}>No conversations yet.</p>}
      <div className={shared.cardList}>
        {history.map((h) => (
          <button
            key={h.id}
            className={`${shared.card} ${styles.chatCard}`}
            onClick={() => router.push(`/chat?history=${encodeURIComponent(h.id)}`)}
          >
            <span className={styles.chatQuestion}>{h.question}</span>
            {h.theme && <span className={styles.chatTheme}>{h.theme}</span>}
            <span className={styles.chatDate}>{savedLabel(h.ts)}</span>
          </button>
        ))}
      </div>
      {history.length > 0 && (
        <p className={styles.finePrint}>Only the 10 most recent searches are saved.</p>
      )}

      <SearchBox placeholder="Looking for something new?" variant="navy" />

      <h2 className={shared.sectionTitle}>Explore other categories</h2>
      <CategoryPills />

      <BottomNav active="history" />
    </main>
  );
}
```

- [ ] **Step 3: Build + render check**

Run: `npm run build` → green. Load `/history`: cards (or "No conversations yet."), navy search bar, pills, nav with History active. Compare against Figma frame 33:2721.

- [ ] **Step 4: Commit**

```bash
git add app/history/history.module.css app/history/page.tsx
git commit -m "feat: re-skin history screen to Figma hi-fi design"
```

---

### Task 6: Categories index (frame 33:2859)

**Files:**
- Create: `app/categories/categories.module.css`
- Modify: `app/categories/page.tsx` (render only; fetch logic preserved)

- [ ] **Step 1: Create `app/categories/categories.module.css`**

```css
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rowText {
  min-width: 0;
}
.rowName {
  font-size: 15px;
  font-weight: 500;
  line-height: 21px;
}
.rowWhy {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}
.rowCount {
  font-size: 12px;
  font-weight: 500;
  color: var(--navy);
  flex: none;
}
```

- [ ] **Step 2: Rewrite `app/categories/page.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./categories.module.css";
import shared from "../shared.module.css";
import TopBar from "../../components/TopBar";
import BottomNav from "../../components/BottomNav";

type Theme = { name: string; why: string; count: number };

export default function CategoriesPage() {
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[] | null>(null);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    fetch("/api/themes", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setThemes(Array.isArray(d?.themes) ? d.themes : []);
        setReady(d?.ready !== false);
      })
      .catch(() => setThemes([]));
  }, []);

  return (
    <main className={shared.wrap}>
      <TopBar />
      <h2 className={shared.sectionTitle}>Categories</h2>
      {themes === null && <p className={shared.muted}>Loading&hellip;</p>}
      {themes && themes.length === 0 && (
        <p className={shared.muted}>
          {ready
            ? "No categories yet."
            : "Save a few more reels and KIRA will group them into categories."}
        </p>
      )}
      <div className={shared.cardList}>
        {themes?.map((t) => (
          <button
            key={t.name}
            className={`${shared.card} ${styles.row}`}
            onClick={() => router.push(`/category/${encodeURIComponent(t.name)}`)}
          >
            <div className={styles.rowText}>
              <div className={styles.rowName}>{t.name}</div>
              <div className={styles.rowWhy}>{t.why}</div>
            </div>
            <span className={styles.rowCount}>{t.count}</span>
          </button>
        ))}
      </div>
      <BottomNav active="categories" />
    </main>
  );
}
```

- [ ] **Step 3: Build + render check**

Run: `npm run build` → green. Load `/categories`: rows with name/tagline/count, nav with Categories active. Compare against Figma frame 33:2859.

- [ ] **Step 4: Commit**

```bash
git add app/categories/categories.module.css app/categories/page.tsx
git commit -m "feat: re-skin categories index to Figma hi-fi design"
```

---

### Task 7: Category list (frame 33:2930) + PostCard restyle

**Files:**
- Create: `components/PostCard.module.css`
- Modify: `components/PostCard.tsx` (drop thumbnail per Figma card; keep type, routes, handlers)
- Create: `app/category/[name]/category.module.css`
- Modify: `app/category/[name]/page.tsx` (render only; fetch + filterByCategory preserved)

- [ ] **Step 1: Create `components/PostCard.module.css`**

Per Figma category-list card: title, 2-line summary, tiny hashtag chips, "Instagram • author" + "Source ↗" row. No thumbnail.

```css
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 12px 15px;
  cursor: pointer;
}
.title {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  line-height: 21px;
  margin: 0;
}
.summary {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.35;
  margin: 2px 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
}
.tag {
  font-size: 9px;
  color: var(--navy);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 1px 6px;
}
.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--muted);
}
.meta a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
}
```

- [ ] **Step 2: Rewrite `components/PostCard.tsx`**

```tsx
"use client";
import { useRouter } from "next/navigation";
import styles from "./PostCard.module.css";

export type PostItem = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  author: string;
  thumbnail: string;
  source_url: string;
};

export default function PostCard({ item }: { item: PostItem }) {
  const router = useRouter();
  const open = () => router.push(`/post/${encodeURIComponent(item.id)}`);
  return (
    <article
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter") open();
      }}
    >
      <h2 className={styles.title}>{item.title}</h2>
      <p className={styles.summary}>{item.summary}</p>
      <div className={styles.tags}>
        {item.tags?.map((t, j) => (
          <span key={j} className={styles.tag}>
            #{t}
          </span>
        ))}
      </div>
      <div className={styles.meta}>
        <span>Instagram &bull; {item.author}</span>
        <a
          href={item.source_url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Source &#8599;
        </a>
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Create `app/category/[name]/category.module.css`**

```css
.staleNote {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 10px;
}
```

- [ ] **Step 4: Rewrite `app/category/[name]/page.tsx`**

The old "← Categories" back button is dropped (the Figma has none; the bottom nav covers it). Fetching and `filterByCategory` are unchanged.

```tsx
"use client";
import { useEffect, useState } from "react";

import styles from "./category.module.css";
import shared from "../../shared.module.css";
import TopBar from "../../../components/TopBar";
import BottomNav from "../../../components/BottomNav";
import CategoryPills from "../../../components/CategoryPills";
import PostCard, { PostItem } from "../../../components/PostCard";
import { filterByCategory } from "../../../lib/categoryFilter";

export default function CategoryViewer({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name);
  const [items, setItems] = useState<PostItem[] | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [tr, lr] = await Promise.all([
          fetch("/api/themes", { cache: "no-store" }),
          fetch("/api/library", { cache: "no-store" }),
        ]);
        const td = await tr.json();
        const all: PostItem[] = await lr.json();
        const theme = (td?.themes ?? []).find((t: any) => t.name === name);
        if (!theme) {
          setStale(true);
          setItems([]);
          return;
        }
        setItems(filterByCategory(all, theme.source_urls ?? []));
      } catch {
        setItems([]);
      }
    })();
  }, [name]);

  return (
    <main className={shared.wrap}>
      <TopBar />
      <h2 className={shared.sectionTitle}>{name}</h2>
      {items === null && <p className={shared.muted}>Loading&hellip;</p>}
      {stale && (
        <p className={styles.staleNote}>
          This category changed as new posts came in. Head back to Categories.
        </p>
      )}
      <div className={shared.cardList}>
        {items?.map((it) => (
          <PostCard key={it.id} item={it} />
        ))}
      </div>

      <h2 className={shared.sectionTitle}>Explore other categories</h2>
      <CategoryPills />

      <BottomNav active="categories" />
    </main>
  );
}
```

Note: `useRouter` is no longer needed in this file once the back button is gone — make sure the unused import is removed (it is, in the code above).

- [ ] **Step 5: Build + render check**

Run: `npm run build` → green. Load `/categories` → tap a row → category list shows new PostCards + pills. Compare against Figma frame 33:2930.

- [ ] **Step 6: Commit**

```bash
git add components/PostCard.module.css components/PostCard.tsx "app/category/[name]/category.module.css" "app/category/[name]/page.tsx"
git commit -m "feat: re-skin category list and PostCard to Figma hi-fi design"
```

---

### Task 8: Delete dead files (ThemeBubbles, page.module.css)

**Files:**
- Delete: `app/ThemeBubbles.tsx`, `app/page.module.css`

- [ ] **Step 1: Verify nothing imports them**

Run: `grep -rn "page.module.css\|ThemeBubbles" app components --include="*.tsx"`
Expected: no matches. If anything matches, fix that import first (it means a Task 4–7 step was missed).

- [ ] **Step 2: Delete**

```bash
git rm app/ThemeBubbles.tsx app/page.module.css
```

- [ ] **Step 3: Build**

Run: `npm run build` → green.

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: remove ThemeBubbles and old shared page.module.css"
```

---

### Task 9: Light color pass on chat, share, post (colors only — no layout/markup changes)

**Files:**
- Modify: `app/chat/chat.module.css`, `app/share/share.module.css`, `app/post/[id]/post.module.css`

Rule for all three files: every class name, layout property (flex, padding, radius, position) stays identical; only color/background/border-color/shadow values change. Mapping: dark text (`#e8e8ee`, `#fff`, `#ddd`) → `var(--ink)`; grays (`#8a8a99`, `#8a8a96`, `#7c7c88`) → `var(--muted)`; dark surfaces (`#16161c`, `#14141a`, `#1b1b22`, `#0b0b0f`) → `var(--card)` or transparent; dark borders (`#2a2a33`, `#22222b`) → `var(--border)`; purple accent (`#7c5cff`, `#9b7cff`, `#c9b8ff`) → `var(--accent)`.

- [ ] **Step 1: Recolor `app/chat/chat.module.css`**

Apply these exact value swaps (keep everything else):

```
.wrap            color: #e8e8ee            → color: var(--ink)
.back            border: 1px solid #2a2a33 → border: 1px solid var(--border)
                 color: #e8e8ee            → color: var(--ink)
.recentLabel     color: #8a8a99            → color: var(--muted)
.recentItem      background: #16161c       → background: var(--card)
                 border-color #2a2a33      → var(--border);  color → var(--ink)
.muted           #8a8a99                   → var(--muted)
.error           #ff6b6b                   → #c0392b
.question        background: rgba(124,92,255,0.18) → rgba(74,127,165,0.15)
.answer          background: #16161c       → var(--card);  border → var(--border)
.citeMark        color: #9b7cff            → var(--accent)
.sourceCard      border #2a2a33            → var(--border);  color #e8e8ee → var(--ink); add background: var(--card)
.sourceThumbFallback background: #2a2a33   → var(--border)
.sourceAuthor    #8a8a99                   → var(--muted)
.chip            background rgba(124,92,255,0.15) → var(--pill);  border #3a3050 → var(--border);  color #cbb9ff → var(--ink)
.deepen          border #6a1b9a            → var(--accent);  color #ce93d8 → var(--accent)
.askBar          background: #0e0e12       → var(--nav-bg);  border-top #2a2a33 → var(--border);  add backdrop-filter: blur(7px); -webkit-backdrop-filter: blur(7px);
.askInput        background #16161c        → var(--card);  border → var(--border);  color → var(--ink)
.askSend         background: #7c5cff       → var(--accent)
.webCard         border #2a3a40            → var(--border);  color #e8e8ee → var(--ink);  keep border-left #36c5d6 and background rgba(54,197,214,0.06)
.webMeta         #7fb7c0                   → #2b7a8a
.webSnippet      #b8c2c6                   → var(--muted)
```

- [ ] **Step 2: Recolor `app/share/share.module.css`**

```
.wrap   background: #0b0b0f → delete the background line (body gradient shows through)
.toast  background: #14141a → var(--card);  border #2a2a33 → var(--border);  color #eee → var(--ink)
.hint   #8a8a96 → var(--muted)
.link   #8ab4ff → var(--accent)
```

- [ ] **Step 3: Recolor `app/post/[id]/post.module.css`**

```
.linkBtn   background #1b1b22 → var(--card);  color #ddd → var(--ink);  border #2a2a33 → var(--border)
.source    #8ab4ff → var(--accent)
.title     #fff → var(--ink)
.label     #8a8a96 → var(--muted)
.textarea  background #16161c → var(--card);  border → var(--border);  color → var(--ink)
.input     same swaps as .textarea
.remove,.add  background #1b1b22 → var(--card);  color #ddd → var(--ink);  border → var(--border)
.tag       color #c9b8ff → var(--navy);  background #211b34 → var(--pill);  add border: 1px solid var(--border)
.save      background #7c5cff → var(--accent)
.ok        #8fe0a8 → #1e7d46
.err       #ff9b9b → #c0392b
.muted     #8a8a96 → var(--muted)
```

- [ ] **Step 4: Build + render check**

Run: `npm run build` → green. Load `/chat?q=test` (renders even if the API errors), `/share`, and a `/post/<id>` if data exists: all light, readable, layouts unchanged.

- [ ] **Step 5: Commit**

```bash
git add app/chat/chat.module.css app/share/share.module.css "app/post/[id]/post.module.css"
git commit -m "feat: light color pass on chat, share, and post screens"
```

---

### Task 10: Full verification walk

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

Run: `npm run build`
Expected: green, no type errors, no unused-import warnings.

- [ ] **Step 2: Flow walk with Playwright against `npm run dev`**

If the orchestrator backend is reachable (see RESUME CHECKLIST in project memory), walk with real data; otherwise verify layouts + empty/error states:

1. `/` — TopBar, greeting, search, suggested prompt, pills, recent saves, nav.
2. Type a query in the home search → lands on `/chat?q=…`.
3. Tap suggested prompt → `/chat` with the Tokyo prompt.
4. Tap a category pill → `/category/<name>` with new PostCards; "Source ↗" opens externally; card tap → `/post/<id>`.
5. `/categories` → rows render, tap navigates.
6. `/history` — cards, fine print, navy search bar, pills; tap a card → reopens that chat.
7. Bottom nav from every screen; active states correct (including nav on `/post/<id>` matching the light theme).

- [ ] **Step 3: Screenshot comparison**

Screenshot `/`, `/history`, `/categories`, `/category/<name>` at 390×844 and compare against the four Figma frames (canvas 21:1931). Fix obvious spacing/color mismatches.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A && git commit -m "fix: visual polish from Figma comparison pass"
```

(Skip if no changes.)

---

### Task 11: Deploy (after user confirms local verification looks good)

- [ ] **Step 1: Merge + deploy** — per project precedent: merge `figma-reskin` → `main` locally, deploy with the Vercel CLI flow used in iterations 4–5 (target: kira-pwa-rho.vercel.app), then browser-verify the live URL.
- [ ] **Step 2: Push to GitHub** (`origin main`).

---

## Self-review notes

- Spec coverage: tokens (T1), shared components + nav (T2–T3), four screens (T4–T7), `page.module.css` split & deletion + ThemeBubbles removal (T4–T8), light pass (T9), verification (T10), deploy (T11). All six locked spec decisions implemented: light pass (T9), home saves vs history chats (T4/T5), bubbles retired (T4/T8), profile no-op (T3 TopBar), "Hi there!" (T4), static suggested prompt (T4).
- The only intentionally non-literal code step is the SVG path data in Task 2 (paths live in committed `.svg` files; copying them verbatim is specified mechanically — full `d` strings are multi-KB and transcription would risk corruption).
- Type consistency: `PillTheme` defined in `CategoryPills.tsx` (T3), imported by home (T4); `PostItem` unchanged; `savedLabel(input: string | number)` used with `created_at` (string, T4) and `ts` (number, T5). `BottomNav` props unchanged so `post/[id]` keeps compiling without edits.
