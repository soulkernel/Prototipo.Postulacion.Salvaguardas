-- Restore the restricted core dependency when a deployment replaced the wrapper without migration 008.
create or replace function public.submit_application_core(application_id uuid, expected_revision integer) returns integer language plpgsql security definer set search_path='' as $$
declare a public.applications; c public.calls; required text; field jsonb;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=application_id for update;
 if not found or not private.can_edit_application(a.id) then raise exception 'GLF_APPLICATION_LOCKED' using errcode='42501'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT' using errcode='40001'; end if;
 perform private.validate_payload(a.payload,a.rules_snapshot,true,a.stage);
 select * into c from public.calls where id=a.call_id;
 for required in select jsonb_array_elements_text(coalesce(a.rules_snapshot->'required_attachments','[]')) loop
  if not exists(select 1 from public.application_documents where public.application_documents.application_id=a.id and kind=required) then raise exception 'GLF_ATTACHMENT_REQUIRED:%',required; end if;
 end loop;
 if a.stage=2 then
  if jsonb_array_length(c.phase2_schema)=0 then raise exception 'GLF_PHASE2_NOT_CONFIGURED'; end if;
  for field in select value from jsonb_array_elements(c.phase2_schema) loop
   if (field->>'required')::boolean and nullif(trim(a.payload->'phase2'->>(field->>'id')),'') is null then raise exception 'GLF_PHASE2_REQUIRED:%',field->>'id'; end if;
  end loop;
 end if;
 update public.applications set status=case when stage=1 then 'submitted'::public.application_status else 'phase2_submitted'::public.application_status end,
 revision=revision+1,submitted_at=coalesce(submitted_at,now()),phase2_submitted_at=case when stage=2 then now() else phase2_submitted_at end,
 correction_deadline=null,updated_at=now() where id=a.id;
 insert into public.application_versions(application_id,revision,stage,payload,rules_snapshot,actor_id) values(a.id,a.revision+1,a.stage,a.payload||jsonb_build_object('attachments',(select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'file_name',d.file_name,'kind',d.kind,'sha256',d.sha256)),'[]') from public.application_documents d where d.application_id=a.id)),a.rules_snapshot,auth.uid());
 insert into public.application_events(application_id,actor_id,event_type,detail) values(a.id,auth.uid(),'submitted',jsonb_build_object('revision',a.revision+1,'stage',a.stage));
 return a.revision+1;
end $$;
revoke all on function public.submit_application_core(uuid,integer) from public,anon,authenticated;
