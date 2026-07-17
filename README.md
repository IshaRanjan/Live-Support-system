# Live Support System

A standalone Next.js app for Member Support live chat — a member starts a
conversation from their dashboard (or, here, from `/dashboard/support`), a
support agent replies in real time from `/support/dashboard`.

This runs independently of your main application. It's designed so you can
later mount `MemberSupportChat` inside your real Member Dashboard with
minimal changes — see "Integrating into your main app" at the bottom.

Visitor Support (public-website chat) is **not** implemented, but the schema
is designed so adding it later requires no migration — see "What's already
future-proofed for Visitor Support" below.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + Realtime), accessed via `@supabase/ssr` and
  `@supabase/supabase-js`
- No Supabase Auth — the single support agent logs in with env-var
  credentials via a signed HTTP-only cookie session (per spec)

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

If you don't have one already: [supabase.com](https://supabase.com) → New
Project. Once it's ready, go to **Project Settings → API** and grab:

- Project URL
- `anon` public key
- `service_role` secret key (click "Reveal")

## 3. Set environment variables

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server-only, never exposed to the client

SUPPORT_AGENT_USERNAME=agent
SUPPORT_AGENT_PASSWORD=pick-something-real

SUPPORT_SESSION_SECRET=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 32)
```

## 4. Run the database migration

Easiest path — paste `supabase/migrations/0001_init.sql` into the Supabase
dashboard's **SQL Editor** and run it.

Or, with the Supabase CLI linked to your project:

```bash
supabase db push
```

This creates `conversations`, `messages`, and `support_agents`, enables
Realtime on the first two, and sets up RLS. **Read the comment block above
the RLS policies in that file** — it explains a deliberate tradeoff (broad
read access so Realtime works without real member auth yet) and what to
tighten once real membership is wired in.

## 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it links to both entry
points:

- **Member view** (`/dashboard/support`) — start or continue a Live Support
  chat as the mock member.
- **Support console** (`/support/login`) — sign in with the
  `SUPPORT_AGENT_USERNAME` / `SUPPORT_AGENT_PASSWORD` you set, then manage
  conversations from `/support/dashboard`.

Open both in separate windows — messages appear on each side instantly via
Supabase Realtime, no refresh needed.

## 6. Automatic purging (72h)

Closed (not archived) conversations should auto-delete 72 hours after
closing. The database function `purge_expired_conversations()` does the
deletion; something needs to call it on a schedule. Options, easiest first:

**Option A — Supabase `pg_cron` (runs inside Postgres, no external infra):**
Enable the `pg_cron` extension in the Supabase dashboard (Database →
Extensions), then run:

```sql
select cron.schedule(
  'purge-conversations',
  '0 * * * *', -- hourly
  'select purge_expired_conversations()'
);
```

**Option B — hit the API route on a schedule** (e.g. Vercel Cron once you
deploy there, a GitHub Actions scheduled workflow, or any external cron
service):

```
GET /api/cron/purge-conversations
Authorization: Bearer <CRON_SECRET>
```

If deploying to Vercel, add a `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/purge-conversations", "schedule": "0 * * * *" }]
}
```

## Project structure

```
app/
  page.tsx                          Landing page linking to both entry points
  dashboard/support/page.tsx        Member-facing chat (stand-in for your real dashboard)
  support/login/page.tsx            Agent login
  support/dashboard/                Agent console (layout.tsx guards the route)
  api/
    support/                        Agent-side endpoints (login, logout, conversations, messages)
    member/support/                 Member-side endpoints (create/list conversations, messages)
    cron/purge-conversations/       Scheduled purge endpoint
components/support/
  dashboard/                        Sidebar, ConversationList, ChatWindow, MemberInfoPanel, etc.
  member/                           MemberSupportChat widget
lib/
  supabase/                         client.ts (browser), server.ts (SSR), service.ts (service-role)
  support/                          mock-member.ts, agent-session.ts, realtime hooks
types/
  database.ts                      Hand-written Supabase schema types
  support.ts                       Domain types (Conversation, Message, etc.)
supabase/migrations/0001_init.sql   Full schema
middleware.ts                       Fast-redirect for unauthenticated dashboard access
```

## Security model

- **Agent auth**: `SUPPORT_AGENT_USERNAME`/`PASSWORD` checked against env
  vars on login, then a signed (HMAC-SHA256), HTTP-only cookie is set. No
  Supabase Auth involved for the agent.
- `middleware.ts` does a quick cookie-presence check for a fast redirect,
  but the real check — signature + expiry — happens server-side in
  `app/support/dashboard/layout.tsx`, since HMAC verification needs Node's
  `crypto` module, which isn't available in the Edge runtime middleware
  runs in by default.
- **All database writes** go through API routes using the Supabase
  **service-role key**, which bypasses Row Level Security. This is what
  keeps things secure without real member authentication yet.
- **RLS on `conversations`/`messages`** currently allows `SELECT` for
  everyone — that's what lets the browser subscribe to Realtime without a
  Supabase Auth session. A determined user could technically read other
  conversations' rows over Realtime today. This is called out again at the
  bottom of `supabase/migrations/0001_init.sql`; tighten it once real member
  auth exists.

## What's already future-proofed for Visitor Support

- `conversations.type` is an enum (`member_support` / `visitor_support`) —
  no migration needed to add visitor rows.
- `conversations` has nullable `visitor_name`, `visitor_email`,
  `visitor_session_id` columns sitting unused until that flow is built.
- `MemberInfoPanel` already branches on `conversation.type` to show visitor
  vs. member fields.
- `assigned_agent_id` exists now even with one agent, so multi-agent
  assignment later doesn't need a schema change either.

## Integrating into your main app

When you're ready to move this into your Member Dashboard:

1. Copy `components/support/`, `lib/support/`, `lib/supabase/`,
   `types/`, `app/api/support/`, `app/api/member/support/`,
   `app/api/cron/`, `app/support/`, `middleware.ts`, and
   `supabase/migrations/0001_init.sql` into your main project.
2. If your main app already has Supabase clients set up, you likely only
   need `lib/supabase/service.ts` from here (and can skip/merge
   `client.ts`/`server.ts`).
3. Mount `<MemberSupportChat isMember={isMember} />` wherever it belongs in
   your real Member Dashboard, swapping `lib/support/mock-member.ts` for
   your real purchase/session-booking check.
4. Delete `app/dashboard/support/page.tsx` and `app/page.tsx` — those only
   exist as demo entry points for running this standalone.
