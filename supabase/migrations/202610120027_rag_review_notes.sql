-- Supporting evidence is internal and never changes a risk rating or formal decision.
create table public.rag_review_notes (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references public.applications(id),
 revision integer not null,
 risk_id uuid not null,
 method text not null check(method in ('e5','qwen')),
 query text not null check(length(query) between 3 and 1500),
 evidence jsonb not null check(jsonb_typeof(evidence)='object' and length(evidence::text)<=150000),
 observation text not null check(length(trim(observation)) between 1 and 5000),
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now()
);
create index rag_review_notes_application on public.rag_review_notes(application_id,created_at desc);
alter table public.rag_review_notes enable row level security;
revoke all on public.rag_review_notes from public,anon,authenticated;
grant select,insert on public.rag_review_notes to authenticated;
create policy rag_notes_read on public.rag_review_notes for select to authenticated
 using (private.current_role() in ('sustainability_reviewer','administrator') and private.can_read_application(application_id));
create policy rag_notes_insert on public.rag_review_notes for insert to authenticated
 with check (created_by=auth.uid() and private.current_role() in ('sustainability_reviewer','administrator')
 and exists(select 1 from public.application_versions v where v.application_id=rag_review_notes.application_id
 and v.revision=rag_review_notes.revision and exists (
 select 1 from jsonb_array_elements(v.payload->'activities') a,
 jsonb_array_elements(a->'risks') r where r->>'id'=rag_review_notes.risk_id::text)));
