-- Apply the preparation check to every submission, including reopened applications.
alter function public.submit_application(uuid,integer) rename to submit_application_core;
revoke all on function public.submit_application_core(uuid,integer) from public,anon,authenticated;
create function public.submit_application(application_id uuid, expected_revision integer) returns integer
language plpgsql security definer set search_path='' as $$
declare a public.applications; prepared public.prepared_documents;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=application_id for update;
 if not found or not private.can_edit_application(a.id) then raise exception 'GLF_APPLICATION_LOCKED'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT'; end if;
 if a.stage=1 then
  select * into prepared from public.prepared_documents p where p.application_id=a.id and p.revision=a.revision and p.payload=a.payload;
  if not found then raise exception 'GLF_PREPARE_DOCUMENTS_REQUIRED'; end if;
  if not exists(select 1 from public.application_documents d where d.application_id=a.id and d.kind='concept_signed' and d.content_type='application/pdf' and d.created_at>=prepared.created_at)
  then raise exception 'GLF_SIGNED_CONCEPT_REQUIRED'; end if;
 end if;
 return public.submit_application_core(application_id,expected_revision);
end $$;
revoke all on function public.submit_application(uuid,integer) from public,anon;
grant execute on function public.submit_application(uuid,integer) to authenticated;
