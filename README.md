# KIRA — Your saves, finally useful.

*SuperAI Singapore 2026 · NEXT Hackathon · built in a 36-hour sprint*

You save dozens of Instagram reels and posts — recipes, negotiation tips, travel ideas — and never look at them again. **KIRA is the reuse layer for your saved content.** Share a reel or post to KIRA and it watches, listens, and reads it for you — transcribing audio, understanding visuals with a vision model, summarizing and auto-tagging — then pools everything into a personal, searchable second brain you can actually talk to, with cited answers.

Tools like Recall help you *remember*. **KIRA helps you apply.**

## 🔗 Live demo (for judges)

**App:** https://kira-pwa-rho.vercel.app

| Account | Email | Password | What you'll see |
|---|---|---|---|
| Free | `free@kira.demo` | `kira-demo-2026` | Paywall on KIRA Chat, in-app Stripe upgrade flow |
| Pro | `pro@kira.demo` | `kira-demo-2026` | Full chat with citations + "Go deeper" web answers |

*Demo-only seeded accounts on an isolated Supabase project — nothing real behind them.*

**Suggested 2-minute tour:**
1. Log in as **Pro** → the home screen shows **theme bubbles** (interests KIRA discovered from the saved library, sized by volume).
2. Tap a bubble or open **Chat** → ask something like *"what did I save about Hong Kong?"* → answer cites the exact reels/posts it came from, with thumbnails.
3. Tap **Go deeper →** — KIRA extends the answer beyond the library with fresh web sources via Exa, clearly separated as "FROM THE WEB".
4. Log in as **Free** → open Chat → hit the paywall → run the **Stripe upgrade** (test mode: card `4242 4242 4242 4242`, any future expiry, any CVC) → chat unlocks as PRO.
5. On Android, install the PWA — KIRA registers as a **share target** and appears directly in Instagram's share sheet (save in 3 taps, no native app).

## How it works

```
Instagram share sheet ──► KIRA PWA (Next.js, Vercel)
                              │  authenticated API routes (Supabase session)
                              ▼  secret-protected proxy
                          KIRA Orchestrator (FastAPI, this repo's sibling)
                              │
        ┌──────────┬──────────┼───────────┬──────────┐
        ▼          ▼          ▼           ▼          ▼
      Apify    AWS Transcribe  AWS Bedrock  Dify RAG   Exa
   (IG fetch)  (reel audio)   (vision +    (knowledge  ("go deeper"
                               summaries)   base)       web search)
                              │
                              ▼
                        AWS S3 (media + thumbnails)
```

| Layer | Tech |
|---|---|
| **Frontend** | Next.js (App Router) PWA on **Vercel** — Web Share Target API, theme bubbles, library, KIRA Chat, hi-fi Figma design system |
| **AI orchestration** | **Dify** — RAG knowledge base over every save |
| **AI muscle** | **AWS** — S3, Transcribe, Bedrock (multimodal vision summaries, structured JSON extraction) |
| **Web discovery** | **Exa** — personalized "go deeper" results blended into cited answers |
| **Auth & plans** | **Supabase** — accounts, Free/Pro gating (server-side, RLS) |
| **Payments** | **Stripe** — $2/mo Pro plan: checkout, customer portal, webhook-driven downgrade on cancel |

**Sibling repo:** [kira-orchestrator](https://github.com/alcunii/kira-orchestrator) — the FastAPI ingestion/chat brain.

## Repo map

```
app/              App Router pages (home, chat, library, login/signup, profile, upgrade, subscription)
app/api/          Server routes — Supabase-session-checked, proxy to orchestrator with a shared secret
app/api/stripe/   checkout / confirm / portal / subscription / webhook (signature-verified)
components/       UI — theme bubbles, answer renderer with citations, cards, paywall
lib/              Supabase clients (browser/server/admin), billing, markdown parsing, plan hooks
supabase/         schema.sql — profiles table + RLS policies
scripts/          seed-auth.mjs, reset-demo.mjs (re-arm the demo), setup-stripe.mjs
```

## Running locally

```bash
npm install
touch .env.local      # fill in the env vars listed below
npm run dev           # http://localhost:3000
npm test              # vitest unit suite
```

Required env (all values via environment — no secrets in code):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `ORCHESTRATOR_URL`, `INGEST_SECRET` (shared with orchestrator), `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, `SEED_PASSWORD` (seed script only).

## Security notes (for the curious judge)

- No secrets in source or git history; `.env*` gitignored. The Stripe-looking key in `lib/webhookSignature.test.ts` is a deliberately fake offline-test string.
- Every API route verifies the Supabase session server-side with `getUser()` (not `getSession()`); the service-role key never leaves server-only modules.
- Stripe webhooks are raw-body signature-verified (`constructEvent`), with unit tests for tampered and stale signatures; plan and price are decided server-side, and session confirmation checks `client_reference_id` against the logged-in user to prevent replay.
- Orchestrator calls are gated by a shared `x-ingest-secret` header end-to-end.
- Known hackathon trade-offs (documented, not hidden): no rate limiting yet, demo credentials intentionally published above.

## Why it's hard (and what we solved in 36 hours)

- **Into Instagram's share sheet without a native app** — installed PWA + Web Share Target API.
- **True multimodal ingestion** — one pipeline for talking-head reels (audio), aesthetic image posts (vision), and carousels (multi-image), normalized into one knowledge base.
- **Answers you can trust** — every answer cites the specific saves it drew from, and clearly separates "from your library" vs "from the web".
- **A real product, not a demo hack** — auth, plans, a working paywall, polished design system, markdown answers, installable icon — all shipped in the sprint.

## What's next

iOS share extension, connections between saves and proactive resurfacing on top of the knowledge graph, and a deeper Exa-powered research mode.

---

**KIRA: the place your saves go to thrive, not die.**
