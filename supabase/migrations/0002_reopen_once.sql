-- ============================================================
-- One-time reopen support for closed conversations
-- ============================================================

alter table conversations
  add column has_been_reopened boolean not null default false;

comment on column conversations.has_been_reopened is
  'Set true the first time a member reopens this conversation. Once true, '
  'it can never be reopened again — the member must start a new conversation.';

-- No RLS changes needed: all writes to this column go through the
-- member-reopen API route using the service-role client, same as every
-- other write in this app.