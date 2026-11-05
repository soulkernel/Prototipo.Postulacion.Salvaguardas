-- Optional preliminary activity dates. Existing JSON, IDs and snapshots are untouched.
create or replace function private.validate_activity_dates(p jsonb, complete boolean) returns void
language plpgsql security definer set search_path='' as $$
declare activity jsonb; field text; date_text text; first_date text; last_date text; n integer:=0;
begin
 if jsonb_typeof(p->'activities') is distinct from 'array' then return; end if;
 for activity in select value from jsonb_array_elements(p->'activities') loop
  n:=n+1;
  foreach field in array array['start_date','end_date'] loop
   if activity ? field then
    if jsonb_typeof(activity->field) is distinct from 'string' then raise exception 'GLF_ACTIVITY_DATE_INVALID:%',n; end if;
    date_text:=activity->>field;
    if date_text<>'' then
     begin
      if date_text !~ '^\d{4}-\d{2}-\d{2}$' or to_char(date_text::date,'YYYY-MM-DD')<>date_text then raise exception 'invalid date'; end if;
     exception when others then raise exception 'GLF_ACTIVITY_DATE_INVALID:%',n;
     end;
    end if;
   end if;
  end loop;
  if complete then
   first_date:=nullif(activity->>'start_date',''); last_date:=nullif(activity->>'end_date','');
   if first_date is not null or last_date is not null then
    if first_date is null or last_date is null then raise exception 'GLF_ACTIVITY_DATE_REQUIRED:%',n; end if;
    if last_date<first_date then raise exception 'GLF_ACTIVITY_DATE_ORDER:%',n; end if;
    if first_date<(p->'concept'->>'start_date') or last_date>(p->'concept'->>'end_date') then raise exception 'GLF_ACTIVITY_DATE_RANGE:%',n; end if;
   end if;
  end if;
 end loop;
end $$;
revoke all on function private.validate_activity_dates(jsonb,boolean) from public,anon,authenticated;

-- Extend the core without changing the established validator wrapper chain.
do $$
declare definition text;
begin
 definition:=pg_get_functiondef('private.validate_payload_before_phone(jsonb,jsonb,boolean,integer)'::regprocedure);
 if position('private.validate_activity_dates' in definition)=0 then
  if position('for activity in select value from jsonb_array_elements(p->''activities'') loop' in definition)=0 then raise exception 'GLF_ACTIVITY_VALIDATOR_CHANGED'; end if;
  definition:=regexp_replace(definition,'begin',E'begin\n perform private.validate_activity_dates(p,complete);','i');
  execute definition;
 end if;
end $$;
revoke all on function private.validate_payload_before_phone(jsonb,jsonb,boolean,integer) from public,anon,authenticated;

-- Only future prepared documents use the updated headings; keep old signatures/layouts.
alter table public.prepared_documents alter column concept_layout_version set default 'glf-concept-20261020-v2';
alter table public.application_versions alter column concept_layout_version set default 'glf-concept-20261020-v2';
create or replace function private.freeze_concept_layout() returns trigger
language plpgsql security definer set search_path='' as $$
declare prepared_layout text;
begin
 select p.concept_layout_version into prepared_layout from public.prepared_documents p
 where p.application_id=new.application_id and p.stage=new.stage
   and p.revision=new.revision-1 and p.payload=new.payload-'attachments';
 if found then new.concept_layout_version:=prepared_layout; end if;
 return new;
end $$;
revoke all on function private.freeze_concept_layout() from public,anon,authenticated;
