-- GLF review: additive metadata, immutable follow-up notes and RLS-bound pagination.
-- Existing payloads, signed files and prepared formats are not rewritten.
alter table public.prepared_documents add column document_metadata jsonb;
alter table public.application_versions add column document_metadata jsonb;
alter table public.technical_reviews add column review_context jsonb;

create function private.freeze_document_metadata() returns trigger
language plpgsql security definer set search_path='' as $$
declare author uuid; prepared public.prepared_documents;
begin
 if tg_table_name='application_versions' then
  select * into prepared from public.prepared_documents p
   where p.application_id=new.application_id and p.revision=new.revision and p.stage=new.stage;
  if found then
   new.document_metadata:=prepared.document_metadata;
   return new;
  end if;
  author:=new.actor_id;
 else
  author:=auth.uid();
 end if;
 new.document_metadata:=jsonb_build_object('format_version',2,'author_name',
  coalesce((select p.full_name from public.profiles p where p.id=author),''));
 return new;
end $$;
create trigger freeze_document_metadata before insert on public.prepared_documents
 for each row execute function private.freeze_document_metadata();
create trigger freeze_document_metadata before insert on public.application_versions
 for each row execute function private.freeze_document_metadata();

create function private.freeze_review_context() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 select jsonb_build_object('stage',a.stage,'status',a.status,'author_name',p.full_name)
 into new.review_context from public.applications a,public.profiles p
 where a.id=new.application_id and p.id=new.reviewer_id;
 return new;
end $$;
create trigger freeze_review_context before insert on public.technical_reviews
 for each row execute function private.freeze_review_context();

-- Separate from decision-gating evaluations: a follow-up can never satisfy the
-- required safeguards review or change an application decision/status.
create table public.application_review_notes (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references public.applications(id),
 version_id uuid not null references public.application_versions(id),
 revision integer not null, stage smallint not null check(stage in(1,2)),
 application_status public.application_status not null,
 review_type text not null check(review_type in('grants','safeguards','coordination')),
 author_id uuid not null references public.profiles(id), author_name text not null,
 findings text not null check(length(trim(findings)) between 1 and 12000),
 recommendation text not null check(length(recommendation)<=12000),
 created_at timestamptz not null default now()
);
create index application_review_notes_application on public.application_review_notes(application_id,created_at desc,id);
alter table public.application_review_notes enable row level security;
revoke all on public.application_review_notes from public,anon,authenticated;
grant select on public.application_review_notes to authenticated;
create policy internal_notes_read on public.application_review_notes for select to authenticated
 using((private.is_staff() or private.is_academic()) and private.can_read_application(application_id));
create function private.prevent_review_note_change() returns trigger
language plpgsql set search_path='' as $$
begin raise exception 'GLF_REVIEW_IMMUTABLE'; end $$;
create trigger protect_review_notes before update or delete on public.application_review_notes
 for each row execute function private.prevent_review_note_change();

create function public.record_review_note(app_id uuid,expected_revision integer,findings text,recommendation text default '')
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.applications; v public.application_versions; p public.profiles; result uuid;
begin
 perform private.require_role(array['grants_manager','sustainability_reviewer','project_coordinator']::public.app_role[]);
 select * into p from public.profiles where id=auth.uid();
 select * into a from public.applications where id=app_id for update;
 if not found or a.submitted_at is null then raise exception 'GLF_REVIEW_STATE'; end if;
 if a.revision is distinct from expected_revision then raise exception 'GLF_VERSION_CONFLICT' using errcode='40001'; end if;
 if length(trim(coalesce(findings,''))) not between 1 and 12000 or length(coalesce(recommendation,''))>12000 then
  raise exception 'GLF_REVIEW_REQUIRED'; end if;
 select * into v from public.application_versions where application_id=a.id order by revision desc,id desc limit 1;
 if not found then raise exception 'GLF_RESUBMISSION_REQUIRED'; end if;
 insert into public.application_review_notes(application_id,version_id,revision,stage,application_status,review_type,author_id,author_name,findings,recommendation)
 values(a.id,v.id,v.revision,a.stage,a.status,
  case p.role when 'grants_manager' then 'grants' when 'sustainability_reviewer' then 'safeguards' else 'coordination' end,
  p.id,p.full_name,trim(findings),trim(coalesce(recommendation,''))) returning id into result;
 insert into public.application_events(application_id,actor_id,event_type,detail)
 values(a.id,p.id,'review_note_recorded',jsonb_build_object('note_id',result,'revision',v.revision,'status',a.status));
 return result;
end $$;

create function public.internal_application_page(filter_call uuid default null,filter_category text default null,requested_page integer default 1,page_size integer default 10)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb; size integer:=case when page_size in(10,25,50) then page_size else 10 end;
begin
 if not (private.is_staff() or private.is_academic()) then raise exception 'GLF_FORBIDDEN' using errcode='42501'; end if;
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
revoke all on function private.freeze_document_metadata(),private.freeze_review_context(),private.prevent_review_note_change(),public.record_review_note(uuid,integer,text,text),public.internal_application_page(uuid,text,integer,integer) from public,anon,authenticated;
grant execute on function public.record_review_note(uuid,integer,text,text),public.internal_application_page(uuid,text,integer,integer) to authenticated;
