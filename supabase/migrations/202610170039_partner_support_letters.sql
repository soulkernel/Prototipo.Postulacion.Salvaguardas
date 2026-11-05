-- M05: stable partner IDs and individual support letters. No data migration or deletion.
create function private.is_partner_support_requirement(rules jsonb, kind text) returns boolean
language sql immutable set search_path='' as $$
 select kind in ('partner_letter','partner_letters','partner_support_letters')
 or exists(select 1 from jsonb_array_elements(coalesce(rules->'attachment_requirements','[]')) r
 where r->>'id'=kind and (trim(r->>'label_es') ~* '^(cartas? de apoyo de (las )?organizaciones asociadas|letters? of support from partner organizations)\.?$'
 or trim(r->>'label_en') ~* '^letters? of support from partner organizations\.?$'))
$$;
revoke all on function private.is_partner_support_requirement(jsonb,text) from public,anon,authenticated;

alter function private.validate_payload(jsonb,jsonb,boolean,integer) rename to validate_payload_before_partner_letters;
create function private.validate_payload(p jsonb,rules jsonb,complete boolean,stage integer) returns void
language plpgsql security definer set search_path='' as $$
declare rows jsonb:=p->'concept'->'partner_organizations'; row jsonb; ids text[]:='{}';
begin
 if rows is not null then
  if jsonb_typeof(rows) is distinct from 'array' then raise exception 'GLF_INVALID_PARTNERS'; end if;
  if jsonb_array_length(rows)>50 then raise exception 'GLF_INVALID_PARTNERS'; end if;
  for row in select value from jsonb_array_elements(rows) loop
   if jsonb_typeof(row) is distinct from 'object' or jsonb_typeof(row->'name') is distinct from 'string'
     or length(row->>'name')>200 or (row-'id'-'name')<>'{}'::jsonb
     or coalesce(row->>'id','') !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
     or lower(row->>'id')=any(ids) then raise exception 'GLF_INVALID_PARTNERS'; end if;
   ids:=array_append(ids,lower(row->>'id'));
   if complete and nullif(trim(row->>'name'),'') is null then raise exception 'GLF_REQUIRED:partners'; end if;
  end loop;
  if p->'concept' ? 'associated_organizations' and p->'concept'->'associated_organizations' is distinct from
    (select coalesce(jsonb_agg(r->'name' order by n),'[]') from jsonb_array_elements(rows) with ordinality t(r,n))
  then raise exception 'GLF_INVALID_PARTNERS'; end if;
 end if;
 if complete and rows is null and p->'concept' ? 'associated_organizations' and exists(select 1 from jsonb_array_elements(p->'concept'->'associated_organizations') n where jsonb_typeof(n) is distinct from 'string' or nullif(trim(n#>>'{}'),'') is null) then raise exception 'GLF_REQUIRED:partners'; end if;
 perform private.validate_payload_before_partner_letters(p,rules,complete,stage);
end $$;
revoke all on function private.validate_payload(jsonb,jsonb,boolean,integer),private.validate_payload_before_partner_letters(jsonb,jsonb,boolean,integer) from public,anon,authenticated;

create function private.validate_partner_letters(a public.applications) returns void
language plpgsql security definer set search_path='' as $$
declare p jsonb; key text;
begin
 if a.payload->'concept'->'partner_organizations' is null then
  if (a.payload->'concept' ? 'associated_organizations' and exists(select 1 from jsonb_array_elements_text(a.payload->'concept'->'associated_organizations') n where nullif(trim(n),'') is not null))
   or (not(a.payload->'concept' ? 'associated_organizations') and nullif(trim(a.payload->'concept'->>'partners'),'') is not null)
  then raise exception 'GLF_PARTNER_LINK_REQUIRED'; end if;
  return;
 end if;
 for p in select value from jsonb_array_elements(a.payload->'concept'->'partner_organizations') loop
  if nullif(trim(p->>'name'),'') is null then continue; end if;
  key:=replace(lower(p->>'id'),'-','');
  if not exists(select 1 from public.application_documents d join storage.objects o on o.bucket_id='application-files' and o.name=d.storage_path
   where d.application_id=a.id and d.kind='partner_letter_'||key and d.size_bytes>0 and d.size_bytes<=4194304
    and (o.metadata->>'size')::bigint=d.size_bytes)
  then raise exception 'GLF_PARTNER_LETTER_REQUIRED:%',key; end if;
 end loop;
end $$;
revoke all on function private.validate_partner_letters(public.applications) from public,anon,authenticated;

-- Validate only new letter registrations. Existing orphaned/legacy documents remain private and intact.
create function private.check_partner_letter_upload() returns trigger
language plpgsql security definer set search_path='' as $$
declare a public.applications;
begin
 if left(new.kind,15)='partner_letter_' then
  select * into a from public.applications where id=new.application_id for update;
  if new.kind !~ '^partner_letter_[a-f0-9]{32}$' or not exists(select 1 from jsonb_array_elements(coalesce(a.payload->'concept'->'partner_organizations','[]')) p
    where 'partner_letter_'||replace(lower(p->>'id'),'-','')=new.kind and nullif(trim(p->>'name'),'') is not null)
  then raise exception 'GLF_PARTNER_LINK_REQUIRED'; end if;
  if new.size_bytes<=0 or new.size_bytes>4194304 then raise exception 'GLF_INVALID_DOCUMENT'; end if;
 end if;
 return new;
end $$;
revoke all on function private.check_partner_letter_upload() from public,anon,authenticated;
create trigger check_partner_letter_upload before insert on public.application_documents for each row execute function private.check_partner_letter_upload();

create or replace function public.submit_application_core(application_id uuid, expected_revision integer) returns integer language plpgsql security definer set search_path='' as $$
declare a public.applications; c public.calls; required text; field jsonb;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=application_id for update;
 if not found or not private.can_edit_application(a.id) then raise exception 'GLF_APPLICATION_LOCKED' using errcode='42501'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT' using errcode='40001'; end if;
 perform private.validate_payload(a.payload,a.rules_snapshot,true,a.stage);
 perform private.validate_partner_letters(a);
 select * into c from public.calls where id=a.call_id;
 for required in select jsonb_array_elements_text(coalesce(a.rules_snapshot->'required_attachments','[]')) loop
  if private.is_partner_support_requirement(a.rules_snapshot,required) then continue; end if;
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
