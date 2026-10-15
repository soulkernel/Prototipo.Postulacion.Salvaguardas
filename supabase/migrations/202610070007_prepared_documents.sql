-- Immutable documents prepared before signing; kept separate from submissions/reports.
create table public.prepared_documents (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references public.applications(id),
 revision integer not null, stage integer not null, payload jsonb not null,
 created_at timestamptz not null default now(),
 unique(application_id, revision)
);
alter table public.prepared_documents enable row level security;
grant select on public.prepared_documents to authenticated;
create policy prepared_visible on public.prepared_documents for select to authenticated
using(private.can_read_application(application_id));
create function public.prepare_application_documents(app_id uuid, expected_revision integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare a public.applications; result uuid;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=app_id for update;
 if not found or not private.can_edit_application(a.id) then raise exception 'GLF_APPLICATION_LOCKED'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT'; end if;
 perform private.validate_payload(a.payload,a.rules_snapshot,true,a.stage);
 insert into public.prepared_documents(application_id,revision,stage,payload)
 values(a.id,a.revision,a.stage,a.payload) on conflict(application_id,revision) do nothing;
 select id into result from public.prepared_documents where application_id=a.id and revision=a.revision;
 return result;
end $$;
revoke all on function public.prepare_application_documents(uuid,integer) from public,anon;
grant execute on function public.prepare_application_documents(uuid,integer) to authenticated;
create function private.require_signed_concept() returns trigger
language plpgsql security definer set search_path='' as $$
declare prepared public.prepared_documents;
begin
 if new.status='submitted' and old.status is distinct from new.status and new.stage=1 then
  select * into prepared from public.prepared_documents where application_id=old.id and revision=old.revision and payload=old.payload;
  if not found then raise exception 'GLF_PREPARE_DOCUMENTS_REQUIRED'; end if;
  if not exists(select 1 from public.application_documents where application_id=old.id
    and kind='concept_signed' and content_type='application/pdf' and created_at>=prepared.created_at)
  then raise exception 'GLF_SIGNED_CONCEPT_REQUIRED'; end if;
 end if;
 return new;
end $$;
revoke all on function private.require_signed_concept() from public,anon,authenticated;
create trigger require_signed_concept before update on public.applications for each row execute function private.require_signed_concept();
