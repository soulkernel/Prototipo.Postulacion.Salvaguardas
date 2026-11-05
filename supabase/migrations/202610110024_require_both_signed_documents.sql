-- Phase 1 requires both PDFs. This checks presence/version, not cryptographic signature validity.
create or replace function public.submit_application(application_id uuid, expected_revision integer) returns integer
language plpgsql security definer set search_path='' as $$
declare a public.applications; prepared public.prepared_documents;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=application_id for update;
 if not found or not private.can_edit_application(a.id) then raise exception 'GLF_APPLICATION_LOCKED'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT'; end if;
 if a.stage=1 then
  select * into prepared from public.prepared_documents p where p.application_id=a.id and p.revision=a.revision and p.stage=a.stage and p.payload=a.payload;
  if not found then raise exception 'GLF_PREPARE_DOCUMENTS_REQUIRED'; end if;
  if not exists(select 1 from public.application_documents d where d.application_id=a.id and d.kind='concept_signed' and d.content_type='application/pdf' and d.created_at>=prepared.created_at)
  then raise exception 'GLF_SIGNED_CONCEPT_REQUIRED'; end if;
  if not exists(select 1 from public.application_documents d where d.application_id=a.id and d.kind='matrix_signed' and d.content_type='application/pdf' and d.created_at>=prepared.created_at)
  then raise exception 'GLF_SIGNED_MATRIX_REQUIRED'; end if;
 end if;
 return public.submit_application_core(application_id,expected_revision);
end $$;
revoke all on function public.submit_application(uuid,integer) from public,anon;
grant execute on function public.submit_application(uuid,integer) to authenticated;

create function private.validate_signed_document_upload() returns trigger
language plpgsql security definer set search_path='' as $$
declare a public.applications;
begin
 if new.kind in ('concept_signed','matrix_signed') then
  if new.content_type<>'application/pdf' then raise exception 'GLF_SIGNED_DOCUMENT_PDF_REQUIRED'; end if;
  select * into a from public.applications where id=new.application_id for update;
  if a.stage=1 and not exists(select 1 from public.prepared_documents p where p.application_id=a.id and p.revision=a.revision and p.stage=a.stage and p.payload=a.payload)
  then raise exception 'GLF_PREPARE_DOCUMENTS_REQUIRED'; end if;
 end if;
 return new;
end $$;
revoke all on function private.validate_signed_document_upload() from public,anon,authenticated;
create trigger validate_signed_document_upload before insert on public.application_documents
for each row execute function private.validate_signed_document_upload();
