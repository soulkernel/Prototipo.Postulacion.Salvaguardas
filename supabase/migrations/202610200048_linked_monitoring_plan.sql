-- Linked concept-note indicators. Legacy narratives and frozen versions remain intact.
create or replace function private.validate_monitoring_plan(p jsonb, complete boolean) returns void
language plpgsql security definer set search_path='' as $$
declare c jsonb:=p->'concept'; item jsonb; ref jsonb; ids jsonb; objective_id text; field text; seen text[]:='{}'; n integer:=0;
 uuid_pattern text:='^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$';
begin
 if not (c ? 'monitoring_plan') then return; end if;
 if jsonb_typeof(c->'monitoring_plan') is distinct from 'array' then raise exception 'GLF_INVALID_MONITORING'; end if;
 if jsonb_array_length(c->'monitoring_plan')>30 then raise exception 'GLF_INVALID_MONITORING'; end if;
 if complete and jsonb_array_length(c->'monitoring_plan')=0 then raise exception 'GLF_REQUIRED:monitoring'; end if;
 for item in select value from jsonb_array_elements(c->'monitoring_plan') loop
  n:=n+1;
  if jsonb_typeof(item) is distinct from 'object' then raise exception 'GLF_INVALID_MONITORING'; end if;
  if exists(select 1 from jsonb_object_keys(item) extra(key) where key not in ('id','parameter','reference_id','indicator','strategy')) then raise exception 'GLF_INVALID_MONITORING'; end if;
  foreach field in array array['id','parameter','reference_id','indicator','strategy'] loop
   if jsonb_typeof(item->field) is distinct from 'string' then raise exception 'GLF_INVALID_MONITORING'; end if;
  end loop;
  if item->>'id' !~ uuid_pattern
    or lower(item->>'id')=any(seen) or item->>'parameter' not in ('','activity','result')
    or length(item->>'indicator')>1000 or length(item->>'strategy')>2000
    or (item->>'reference_id'<>'' and item->>'reference_id' !~ uuid_pattern)
    then raise exception 'GLF_INVALID_MONITORING'; end if;
  seen:=array_append(seen,lower(item->>'id'));
  if complete then
   if item->>'parameter'='' or item->>'reference_id'='' or nullif(trim(item->>'indicator'),'') is null or nullif(trim(item->>'strategy'),'') is null
     then raise exception 'GLF_REQUIRED:monitoring_%',n; end if;
   ref:=null;
   if item->>'parameter'='activity' then
    select value into ref from jsonb_array_elements(case when jsonb_typeof(p->'activities')='array' then p->'activities' else '[]'::jsonb end)
      where value->>'id'=item->>'reference_id' limit 1;
    if ref is null or nullif(trim(ref->>'title'),'') is null then raise exception 'GLF_REQUIRED:monitoring_%',n; end if;
    ids:=case when jsonb_typeof(ref->'objective_ids')='array' then ref->'objective_ids' else '[]'::jsonb end;
   else
    select value into ref from jsonb_array_elements(case when jsonb_typeof(c->'project_results')='array' then c->'project_results' else '[]'::jsonb end)
      where value->>'id'=item->>'reference_id' limit 1;
    if ref is null or nullif(trim(ref->>'result'),'') is null then raise exception 'GLF_REQUIRED:monitoring_%',n; end if;
    ids:=jsonb_build_array(ref->>'objective_id');
   end if;
   if jsonb_array_length(ids)=0 then raise exception 'GLF_REQUIRED:monitoring_%',n; end if;
   for objective_id in select jsonb_array_elements_text(ids) loop
    if not exists(select 1 from jsonb_array_elements(case when jsonb_typeof(c->'strategic_alignment'->'objectives')='array' then c->'strategic_alignment'->'objectives' else '[]'::jsonb end) o
      where o->>'id'=objective_id and o->>'kind'='specific' and nullif(trim(o->>'text'),'') is not null)
      then raise exception 'GLF_REQUIRED:monitoring_%',n; end if;
   end loop;
  end if;
 end loop;
end $$;
revoke all on function private.validate_monitoring_plan(jsonb,boolean) from public,anon,authenticated;

-- Preserve the wrapper chain and skip only the obsolete narrative requirement
-- when a structured plan is explicitly present. Drafts may stay incomplete.
do $$
declare definition text;
begin
 definition:=pg_get_functiondef('private.validate_payload_before_phone(jsonb,jsonb,boolean,integer)'::regprocedure);
 if position('private.validate_monitoring_plan' in definition)=0 then
  if position('private.validate_project_results' in definition)=0
    or position('if complete and field<>''partners'' and nullif(trim(concept->>field),'''') is null then' in definition)=0
    then raise exception 'GLF_MONITORING_VALIDATOR_CHANGED'; end if;
  definition:=replace(definition,'if complete and field<>''partners'' and nullif(trim(concept->>field),'''') is null then',
    'if complete and field<>''partners'' and not (field=''monitoring'' and concept ? ''monitoring_plan'') and nullif(trim(concept->>field),'''') is null then');
  definition:=regexp_replace(definition,'begin',E'begin\n perform private.validate_monitoring_plan(p,complete);','i');
  execute definition;
 end if;
end $$;
revoke all on function private.validate_payload_before_phone(jsonb,jsonb,boolean,integer) from public,anon,authenticated;

-- New documents alone render the linked plan after Activities. Existing
-- prepared/signed documents keep their recorded layout and original narrative.
alter table public.prepared_documents alter column concept_layout_version set default 'glf-concept-20261020-v4';
alter table public.application_versions alter column concept_layout_version set default 'glf-concept-20261020-v4';
