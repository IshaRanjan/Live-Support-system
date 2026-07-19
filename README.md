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

## The entrypoints

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

**Supabase `pg_cron` (runs inside Postgres, no external infra)**

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
