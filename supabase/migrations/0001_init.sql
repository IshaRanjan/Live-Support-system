-- ============================================================
-- Live Support System — initial schema (Member Support only)
-- Visitor Support is designed for, not implemented, so this schema
-- takes no changes when that flow is added later.
-- ============================================================

-- ---------- Enums ----------
create type conversation_type as enum ('member_support', 'visitor_support');
create type conversation_status as enum ('active', 'closed', 'archived');
create type sender_role as enum ('member', 'visitor', 'agent');

-- ---------- Support agents ----------
-- Only one agent today (env-var login), but this table exists so
-- multi-agent support (assignment, presence, etc.) doesn't need a migration later.
create table support_agents (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text,
  created_at timestamptz not null default now()
);

-- ---------- Conversations ----------
create table conversations (
  id uuid primary key default gen_random_uuid(),
  type conversation_type not null default 'member_support',
  status conversation_status not null default 'active',

  -- Member fields (used now — member_id is a mock id for the demo)
  member_id text,
  member_name text,
  member_email text,

  -- Visitor fields (nullable, unused until visitor_support ships)
  visitor_name text,
  visitor_email text,
  visitor_session_id text,

  -- Future-proofing for multi-agent assignment
  assigned_agent_id uuid references support_agents(id) on delete set null,

  subject text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,     -- set when status -> closed; drives the 72h purge
  archived_at timestamptz    -- set when status -> archived; exempts from purge
);

create index idx_conversations_status on conversations (status);
create index idx_conversations_type on conversations (type);
create index idx_conversations_member on conversations (member_id);
create index idx_conversations_created on conversations (created_at desc);
-- speeds up the purge job's WHERE clause
create index idx_conversations_purge on conversations (closed_at) where status = 'closed';
-- simple search across name/email/subject
create index idx_conversations_search on conversations
  using gin (to_tsvector('english', coalesce(member_name,'') || ' ' || coalesce(member_email,'') || ' ' || coalesce(subject,'')));

-- ---------- Messages ----------
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_role sender_role not null,
  sender_id text,             -- member_id or agent id; null for anonymous visitors
  sender_name text,
  body text not null,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on messages (conversation_id, created_at);

-- ---------- updated_at trigger ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_conversations_updated_at
  before update on conversations
  for each row execute function set_updated_at();

-- ---------- Automatic purge ----------
-- Deletes conversations that have been CLOSED (not archived) for over 72 hours.
-- Messages cascade-delete automatically via the FK above.
create or replace function purge_expired_conversations()
returns void as $$
begin
  delete from conversations
  where status = 'closed'
    and closed_at is not null
    and closed_at < now() - interval '72 hours';
end;
$$ language plpgsql;

-- Called by /api/cron/purge-conversations on a schedule — see README.
-- (Alternative: enable pg_cron in the Supabase dashboard and run
--   select cron.schedule('purge-conversations', '0 * * * *', 'select purge_expired_conversations()');
-- to run it inside Postgres instead of via an external scheduler.)

-- ---------- Realtime ----------
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;

-- ---------- Row Level Security ----------
alter table conversations enable row level security;
alter table messages enable row level security;
alter table support_agents enable row level security;

-- IMPORTANT — read this before going to production:
-- This demo has no real member authentication (per the spec, `isMember` is a
-- mock boolean), so there is no Supabase Auth JWT to scope rows by member.
-- All writes go through server-side API routes using the SERVICE ROLE key,
-- which bypasses RLS entirely — that's what keeps things secure for now.
--
-- The policies below only grant SELECT to the anon/authenticated roles, and
-- ONLY so the browser can subscribe to Realtime changes. When you wire up
-- real member auth, tighten these to filter by auth.uid() / member_id so a
-- member can only read their own conversation's rows.

create policy "Allow read for realtime (tighten when member auth ships)"
  on conversations for select
  using (true);

create policy "Allow read for realtime (tighten when member auth ships)"
  on messages for select
  using (true);

-- No insert/update/delete policies are created — all writes happen via the
-- service role in API routes, which bypasses RLS by design.
