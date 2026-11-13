-- Defense in depth: role audit is only written by owner-executed workflow functions.
alter table private.role_events enable row level security;
revoke all on table private.role_events from public, anon, authenticated;
