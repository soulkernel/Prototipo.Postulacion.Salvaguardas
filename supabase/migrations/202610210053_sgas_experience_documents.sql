-- Additive SGAS questionnaire and generated attachments. Existing records are not rewritten.
alter table public.application_documents add column generation_source jsonb,
 add column generated_source_hash text, add column generated_locale text;
create unique index sgas_document_once on public.application_documents(application_id,generated_source_hash,generated_locale)
 where kind='sgas_experience';

create function private.sgas_source(p jsonb) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('version','glf-sgas-document-v1','questionnaire',p->'concept'->'sgas_experience',
 'applicant_type',coalesce(p->'concept'->>'applicant_type',''),'applicant_name',coalesce(p->'concept'->>'applicant_name',''),'project_title',coalesce(p->'concept'->>'title',''))
$$;
create function private.validate_sgas(p jsonb,complete boolean,stage integer) returns void language plpgsql set search_path='' as $$
declare f jsonb:=p->'concept'->'sgas_experience'; k text;
begin
 if f is null then if complete and stage=1 then raise exception 'GLF_REQUIRED:sgas_experience'; else return; end if; end if;
 if jsonb_typeof(f) is distinct from 'object' or f->>'version' is distinct from 'glf-sgas-v1' then raise exception 'GLF_INVALID_SGAS'; end if;
 if exists(select 1 from jsonb_object_keys(f) as fields(key) where fields.key not in('version','manual_reviewed','exclusions_confirmed','human_rights_involved','investigation_status','international_standards','standards_detail','environmental_assessments','assessments_detail','environmental_social_experts','gender_experts','internal_staff','external_staff','external_expertise')) then raise exception 'GLF_INVALID_SGAS'; end if;
 foreach k in array array['manual_reviewed','exclusions_confirmed','human_rights_involved','international_standards','environmental_assessments','environmental_social_experts','gender_experts','internal_staff','external_staff','external_expertise'] loop
  if not(f ? k) or jsonb_typeof(f->k) not in('boolean','null') then raise exception 'GLF_INVALID_SGAS'; end if;
  if complete and (k<>'external_expertise' or f->'external_staff'='true') and jsonb_typeof(f->k)='null' then raise exception 'GLF_REQUIRED:sgas_%',k; end if;
 end loop;
 foreach k in array array['investigation_status','standards_detail','assessments_detail'] loop
  if jsonb_typeof(f->k) is distinct from 'string' or length(f->>k)>(case when k='investigation_status' then 4000 else 2000 end) then raise exception 'GLF_INVALID_SGAS'; end if;
 end loop;
 if complete and f->'human_rights_involved'='true' and nullif(trim(f->>'investigation_status'),'') is null then raise exception 'GLF_REQUIRED:sgas_investigation_status'; end if;
end $$;
alter function private.validate_payload(jsonb,jsonb,boolean,integer) rename to validate_payload_before_sgas;
create function private.validate_payload(p jsonb,rules jsonb,complete boolean,stage integer) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.validate_payload_before_sgas(p,rules,complete,stage);
 perform private.validate_sgas(p,complete and stage=1,stage);
end $$;

create function private.require_current_sgas(a public.applications) returns void language plpgsql security definer set search_path='' as $$
begin
 if a.stage=1 and not exists(select 1 from public.application_documents d join storage.objects o on o.bucket_id='application-files' and o.name=d.storage_path
 where d.application_id=a.id and d.kind='sgas_experience' and d.generation_source=private.sgas_source(a.payload) and (o.metadata->>'size')::bigint=d.size_bytes)
 then raise exception 'GLF_REQUIRED:sgas_document'; end if;
end $$;
create function public.sgas_document_context(app_id uuid,expected_revision integer,locale text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.applications; source jsonb; doc jsonb;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=app_id for update;
 if not found or not private.can_edit_application(a.id) then raise exception 'GLF_APPLICATION_LOCKED'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT'; end if;
 if locale is null or locale not in('es','en') then raise exception 'GLF_INVALID_SGAS'; end if;
 perform private.validate_sgas(a.payload,true,1);
 source:=private.sgas_source(a.payload);
 select jsonb_build_object('id',d.id,'file_name',d.file_name,'kind',d.kind,'created_at',d.created_at,'generation_source',d.generation_source,'generated_locale',d.generated_locale) into doc
 from public.application_documents d join storage.objects o on o.bucket_id='application-files' and o.name=d.storage_path
 where d.application_id=a.id and d.kind='sgas_experience' and d.generation_source=source and d.generated_locale=locale and (o.metadata->>'size')::bigint=d.size_bytes order by d.created_at desc limit 1;
 return jsonb_build_object('source',source,'reference',a.reference_code,'document',doc,'session_id',auth.jwt()->>'session_id');
end $$;

-- Only the authenticated function's service client can register system-generated files.
create function public.register_sgas_document(app_id uuid,actor_id uuid,expected_revision integer,source jsonb,object_path text,original_name text,bytes bigint,checksum text,locale text,actor_session_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.applications; result uuid; role_claim text; output jsonb;
begin
 role_claim:=coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'role';
 if role_claim is distinct from 'service_role' then raise exception 'GLF_SGAS_FORBIDDEN' using errcode='42501'; end if;
 select * into a from public.applications where id=app_id for update;
 if not found or a.applicant_id<>actor_id or not exists(select 1 from public.profiles p where p.id=actor_id and p.active and p.role='applicant' and p.archived_at is null and p.access_kind='standard'
 and (p.sessions_revoked_before is null or exists(select 1 from auth.sessions s where s.user_id=p.id and s.id=actor_session_id and s.created_at>p.sessions_revoked_before))) or a.deletion_pending
 or exists(select 1 from private.partner_removals where application_id=a.id)
 or not exists(select 1 from public.calls c where c.id=a.call_id and
 ((a.stage=1 and c.status='published' and now() between c.opens_at and c.closes_at and (a.status='draft' or a.correction_deadline>now()))
 or (a.stage=2 and a.phase2_deadline>now() and (a.status in('selected_for_phase2','phase2_draft') or a.correction_deadline>now()))))
 then raise exception 'GLF_APPLICATION_LOCKED'; end if;
 -- The service identity is not the applicant: use an independent owner/deadline check.
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT'; end if;
 if source is distinct from private.sgas_source(a.payload) then raise exception 'GLF_VERSION_CONFLICT'; end if;
 perform private.validate_sgas(a.payload,true,1);
 if locale is null or locale not in('es','en') or bytes not between 1 and 4194304 or checksum !~ '^[a-f0-9]{64}$' or length(original_name)>240
 or object_path !~ ('^'||app_id::text||'/system/sgas/[a-f0-9-]{36}\.pdf$') then raise exception 'GLF_INVALID_SGAS'; end if;
 if not exists(select 1 from storage.objects where bucket_id='application-files' and name=object_path and (metadata->>'size')::bigint=bytes) then raise exception 'GLF_UPLOAD_MISSING'; end if;
 select id into result from public.application_documents where application_id=a.id and kind='sgas_experience' and generation_source=source and generated_locale=locale;
 if result is null then
 insert into public.application_documents(application_id,kind,storage_path,file_name,content_type,size_bytes,sha256,uploaded_by,generation_source,generated_source_hash,generated_locale)
 values(a.id,'sgas_experience',object_path,original_name,'application/pdf',bytes,checksum,actor_id,source,encode(sha256(convert_to(source::text,'UTF8')),'hex'),locale) returning id into result;
 insert into public.application_events(application_id,actor_id,event_type,detail) values(a.id,actor_id,'document_added',jsonb_build_object('document_id',result,'kind','sgas_experience','generated',true));
 end if;
 select jsonb_build_object('id',d.id,'file_name',d.file_name,'kind',d.kind,'created_at',d.created_at,'generation_source',d.generation_source,'generated_locale',d.generated_locale,'storage_path',d.storage_path) into output from public.application_documents d where d.id=result;
 return output;
end $$;

create function private.protect_generated_sgas() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.kind='sgas_experience' or new.generation_source is not null or new.generated_source_hash is not null or new.generated_locale is not null then
  if coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'role' is distinct from 'service_role'
   or new.kind<>'sgas_experience' or new.generation_source is null or new.generated_source_hash is null or new.generated_locale is null or new.generated_locale not in('es','en')
  then raise exception 'GLF_SGAS_FORBIDDEN' using errcode='42501'; end if;
 end if;
 return new;
end $$;
create trigger protect_generated_sgas before insert on public.application_documents for each row execute function private.protect_generated_sgas();

alter function public.prepare_application_documents(uuid,integer) rename to prepare_application_documents_before_sgas;
create function public.prepare_application_documents(app_id uuid,expected_revision integer) returns uuid language plpgsql security definer set search_path='' as $$
declare a public.applications;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=app_id for update;
 if not found or not private.can_edit_application(a.id) then raise exception 'GLF_APPLICATION_LOCKED'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT'; end if;
 perform private.validate_sgas(a.payload,a.stage=1,a.stage);
 perform private.require_current_sgas(a);
 return public.prepare_application_documents_before_sgas(app_id,expected_revision);
end $$;
create function private.check_submitted_sgas() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.stage=1 and new.status='submitted' and old.status is distinct from new.status then
  perform private.require_current_sgas(old);
  if not exists(select 1 from public.application_documents d where d.application_id=old.id and d.size_bytes between 1 and 4194304 and
   (d.kind in('experience_capacity','experience','cv','curriculum','applicant_experience','organization_experience','reference_information') or exists(
    select 1 from jsonb_array_elements(coalesce(old.rules_snapshot->'attachment_requirements','[]')) r where r->>'id'=d.kind and
    ((coalesce(r->>'label_es','')||' '||coalesce(r->>'label_en','')) !~* '\y(sgas|esms)\y' and (coalesce(r->>'label_es','')||' '||coalesce(r->>'label_en','')) ~* '(experiencia y capacidad|resumen de (la )?experiencia|experience and capacity|applicant.*experience|curr[ií]cul)'))))
  then raise exception 'GLF_ATTACHMENT_REQUIRED:experience_capacity'; end if;
 end if;
 return new;
end $$;
create trigger check_submitted_sgas before update on public.applications for each row execute function private.check_submitted_sgas();
create function private.filter_sgas_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if jsonb_typeof(new.payload->'attachments')='array' then
  new.payload:=jsonb_set(new.payload,'{attachments}',coalesce((select jsonb_agg(f) from jsonb_array_elements(new.payload->'attachments') f where f->>'kind'<>'sgas_experience' or exists(select 1 from public.application_documents d where d.id::text=f->>'id' and d.application_id=new.application_id and d.generation_source=private.sgas_source(new.payload))),'[]'));
 end if;
 return new;
end $$;
create trigger filter_sgas_snapshot before insert on public.application_versions for each row execute function private.filter_sgas_snapshot();
revoke all on function private.sgas_source(jsonb),private.validate_sgas(jsonb,boolean,integer),private.validate_payload(jsonb,jsonb,boolean,integer),private.validate_payload_before_sgas(jsonb,jsonb,boolean,integer),private.require_current_sgas(public.applications),private.protect_generated_sgas(),private.check_submitted_sgas(),private.filter_sgas_snapshot(),public.prepare_application_documents_before_sgas(uuid,integer),public.sgas_document_context(uuid,integer,text),public.register_sgas_document(uuid,uuid,integer,jsonb,text,text,bigint,text,text,uuid),public.prepare_application_documents(uuid,integer) from public,anon,authenticated;
grant execute on function public.sgas_document_context(uuid,integer,text),public.prepare_application_documents(uuid,integer) to authenticated;
grant execute on function public.register_sgas_document(uuid,uuid,integer,jsonb,text,text,bigint,text,text,uuid) to service_role;
