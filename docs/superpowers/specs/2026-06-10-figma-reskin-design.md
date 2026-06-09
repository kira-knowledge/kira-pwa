# KIRA PWA — Figma Re-skin Design (Angelina's Hi-Fi Screens)

**Date:** 2026-06-10
**Scope:** Re-skin Home, History, Categories index, and Category list to match Angelina's Figma
("KIRA Hackathon" file, canvas `21:1931` "Hi-Fi Screens", frames `33:2638` Home, `33:2721` History,
`33:2859` Category Index, `33:2930` Category List), plus a colors-only light pass on chat/share/post.
**Approach:** Token layer + per-screen CSS modules (Approach A, user-approved). Presentation only —
zero changes to data fetching, share-target, chat, history, or API logic.

## Locked decisions

1. **Light pass on all screens** — the 4 target screens get the full Figma treatment; chat, share,
   and post detail get a colors-only pass (no layout changes) so navigation doesn't flash dark→light.
2. **Home "Recent searches" → "Recent saves"**: shows the 3 most recent saved reels from
   `/api/library` (tap → `/post/[id]`). **History keeps past chat questions** from `lib/chatHistory`
   (tap → reopen chat).
3. **ThemeBubbles is retired from Home.** The Categories pill row renders the same `/api/themes`
   data the bubbles did — same information, new presentation. The `ThemeBubbles.tsx` component stops
   being rendered (file removed as dead code in cleanup).
4. **Profile icon in the top bar is decorative (no-op)** — the app has no accounts.
5. **Greeting is "Hi there!"** — no user name exists to substitute for "Hi First Name!".
6. **Suggested prompt is static** ("Build me a 3-day Tokyo itinerary from my saved reels"); tap
   submits it to `/chat?q=…`.

## 1. Design tokens & global theme

New `app/globals.css`, imported by `app/layout.tsx`:

- **Background:** `linear-gradient(180deg, #f9f9f9 45%, #0e3057 100%)`, fixed, full viewport.
  (The Figma frames' "image 3" background is this gradient; recreated in CSS — no image asset.)
- **Colors:** ink `#1a1a1d`; muted `#747680`; heading navy `#0e3057`; logo navy `#052d47`;
  accent `#4a7fa5`; border `#d9dee5`; card `#ffffff`; pill `#fefdfc`;
  nav bar `rgba(251,252,253,0.8)` with `backdrop-filter: blur(7px)`.
- **Typography:** DM Sans via `next/font/google` applied to `<body>`. Section headings 22px/medium
  navy; card titles 15px/medium; body 16px; metadata 12px muted; fine print 9px.
- **Shape:** cards `border-radius: 10px`, border `#d9dee5`, padding `12px 15px`; pills
  `border-radius: 25px`, padding `5px 20px`; nav bar height 81px with soft shadow.
- `layout.tsx`: remove the inline dark body style (`#0b0b0f`), apply token classes;
  update `viewport.themeColor` to match the light theme.

## 2. Shared components

| Component | Status | Behavior |
|---|---|---|
| `TopBar` | new | "K" navy square (38×37, radius 10) left; profile SVG icon right (decorative). On every re-skinned screen. |
| `Pill` | new | Category pill. Tap → `/category/[name]`. Trailing "More..." pill → `/categories`. |
| `SearchBox` | new | Placeholder text + round search icon; submit → `router.push('/chat?q=…')` (identical to today's askBar behavior). History variant uses the filled navy style with "Looking for something new?". |
| `BottomNav` | restyle in place | Same props (`active` tab) and routes. Emoji icons → Figma SVG icons (committed to the repo — Figma asset URLs expire in 7 days). Frosted bar fixed to bottom. `post/[id]` keeps using it unchanged. |
| `InstallPrompt` | restyle | Kept (demo-critical for share-target); becomes a light card. |
| `PostCard` | restyle | New card style: title, summary, #tag chips, "Instagram • {author}" + "Source ↗" (`source_url`). Card tap → `/post/[id]`. |

## 3. Per-screen mapping (presentation only)

### Home (`app/page.tsx`, frame 33:2638)
Order: TopBar → "Hi there!" → SearchBox → Suggested-prompt card → "Categories" pills →
"Recent saves" cards → BottomNav.
- Pills: first 7 themes from `/api/themes` + "More...". Empty state: keep current
  "save a few more reels" messaging as a muted caption.
- Recent saves: first 3 items from `/api/library`; subtitle "Instagram • {author}";
  date line "Saved today / Saved yesterday / Saved {date}" in accent color.
- Existing 5s polling, theme reload, and error/empty/loading states all survive, restyled.
- `ThemeBubbles` render removed; "Refresh" header button removed (polling already auto-refreshes).

### History (`app/history/page.tsx`, frame 33:2721)
Order: TopBar → "Your recent searches" cards → fine-print note ("Only the 10 most recent searches
are saved." — wording adjusted if `lib/chatHistory`'s actual cap differs) → navy SearchBox
("Looking for something new?") → "Explore other categories" pills → BottomNav.
- Cards = `loadHistory()` records: question as title, "Saved {relative date}" line.
  The Figma's "Instagram • Creator Handle" subtitle is dropped (doesn't apply to chats).
- Tap → `/chat?history={id}` (unchanged).

### Categories (`app/categories/page.tsx`, frame 33:2859)
Order: TopBar → "Categories" heading → rows (name 15px, `why` tagline 12px muted, count right,
navy) → BottomNav. Tap row → `/category/[name]`. Empty/not-ready states unchanged, restyled.

### Category list (`app/category/[name]/page.tsx`, frame 33:2930)
Order: TopBar → heading = category name → restyled `PostCard`s → "Explore other categories"
pills → BottomNav. Same fetch + `filterByCategory`; stale-category notice survives.

### CSS file split
`app/page.module.css` is split into `home.module.css`, `history.module.css`,
`categories.module.css`, `category.module.css`, plus `shared.module.css` (card, section heading,
list layouts). Each screen imports only its own module + shared. `page.module.css` is deleted at
the end. This removes the current blast radius where one shared file styles four screens.

## 4. Light pass on chat / share / post

`chat.module.css`, `share.module.css`, `post.module.css`: replace dark backgrounds/text/card/button
colors with the new tokens. DM Sans is inherited from body. No markup or layout changes; citation
rendering, "FROM THE WEB" section, and share flow untouched.

## 5. Error handling & empty states

All existing states survive with new styling: library error banner (home), "Your library is empty"
(home), "No conversations yet" (history), "No categories yet" / "Save a few more reels…"
(categories), stale-category notice (category list), all loading captions.

## 6. Out of scope / not touched

- `/api` routes, `lib/` (chatHistory, categoryFilter), service worker and manifest internals
  (only `theme_color` updated), share-target registration, orchestrator backend.
- No new screens (no profile page), no auth, no changes to chat behavior.

## 7. Risks

- **post/[id] nav mismatch mid-branch:** the restyled BottomNav appears on post detail before its
  colors-only pass — both land in the same branch before deploy, so users never see the mismatch.
- **DM Sans via `next/font`** requires network at build time; fallback is a self-hosted woff2 in
  `/public` with `@font-face`.
- **Figma SVG asset URLs expire in 7 days** — icons are downloaded and committed during
  implementation, not referenced remotely.

## 8. Verification

- Branch: `figma-reskin` in `kira-pwa`; one commit per screen/stage.
- Per stage: `npm run build` green, then Playwright against local dev: home → pill → category →
  post → back; search → chat answer; history → reopen chat; share flow → home.
- Screenshot each re-skinned screen and compare against the Figma frames.
- Deploy to Vercel (existing CLI flow) only after all stages verify locally; browser-verify live.
- No unit-test infra exists in this repo; per project precedent (iterations 1–5), verification is
  build + browser-based.
