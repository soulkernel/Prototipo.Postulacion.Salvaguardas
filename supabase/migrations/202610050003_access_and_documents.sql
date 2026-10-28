-- Default deny: clients can read permitted rows; mutations go through checked RPCs.
do $$ declare t text; begin
 foreach t in array array['profiles','calls','applications','activities','risks','safeguard_catalog','risk_safeguards','application_versions','application_events','technical_reviews','governance_decisions','application_documents','project_agreements','knowledge_chunks'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
grant select on public.calls to anon;
create policy profile_self on public.profiles for select to authenticated using(id=(select auth.uid()) or (select private.current_role()) in ('administrator','grants_manager'));
create policy calls_public on public.calls for select to anon using(status='published');
create policy calls_visible on public.calls for select to authenticated using(status='published' or (select private.is_staff()) or exists(select 1 from public.applications a where a.call_id=calls.id and a.applicant_id=(select auth.uid())));
create policy applications_visible on public.applications for select to authenticated using(private.can_read_application(id));
create policy activities_visible on public.activities for select to authenticated using(private.can_read_application(application_id));
create policy risks_visible on public.risks for select to authenticated using(private.can_read_application(application_id));
create policy catalog_visible on public.safeguard_catalog for select to authenticated using(active or (select private.current_role()) in ('sustainability_reviewer','administrator'));
create policy measures_visible on public.risk_safeguards for select to authenticated using(exists(select 1 from public.risks r where r.id=risk_id));
create policy versions_visible on public.application_versions for select to authenticated using(private.can_read_application(application_id));
-- Narrative staff findings and deliberations remain internal. Applicant-facing feedback is separately recorded in events.
create policy reviews_internal on public.technical_reviews for select to authenticated using((select private.is_staff()));
create policy decisions_internal on public.governance_decisions for select to authenticated using((select private.is_staff()));
create policy events_visible on public.application_events for select to authenticated using(private.can_read_application(application_id));
create policy documents_visible on public.application_documents for select to authenticated using(private.can_read_application(application_id));
create policy agreements_visible on public.project_agreements for select to authenticated using(private.can_read_application(application_id));
create policy knowledge_internal on public.knowledge_chunks for select to authenticated using(approved and (select private.current_role()) in ('sustainability_reviewer','administrator'));

create function private.can_upload_to(app uuid, folder text) returns boolean language sql stable security definer set search_path='' as $$
 select (folder='attachment' and private.can_edit_application(app)) or
 (folder='agreement' and private.current_role()='grants_manager' and exists(select 1 from public.applications where id=app and status='approved'))
$$;
revoke all on function private.can_upload_to(uuid,text) from public,anon;
grant execute on function private.can_upload_to(uuid,text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('application-files','application-files',false,26214400,array['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
create policy glf_files_insert on storage.objects for insert to authenticated with check(
 bucket_id='application-files' and (storage.foldername(name))[2]=(select auth.uid())::text
 and (storage.foldername(name))[1] ~ '^[a-f0-9-]{36}$'
 and private.can_upload_to(((storage.foldername(name))[1])::uuid,(storage.foldername(name))[3])
);
create policy glf_files_read on storage.objects for select to authenticated using(
 bucket_id='application-files' and exists(select 1 from public.application_documents d where d.storage_path=name and private.can_read_application(d.application_id))
);
-- No update/upsert/delete: attachment revisions are new objects.
create function public.register_document(app_id uuid, object_path text, original_name text, mime text, bytes bigint, checksum text, document_kind text) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid; a public.applications; folder text;
begin
 perform private.require_role(array['applicant','grants_manager']::public.app_role[]);
 select * into a from public.applications where id=app_id for update;
 folder:=(storage.foldername(object_path))[3];
 if not found or not private.can_upload_to(app_id,folder) or (storage.foldername(object_path))[1]<>app_id::text
 or (storage.foldername(object_path))[2]<>auth.uid()::text then raise exception 'GLF_UPLOAD_FORBIDDEN' using errcode='42501'; end if;
 if folder='agreement' and document_kind<>'agreement' then raise exception 'GLF_DOCUMENT_KIND'; end if;
 if folder='attachment' and document_kind='agreement' then raise exception 'GLF_DOCUMENT_KIND'; end if;
 if not exists(select 1 from storage.objects where bucket_id='application-files' and name=object_path and (metadata->>'size')::bigint=bytes) then raise exception 'GLF_UPLOAD_MISSING'; end if;
 if length(original_name)>240 or length(document_kind)>100 then raise exception 'GLF_INVALID_DOCUMENT'; end if;
 insert into public.application_documents(application_id,kind,storage_path,file_name,content_type,size_bytes,sha256,uploaded_by)
 values(app_id,document_kind,object_path,original_name,mime,bytes,checksum,auth.uid()) returning id into result;
 insert into public.application_events(application_id,actor_id,event_type,detail) values(app_id,auth.uid(),'document_added',jsonb_build_object('document_id',result,'kind',document_kind));
 return result;
end $$;
create function public.record_agreement(app_id uuid, expected_revision integer, document_id uuid, reference text, amount numeric, cofinance numeric, glf_date date, applicant_date date) returns uuid
language plpgsql security definer set search_path='' as $$
declare a public.applications; result uuid;
begin
 perform private.require_role(array['grants_manager']::public.app_role[]);
 select * into a from public.applications where id=app_id for update;
 if not found or a.status<>'approved' then raise exception 'GLF_AGREEMENT_STATE'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT' using errcode='40001'; end if;
 if amount>(select d.approved_amount from public.governance_decisions d where d.application_id=a.id and d.decision='approve' order by d.created_at desc limit 1) then raise exception 'GLF_AGREEMENT_EXCEEDS_APPROVAL'; end if;
 if glf_date<a.approved_at::date or applicant_date<a.approved_at::date then raise exception 'GLF_SIGNATURE_BEFORE_APPROVAL'; end if;
 if glf_date>current_date or applicant_date>current_date or nullif(trim(reference),'') is null then raise exception 'GLF_INVALID_AGREEMENT'; end if;
 if not exists(select 1 from public.application_documents d where d.id=document_id and d.application_id=a.id and d.kind='agreement') then raise exception 'GLF_AGREEMENT_DOCUMENT'; end if;
 insert into public.project_agreements(application_id,approved_amount,cofinance_amount,reference,document_id,glf_signed_on,applicant_signed_on,recorded_by)
 values(a.id,amount,cofinance,reference,document_id,glf_date,applicant_date,auth.uid()) returning id into result;
 update public.applications set status='contract_signed',signed_at=now(),revision=revision+1,updated_at=now() where id=a.id;
 insert into public.application_events(application_id,actor_id,event_type,detail) values(a.id,auth.uid(),'agreement_signed',jsonb_build_object('agreement_id',result));
 return result;
end $$;
create function public.call_report(requested_call uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_role(array['grants_manager','project_coordinator','sustainability_reviewer','committee_member','administrator']::public.app_role[]);
 with submitted as (
  select a.*,v.payload as submitted_payload from public.applications a
  left join lateral (select av.payload from public.application_versions av where av.application_id=a.id order by av.revision desc limit 1) v on true
  where a.call_id=requested_call
 ) select jsonb_build_object('cutoff',now(),'call_id',requested_call,
 'received',count(*) filter(where submitted_at is not null),'invited',count(*) filter(where invited_at is not null),
 'phase2_received',count(*) filter(where phase2_submitted_at is not null),'approved',count(*) filter(where approved_at is not null),
 'signed',count(*) filter(where signed_at is not null),'not_selected',count(*) filter(where status='not_selected'),
 'requested_total',coalesce(sum((submitted_payload->'concept'->>'requested_amount')::numeric) filter(where submitted_at is not null),0),
 'approved_total',(select coalesce(sum(d.approved_amount),0) from public.governance_decisions d join public.applications app on app.id=d.application_id where app.call_id=requested_call and d.decision='approve'),
 'signed_total',(select coalesce(sum(g.approved_amount),0) from public.project_agreements g join public.applications app on app.id=g.application_id where app.call_id=requested_call),
 'by_type',(select coalesce(jsonb_agg(x),'[]') from (select submitted_payload->'concept'->>'project_type' as project_type,count(*) as received from submitted where submitted_at is not null group by 1 order by 1) x))
 into result from submitted;
 return result;
end $$;
create function public.match_evidence(query_embedding extensions.vector(384), result_limit integer default 6) returns table(id bigint,document_name text,document_version text,locator text,content text,similarity double precision)
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_role(array['sustainability_reviewer','administrator']::public.app_role[]);
 return query select k.id,k.document_name,k.document_version,k.locator,k.content,1-(k.embedding operator(extensions.<=>) query_embedding) from public.knowledge_chunks k where k.approved and k.embedding is not null order by k.embedding operator(extensions.<=>) query_embedding limit least(greatest(result_limit,1),20);
end $$;
revoke all on function public.register_document(uuid,text,text,text,bigint,text,text),public.record_agreement(uuid,integer,uuid,text,numeric,numeric,date,date),public.call_report(uuid),public.match_evidence(extensions.vector,integer) from public,anon;
grant execute on function public.register_document(uuid,text,text,text,bigint,text,text),public.record_agreement(uuid,integer,uuid,text,numeric,numeric,date,date),public.call_report(uuid),public.match_evidence(extensions.vector,integer) to authenticated;
