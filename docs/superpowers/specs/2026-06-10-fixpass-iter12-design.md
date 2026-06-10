# KIRA Fix Pass (Iteration 12) — Design

Date: 2026-06-10
Status: Approved by user (brainstorm session)
Scope: PWA only (`kira-pwa`). Orchestrator untouched.

Four small UX/branding fixes. No new features, no API changes.

## 1. New PWA icon

**Source asset:** `/root/files/WhatsApp Image 2026-06-10 at 19.28.55 (1).jpeg` — navy
K-burst mark on light gray (#f5f5f5-ish) background.

**Change:** Regenerate `public/icon-192.png` (192×192) and `public/icon-512.png`
(512×512) from the JPEG: center-crop to square, resize, save as PNG. Filenames are
unchanged, so `manifest.webmanifest` needs no edit. Both icons remain
`purpose: "any maskable"`; the mark is centered with ample background padding, so it
survives Android's circle/squircle masking.

**Explicitly out of scope (user decision):**
- In-app `KiraMark` SVG (header, splash) stays as-is.
- `PhoneKIcon` on the install card stays as-is.
- The in-app "Welcome to KIRA!" splash (`components/Splash.tsx`) is **unchanged**.
- The Android OS launch splash cannot be removed; it will automatically show the new
  icon once the PNGs are replaced.

**Known caveat:** Installed PWAs cache icons; an already-installed app may need a
reinstall (or Android's periodic manifest refresh) to show the new icon.

## 2. Install card hidden when installed

**File:** `app/InstallPrompt.tsx`

**Current behavior:** 4 branches — standalone → "KIRA is ready…" card; just-installed
(browser tab) → "Added to your home screen!" card; no captured prompt → static manual
guidance card; prompt captured → tappable install button.

**New behavior (user decision: hide ALL installed states):**
- Running standalone (`display-mode: standalone` or iOS `navigator.standalone`) →
  render `null`.
- After `appinstalled` fires (still in browser tab) → render `null`.
- Browser, not installed, no captured prompt (iOS Safari etc.) → keep static
  "Add KIRA to your phone!" guidance card.
- Browser, not installed, prompt captured → keep tappable install button.

The "KIRA is ready / In Instagram, tap Share → KIRA…" copy and the
"Added to your home screen!" copy are removed entirely.

**Known caveat (platform limitation):** if the app is installed but the user opens the
URL in a plain browser tab, the web cannot reliably detect "installed elsewhere," so
the install card still shows in that tab. It never shows inside the installed app.

## 3. Home category pills capped at 3 rows

**File:** `components/CategoryPills.tsx` (+ its module CSS)

**Requirement:** The pill cloud on the home page may occupy at most 3 wrapped rows,
*including* the trailing "More..." pill. Never a 4th row.

**Approach (chosen: JS row measurement — Option A from brainstorm):**
- Render candidate pills (existing `max = 7` upper bound stays) plus "More...".
- After layout, measure each pill's `offsetTop` to derive its row index.
- Hide any theme pill that would land beyond row 3, and drop trailing theme pills
  until "More..." itself fits within row 3. "More..." is always the last visible pill.
- Re-measure on container resize (ResizeObserver) so rotation/width changes stay
  within the cap.
- Measurement must not cause visible flicker: render the full set invisibly
  (e.g. `visibility: hidden` until first measurement completes) or measure
  synchronously via `useLayoutEffect`.

Rejected alternatives: CSS `max-height` clamp (can hide "More..."), lowering the count
cap (no actual row guarantee on narrow screens).

## 4. Chat sources: position + plain-text style

**Files:** `app/chat/page.tsx`, `components/SourceCard.tsx`, `app/chat/chat.module.css`

**Position (user decision: directly under the Go Deeper button):**
New render order in an answered chat turn:
1. Answer card (with inline `[n]` citation links)
2. Suggestion chips
3. Go Deeper button (+ its loading/error states)
4. Sources list  ← moved here (was above the chips)
5. FROM THE WEB section (when Go Deeper results load)

**Style — strip everything (user decision):**
- Remove the "Sources" header label.
- Remove thumbnails from `SourceCard` (both the `<img>` via `/api/thumb` proxy and the
  gray `sourceThumbFallback` box). `citationThumbSrc` usage goes away in this card.
- Each source renders as one plain-text clickable line:
  `[n] Title @author ↗`
  — single font family, single size, single weight. No bold title, no
  smaller/dimmer author line, no card chrome beyond what's needed for tap targets.
- Keep `id="source-{n}"` anchors on each line so the answer's `[n]` links still
  scroll-to-source. Keep `target="_blank" rel="noreferrer"` outbound links.

**Out of scope:** `WebResultCard` (FROM THE WEB results) keeps its current look,
thumbnails included — the user's request covered only the saved-content Sources list.

## Testing & verification

- Update the existing Vitest suite: InstallPrompt branch tests (standalone/installed
  branches now render null), CategoryPills tests (row-cap logic; mock layout metrics),
  chat page render-order and SourceCard markup assertions.
- Add a unit test for the row-cap helper (pure function over measured offsets where
  feasible).
- Local browser verification (Playwright/dev server) of: home page pill rows at a
  mobile viewport, chat answer ordering, install card hidden in simulated standalone
  mode, new icons served.
- Live verification on kira-pwa-rho.vercel.app after deploy, per the usual flow.

## Error handling notes

- Icon generation is build-time/one-off; verify PNG dimensions before committing.
- CategoryPills measurement must degrade safely: if measurement fails (e.g. zero-width
  container during hydration), fall back to showing the capped count (current
  behavior) rather than hiding everything.
- InstallPrompt keeps its existing try/catch-free event-listener pattern; no new
  failure modes introduced.
