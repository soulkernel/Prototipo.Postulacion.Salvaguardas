-- Additive search API: old clients keep using internal_application_page.
create extension if not exists pg_trgm with schema extensions;

create or replace function public.normalize_inbox_text(value text) returns text
language sql immutable strict parallel safe set search_path='' as $$
 select btrim(regexp_replace(translate(lower(normalize(value,NFC)),
  'áéíóúüñàèìòùâêîôûäëïöÿç','aeiouunaeiouaeiouaeioyc'),'\s+',' ','g'))
$$;
revoke all on function public.normalize_inbox_text(text) from public,anon;
grant execute on function public.normalize_inbox_text(text) to authenticated,service_role;

create index if not exists application_versions_latest_lookup
 on public.application_versions(application_id,revision desc,id desc);
create index if not exists application_versions_inbox_search
 on public.application_versions using gin (
 public.normalize_inbox_text(coalesce(payload->'concept'->>'title','') || ' ' ||
 coalesce(payload->'concept'->>'applicant_name','') || ' ' ||
 coalesce(payload->'concept'->>'contact_name','')) extensions.gin_trgm_ops);
create index if not exists applications_reference_search
 on public.applications using gin (public.normalize_inbox_text(reference_code) extensions.gin_trgm_ops);

create or replace function public.internal_application_search(
 filter_call uuid default null, filter_category text default null,
 requested_page integer default 1, page_size integer default 10, search_text text default '')
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb; size integer:=case when page_size in(10,25,50) then page_size else 10 end;
 needle text:=left(public.normalize_inbox_text(coalesce(search_text,'')),200); pattern text;
begin
 if not (private.is_staff() or private.is_academic()) then raise exception 'GLF_FORBIDDEN' using errcode='42501'; end if;
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
revoke all on function public.internal_application_search(uuid,text,integer,integer,text) from public,anon,authenticated;
grant execute on function public.internal_application_search(uuid,text,integer,integer,text) to authenticated;
