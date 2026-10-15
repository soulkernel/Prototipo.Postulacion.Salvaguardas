-- TRUNCATE is not controlled by row-level security. Browser roles need SELECT only.
revoke all on table public.prepared_documents from public, anon, authenticated;
grant select on table public.prepared_documents to authenticated;
