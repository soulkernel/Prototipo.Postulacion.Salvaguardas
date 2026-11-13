-- Concept notes capture objective + outcome; full proposals add measurement.
-- JSON keys, UUIDs, saved values and historic/signed documents are preserved.
create or replace function private.validate_project_results(c jsonb, complete boolean, stage integer) returns void
language plpgsql security definer set search_path='' as $$
declare r jsonb; field text; n integer:=0; seen text[]:='{}'; result_id text; target numeric;
begin
 if stage is null or stage not in (1,2) then raise exception 'GLF_INVALID_STAGE'; end if;
 -- Narrative-only legacy applications retain their established validation.
 if not (c ? 'project_results') then return; end if;
 if jsonb_typeof(c->'project_results') is distinct from 'array' then raise exception 'GLF_INVALID_RESULTS'; end if;
 if jsonb_array_length(c->'project_results')>30 then raise exception 'GLF_INVALID_RESULTS'; end if;
 if complete and jsonb_array_length(c->'project_results')=0 then raise exception 'GLF_REQUIRED:results'; end if;
 for r in select value from jsonb_array_elements(c->'project_results') loop
  n:=n+1;
  if jsonb_typeof(r) is distinct from 'object' then raise exception 'GLF_INVALID_RESULTS'; end if;
  result_id:=r->>'id';
  if jsonb_typeof(r->'id') is distinct from 'string' or result_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or result_id=any(seen) then raise exception 'GLF_INVALID_RESULTS'; end if;
  seen:=array_append(seen,result_id);
  foreach field in array array['objective_id','result','indicator','unit','other_unit','evidence'] loop
   if jsonb_typeof(r->field) is distinct from 'string' then raise exception 'GLF_INVALID_RESULTS'; end if;
  end loop;
  if length(r->>'objective_id')>36 or length(r->>'result')>2000 or length(r->>'indicator')>1000
    or length(r->>'other_unit')>100 or length(r->>'evidence')>1000
    or r->>'unit' not in ('','people','activities','products','sites','hectares','percent','other')
    or jsonb_typeof(r->'target') is null or jsonb_typeof(r->'target') not in ('number','null') then raise exception 'GLF_INVALID_RESULTS'; end if;
  target:=(r->>'target')::numeric;
  if target<0 or target>999999999999 then raise exception 'GLF_INVALID_RESULTS'; end if;
  if complete then
   if nullif(trim(r->>'result'),'') is null then raise exception 'GLF_REQUIRED:result_%',n; end if;
   if not exists(select 1 from jsonb_array_elements(
      case when jsonb_typeof(c->'strategic_alignment'->'objectives')='array' then c->'strategic_alignment'->'objectives' else '[]'::jsonb end) o
      where o->>'id'=r->>'objective_id' and o->>'kind'='specific' and nullif(trim(o->>'text'),'') is not null)
     then raise exception 'GLF_REQUIRED:result_%',n; end if;
   if stage=2 and (nullif(trim(r->>'indicator'),'') is null or target is null or r->>'unit'=''
      or (r->>'unit'='other' and nullif(trim(r->>'other_unit'),'') is null)
      or nullif(trim(r->>'evidence'),'') is null or (r->>'unit'='percent' and target>100))
     then raise exception 'GLF_REQUIRED:result_%',n; end if;
  end if;
 end loop;
end $$;
revoke all on function private.validate_project_results(jsonb,boolean,integer) from public,anon,authenticated;

-- Add the guard to the established chain. Save/prepare/submit pass DB stage.
do $$
declare definition text;
begin
 definition:=pg_get_functiondef('private.validate_payload_before_phone(jsonb,jsonb,boolean,integer)'::regprocedure);
 if position('private.validate_project_results' in definition)=0 then
  if position('private.validate_activity_dates' in definition)=0 then raise exception 'GLF_RESULTS_VALIDATOR_CHANGED'; end if;
  definition:=regexp_replace(definition,'begin',E'begin\n perform private.validate_project_results(p->''concept'',complete,stage);','i');
  execute definition;
 end if;
end $$;
revoke all on function private.validate_payload_before_phone(jsonb,jsonb,boolean,integer) from public,anon,authenticated;

-- Future documents get stage-specific results. Existing prepared/signed
-- versions keep their stored format through the existing freeze trigger.
alter table public.prepared_documents alter column concept_layout_version set default 'glf-concept-20261020-v3';
alter table public.application_versions alter column concept_layout_version set default 'glf-concept-20261020-v3';
