begin;
-- Academic review has ended. Delete retired identities through the guarded
-- administration workflow before applying this migration. Never convert them
-- to applicants or remove institutional applications/corpus documents.
do $$ begin
 if exists(select 1 from public.profiles where access_kind <> 'standard') then
  raise exception 'GLF_RETIRE_ACADEMIC_IDENTITIES_FIRST';
 end if;
end $$;
-- Keep the standard identity fields/RPC contract consumed by Operations/KYC.
alter table public.profiles drop constraint academic_profile;
alter table public.profiles drop constraint profiles_access_kind_check;
alter table public.profiles add constraint profiles_access_kind_check check(access_kind='standard');


create or replace function private.account_session_valid(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=target and p.active and p.archived_at is null
 and p.access_kind='standard'
 and (p.sessions_revoked_before is null or exists(select 1 from auth.sessions s
 where s.user_id=p.id and s.id::text=auth.jwt()->>'session_id' and s.created_at>p.sessions_revoked_before)))
$$;

create or replace function private.manage_account_core(target_user uuid,expected_revision integer,operation text,reason text) returns void
language plpgsql security definer set search_path='' as $$
declare target public.profiles;
begin
 perform pg_advisory_xact_lock(130031);
 if target_user=auth.uid() then raise exception 'GLF_SELF_ACCOUNT_CHANGE'; end if;
 select * into target from public.profiles where id=target_user for update;
 if not found then raise exception 'GLF_NOT_FOUND'; end if;
 if not private.may_manage_account(target) then raise exception 'GLF_FORBIDDEN'; end if;
 if target.account_revision<>expected_revision then raise exception 'GLF_CONCURRENT_CHANGE'; end if;
 if length(trim(reason)) not between 3 and 500 then raise exception 'GLF_REASON_REQUIRED'; end if;
 if operation not in ('deactivate','reactivate','revoke_sessions','archive','unarchive') then raise exception 'GLF_INVALID_OPERATION'; end if;
 if target.role='administrator' and target.active and operation in ('deactivate','archive') and
 (select count(*) from public.profiles where role='administrator' and active and archived_at is null)<=1 then raise exception 'GLF_LAST_ADMIN'; end if;
 if exists(select 1 from private.account_deletion_tickets where user_id=target_user and expires_at>now()) then raise exception 'GLF_DELETION_PENDING'; end if;
 if operation='archive' and target.active then raise exception 'GLF_DEACTIVATE_FIRST'; end if;
 if operation='reactivate' and target.archived_at is not null then raise exception 'GLF_CANNOT_REACTIVATE'; end if;
 update public.profiles set
 active=case when operation='deactivate' then false when operation='reactivate' then true else active end,
 archived_at=case when operation='archive' then now() when operation='unarchive' then null else archived_at end,
 sessions_revoked_before=case when operation in ('deactivate','revoke_sessions','archive') then clock_timestamp() else sessions_revoked_before end
 where profiles.id=target_user;
 insert into private.account_events(actor_id,target_id,operation,reason) values(auth.uid(),target_user,operation,trim(reason));
end $$;

create or replace function private.guard_account_deletion() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.active or old.archived_at is null or not exists(select 1 from private.account_deletion_tickets where user_id=old.id and expires_at>now())
 or private.account_has_history(old.id) then raise exception 'GLF_ACCOUNT_DELETE_FORBIDDEN'; end if;
 insert into private.account_events(actor_id,target_id,operation,reason) select actor_id,old.id,'deleted','Cuenta sin historial eliminada' from private.account_deletion_tickets where user_id=old.id;
 delete from private.account_deletion_tickets where user_id=old.id;
 return old;
end $$;

create or replace function private.can_read_application(app uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.applications where id=app and
 ((private.is_staff() and submitted_at is not null) or
 (applicant_id=auth.uid() and private.current_role()='applicant')))
$$;
drop policy academic_calls_read on public.calls;
drop policy academic_reviews_read on public.technical_reviews;
drop policy academic_decisions_read on public.governance_decisions;
drop policy academic_rag_notes_read on public.rag_review_notes;
alter policy internal_notes_read on public.application_review_notes
 using(private.is_staff() and private.can_read_application(application_id));


create or replace function public.internal_application_page(filter_call uuid default null,filter_category text default null,requested_page integer default 1,page_size integer default 10)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb; size integer:=case when page_size in(10,25,50) then page_size else 10 end;
begin
 if not private.is_staff() then raise exception 'GLF_FORBIDDEN' using errcode='42501'; end if;
 with filtered as materialized (
  select a.id,a.call_id,a.reference_code,a.status,a.stage,
   coalesce(nullif(v.payload->'concept'->>'title',''),a.reference_code) title,
   coalesce(v.payload->'concept'->>'applicant_name','') proponent,
   coalesce(v.payload->'concept'->>'contact_name','') contact,
   coalesce(v.payload->'concept'->>'category_id','') category,
   v.submitted_at
  from public.applications a
  join lateral (select av.payload,av.submitted_at from public.application_versions av
   where av.application_id=a.id order by av.revision desc,av.id desc limit 1) v on true
  where a.submitted_at is not null and (filter_call is null or a.call_id=filter_call)
   and (filter_category is null or v.payload->'concept'->>'category_id'=filter_category)
 ), summary as (
  select count(*)::int total,
   count(*) filter(where status in('submitted','under_review','phase2_submitted'))::int in_review,
   count(*) filter(where stage=2)::int shortlisted,
   count(*) filter(where status='contract_signed')::int signed from filtered
 ), paging as (
  select *,greatest(1,ceil(total::numeric/size)::int) pages,
   least(greatest(1,coalesce(requested_page,1)),greatest(1,ceil(total::numeric/size)::int)) page from summary
 ), items as (
  select * from filtered order by submitted_at desc,id
  limit size offset (select (page-1)*size from paging)
 )
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(i) order by i.submitted_at desc,i.id) from items i),'[]'),
  'total',p.total,'page',p.page,'pages',p.pages,'page_size',size,
  'in_review',p.in_review,'shortlisted',p.shortlisted,'signed',p.signed) into result from paging p;
 return result;
end $$;

create or replace function public.internal_application_search(
 filter_call uuid default null, filter_category text default null,
 requested_page integer default 1, page_size integer default 10, search_text text default '')
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb; size integer:=case when page_size in(10,25,50) then page_size else 10 end;
 needle text:=left(public.normalize_inbox_text(coalesce(search_text,'')),200); pattern text;
begin
 if not private.is_staff() then raise exception 'GLF_FORBIDDEN' using errcode='42501'; end if;
 -- Search punctuation literally; user text never becomes SQL or LIKE syntax.
 pattern:='%' || replace(replace(replace(needle,E'\\',E'\\\\'),'%',E'\\%'),'_',E'\\_') || '%';
 with filtered as materialized (
  select a.id,a.call_id,a.reference_code,a.status,a.stage,
   coalesce(nullif(v.payload->'concept'->>'title',''),a.reference_code) title,
   coalesce(v.payload->'concept'->>'applicant_name','') proponent,
   coalesce(v.payload->'concept'->>'contact_name','') contact,
   coalesce(v.payload->'concept'->>'category_id','') category,v.submitted_at
  from public.applications a
  join public.application_versions v on v.application_id=a.id
   and v.id=(select av.id from public.application_versions av where av.application_id=a.id order by av.revision desc,av.id desc limit 1)
  where a.submitted_at is not null and (filter_call is null or a.call_id=filter_call)
   and (filter_category is null or v.payload->'concept'->>'category_id'=filter_category)
   and (needle='' or public.normalize_inbox_text(a.reference_code) like pattern escape E'\\'
    or public.normalize_inbox_text(coalesce(v.payload->'concept'->>'title','') || ' ' ||
      coalesce(v.payload->'concept'->>'applicant_name','') || ' ' ||
      coalesce(v.payload->'concept'->>'contact_name','')) like pattern escape E'\\')
 ), summary as (
  select count(*)::int total,
   count(*) filter(where status in('submitted','under_review','phase2_submitted'))::int in_review,
   count(*) filter(where stage=2)::int shortlisted,
   count(*) filter(where status='contract_signed')::int signed from filtered
 ), paging as (
  select *,greatest(1,ceil(total::numeric/size)::int) pages,
   least(greatest(1,coalesce(requested_page,1)),greatest(1,ceil(total::numeric/size)::int)) page from summary
 ), items as (
  select * from filtered order by submitted_at desc,id
  limit size offset (select (page-1)*size from paging)
 )
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(i) order by i.submitted_at desc,i.id) from items i),'[]'),
  'total',p.total,'page',p.page,'pages',p.pages,'page_size',size,
  'in_review',p.in_review,'shortlisted',p.shortlisted,'signed',p.signed) into result from paging p;
 return result;
end $$;

create or replace function public.match_evidence(query_embedding extensions.vector(384), result_limit integer default 6) returns table(id bigint,document_name text,document_version text,locator text,content text,similarity double precision)
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_role(array['sustainability_reviewer','administrator']::public.app_role[]);
 return query select k.id,k.document_name,k.document_version,k.locator,k.content,1-(k.embedding operator(extensions.<=>) query_embedding)
 from public.knowledge_chunks k where k.approved and k.embedding is not null
 order by k.embedding operator(extensions.<=>) query_embedding limit least(greatest(result_limit,1),20);
end $$;

-- Drop the exclusive API before its helpers and link tables. Deliberately no
-- CASCADE: any unexpected dependency aborts and rolls back the entire migration.
drop function public.academic_call_report(uuid);
drop function public.academic_source_count();
drop function public.consume_academic_query();
drop function public.finish_academic_account(uuid,uuid);
drop function private.academic_call_access(uuid);
drop function private.is_academic();
drop table private.academic_application_scope;
drop table private.academic_sources;
drop table private.academic_queries;
notify pgrst, 'reload schema';
commit;
