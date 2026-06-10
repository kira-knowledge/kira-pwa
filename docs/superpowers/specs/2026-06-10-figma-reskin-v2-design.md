# KIRA PWA — Figma Re-skin v2 (Angelina's gradient design) — Iteration 10

**Date:** 2026-06-10
**Figma file:** `LLVi0rjpxodSJCimxzZWaf` ("Untitled", Page 1). Access via **Figma REST API** with the
user's personal access token (env `FIGMA_TOKEN`, provided in-session — **rotate after the hackathon**).
The Figma **MCP server is unusable** (Starter plan: 6 calls/month, exhausted); use
`GET /v1/files/:key` for node JSON (exact fills/typography) and `GET /v1/images/:key?ids=…&scale=2`
for frame renders. Rendered PNGs of all 15 screens are in `/tmp/fig-*.png` (re-render if expired).
**Approach:** Theme-first restyle in place (user-approved) — shared tokens + gradient shell, restyle
existing screens' CSS modules, add new routes. All working flows (Supabase auth, share-target ingest,
chat/citations, Exa deepen, pagination) stay wired.

## Figma frame map

| Frame | Node | Maps to |
|---|---|---|
| Splash | `2:6` | new splash overlay |
| Home Screen | `1:5` | `app/page.tsx` |
| History | `1:87` | `app/history` |
| Catrgory Index (sic) | `1:745` | `app/categories` |
| Catrgory List (sic) | `1:808` | `app/category/[name]` |
| Unclassified | `1:160` | unclassified posts view |
| Search - One Shot | `1:363` | `app/chat` |
| Search - Multi Shot (open/closed sources) | `1:421` / `1:483` | **deferred** (visual design only; existing follow-up input stays functional) |
| Saved Post View ×2 | `1:543` (edit pencil) / `1:604` (red Save pill) | `app/post/[id]` |
| Confirmation Page | `1:665` | `app/share` success state |
| Log In | `1:672` | `app/login` |
| Sign Up | `1:720` | new `app/signup` |
| Upgrade | `1:689` | new `app/upgrade` |
| Subscription Details | `1:208` | new `app/subscription` |
| Profile - Free / "Profiel - Pro" (sic) | `1:315` / `1:265` | new `app/profile` (variant by plan) |

## Locked decisions (from brainstorm Q&A)

1. **Auth stays real, re-skinned.** Login keeps Supabase (demo accounts free@/pro@kira.demo;
   FREE/PRO gating unchanged). **Sign Up is frontend-only**: no account creation; submit shows a
   success state then returns to `/login`; back-to-login link works.
2. **Splash** is Figma `2:6` ("Welcome to KIRA!" + big K logo + "Find what's forgotten?").
   Animated **bottom-to-top** (~1.5s rise + fade), shown once per session (sessionStorage) and on
   PWA standalone launch, then reveals the app.
3. **Upgrade + Subscription Details are the two Stripe-facing pages.** Point 11's "Update your
   KIRA" IS the Upgrade frame. `/upgrade` = pre-subscribe (CTA stubbed with `TODO: Stripe
   Checkout`); `/subscription` = post-subscribe management ("Cancel Subscription" stubbed for the
   Stripe customer portal). User integrates Stripe later.
4. **Post summary edits persist to the backend** via the orchestrator's existing
   `PATCH /items/{item_id}` (`store.py` `WRITABLE_FIELDS = summary, key_insights, tags`) through a
   new PWA proxy route. Both Summary and Key Insights editable (pencil → edit → red Save pill).
   **Known limitation (documented, optional follow-up):** chat RAG retrieves from the Dify dataset,
   so edits don't change chat citations unless re-pushed.
5. **Home keeps the saved-posts feed.** The Figma home's "Recent searches" label was Angelina's
   typo — it should be saved posts (restyled cards). Top of home per Figma: greeting, search,
   suggested prompt, install box, Knowledge pills.
6. **Bottom nav rename:** "Categories" → **"Knowledge"** (label + new tree icon) everywhere in the
   bottom bar. The Categories index page *title* stays "Categories" (matches Figma).
7. **Chat answers max-width 85%**, anchored left, at all times.
8. **Multi-shot visual design deferred**; one-shot + Sources + Go Deeper styled per Figma now.
9. **Go Deeper gating:** PRO → existing Exa deepen. FREE → button reads
   "Go Deeper • Get it with PRO" → `/upgrade`. Profile (FREE) "Upgrade" button → `/upgrade`.
10. **Gradient on every screen** (user emphasized repeatedly).

## 1. Foundation — tokens, gradient shell, logo

- Extract exact hex values, font, radii from the file JSON (`GET /v1/files/LLVi0rjpxodSJCimxzZWaf`)
  during implementation; observed palette: white→navy vertical gradient background, navy headings
  (~#16335B), steel-blue primary buttons, coral-red accents (Save pill, Sign Up CTA, install-box
  border), white rounded cards, frosted light bottom bar.
- Update tokens in `app/globals.css`; add a shared gradient page shell (body-level fixed gradient)
  so all screens — including chat, share, post, auth, and the new routes — sit on it.
- **New K logo** (navy rounded-square K-arrow mark, drawn as committed SVG — no remote Figma asset
  URLs, they expire): replaces TopBar logo, splash mark, install-box icon, confirmation icon.
- TopBar: K logo left; **avatar button right → `/profile`** (replaces current account affordance).

## 2. Per-screen work

### Splash (new component, root layout)
Client overlay: gradient + "Welcome to KIRA!" + K logo + "Find what's forgotten?"; content
translates up from bottom with fade; dismisses after ~1.5s. Session-once. No layout shift for
crawlers/tests (renders above the app, removed after).

### Home (`app/page.tsx`)
Per Figma `1:5`: "Hi {first name}!" (from Supabase user metadata, fallback "Hi there!"),
SearchBox "What are we looking for today?" → `/chat?q=…`, "Suggested prompt" card,
red-bordered "Add KIRA to your phone!" install box (restyle `InstallPrompt`, K logo, red text per
Figma), "Knowledge" pill row (top categories + "More…" → `/categories`), then saved-posts feed
(existing data, cards restyled; 2-line title clamp from iteration 9 survives).

### Knowledge index (`app/categories`)
White cards: category name, tagline, count right-aligned navy. **Overlap fix (point 3):** count
column auto-sizes to content; tagline `max-width` reduced + wraps/ellipsizes — large counts
(e.g. 888888) never overlap. "View All" affordance per Figma. Pagination (iteration 9) survives.

### Category list (`app/category/[name]`)
"< {Category}" header, restyled post cards with tag chips + "Source ↗", "Explore other Knowledge"
pill row at bottom. **Unclassified** view per `1:160` (list of unclassified posts) reachable from
the index, consistent with how unclassified saves are grouped today.

### Think KIRA chat (`app/chat`)
Header "< Think KIRA — *Your knowledge, on demand.*"; user bubble right-aligned; answer card white,
**max-width 85% from left**; "More on X" suggestion pills derived from the answer's source
categories (skip row if none); Sources card with [1][2][3] + "Instagram • {creator}" per Figma;
Go Deeper button per gating rule above ("FROM THE WEB" Exa results section survives restyled).
History button (iteration 9) survives. Follow-up input stays functional, styled to match.

### Saved post view (`app/post/[id]`)
Per `1:543`/`1:604`: title, Summary card (pencil → textarea → red Save pill → persists), Key
Insights cards (same edit pattern), "Category • SourcePlatform • Creator Handle" chip row,
header share/edit icons per Figma. New PWA API proxy route → orchestrator `PATCH /items/{id}`.
Optimistic UI update; error banner on failure (no silent swallow).

### Confirmation (`app/share` success state)
Per `1:665`: "Saved!", navy circle + white check, "Your post has been saved to KIRA"; simple
animation (circle scale-in, check draw, text rises bottom-to-top). Share-target flow logic
untouched.

### Login (`app/login`) + Sign Up (new `app/signup`)
Login per `1:672`: "Welcome back!", Username (Email ID) + Password fields, steel-blue Log In —
real Supabase submit unchanged; footer "Ready to find what's forgotten? **Sign up!**" → `/signup`.
Sign Up per `1:720`: Name / Username / Password / Confirm Password, coral Sign Up button —
client-side validation only, success state → `/login`. Back to login works.

### Profile (new `app/profile`)
Per `1:315`/`1:265`: close (X) → back, avatar, full name, Contact Details card (email from
session, "Reset Password" label non-functional, Status = Free User / Pro User via `usePlan`).
FREE: "Upgrade" button → `/upgrade` + "Log Out" (real Supabase signOut).
PRO: "Return to Home Page" button + "Log Out"; tapping the Pro status row → `/subscription`.

### Upgrade (new `app/upgrade`)
Per `1:689`: "Upgrade your KIRA", "Want more from what you save?", 6-bullet feature list
(Enhancement, Verification, Brief BuilderAuto, Knowledge Gaps, Trend Alerts, Stale Content Flag),
coral CTA — handler stubbed with explicit `TODO: Stripe Checkout` hook.

### Subscription Details (new `app/subscription`)
Per `1:208`: "< Subscription Details", blue plan card ("Your plan / Monthly payment / $2"), detail
rows (Plan, Start Date, Next Renewal, Amount Paid), disclaimer, "Return Home" button, "Cancel
Subscription" link stubbed with `TODO: Stripe customer portal`. Static demo values until Stripe.

## 3. Out of scope

- Multi-shot chat visual design (frames `1:421`/`1:483`).
- Real account creation on Sign Up; Reset Password functionality.
- Stripe integration (stub hooks only); plan changes from within the app.
- Dify dataset re-push on summary edit (documented limitation).
- Orchestrator changes — none needed (`PATCH /items/{id}` already exists).

## 4. Risks

- **Figma asset/render URLs expire** — commit any needed SVGs/PNGs to the repo during build.
- **AWS creds/tunnel** needed only to live-verify chat/post/share with real data (resume checklist
  in memory: orchestrator + Nova + Cloudflare tunnel; `fuser -k 8000` kills the tunnel — use pkill).
- **Auth-gated app**: all new routes ride the existing middleware gating; `/signup` must be added
  to the public (unauthenticated) allowlist alongside `/login`.
- **Splash vs PWA share-target**: splash must NOT delay or break `/share` ingest — skip splash on
  `/share` routes.

## 5. Verification

- Branch `figma-reskin-v2` in `kira-pwa`; subagent-driven build (project playbook), code review per
  task; `npm run build` green per stage.
- Unit tests for new pure logic (e.g., splash session predicate, edit-save payload builder),
  consistent with repo precedent (`lib/*.test.ts`).
- Playwright local + live: splash → home (free + pro accounts), search → one-shot answer (85%
  width), Go Deeper free→/upgrade & pro→Exa, post edit → Save → reload persists, share →
  confirmation animation, login ↔ signup, profile free/pro → upgrade/subscription, Knowledge
  index/list/unclassified, bottom-nav label = "Knowledge" everywhere.
- Screenshot each screen vs the Figma renders; deploy to `kira-pwa-rho.vercel.app`; browser-verify
  live; merge + push (orch untouched).
