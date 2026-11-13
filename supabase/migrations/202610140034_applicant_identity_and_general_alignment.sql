-- Applicant observations agreed 2026-10-14. No data/role changes.
create or replace function private.validate_payload_before_risk_register(p jsonb,rules jsonb,complete boolean,stage integer) returns void
language plpgsql security definer set search_path='' as $$
declare s jsonb:=p->'concept'->'strategic_alignment'; o jsonb; activity jsonb; field text; n integer; general_count integer:=0; specific_count integer:=0; ids uuid[]:=array[]::uuid[]; specific_ids text[]:=array[]::text[]; oid uuid; has_plan boolean:=false; has_ods boolean:=false; has_glf boolean:=false;
begin
 perform private.validate_payload_before_alignment(p,rules,complete,stage);
 if s is null then return; end if;
 if jsonb_typeof(s) is distinct from 'object' or coalesce(s->>'version','') not in ('pg2030-anexo6-glf2024-ods2015-v1','pg2030-ods-general-v2')
 or jsonb_typeof(s->'objectives') is distinct from 'array' then raise exception 'GLF_INVALID_ALIGNMENT'; end if;
 if jsonb_array_length(s->'objectives') not between 1 and 11 then raise exception 'GLF_INVALID_ALIGNMENT'; end if;
 for o in select value from jsonb_array_elements(s->'objectives') loop
  oid:=(o->>'id')::uuid;
  if oid is null or oid=any(ids) then raise exception 'GLF_INVALID_ALIGNMENT'; end if;
  ids:=array_append(ids,oid);
  if o->>'kind'='general' then general_count:=general_count+1;
  elsif o->>'kind'='specific' then specific_count:=specific_count+1; specific_ids:=array_append(specific_ids,oid::text);
  else raise exception 'GLF_INVALID_ALIGNMENT'; end if;
  if jsonb_typeof(o->'text') is distinct from 'string' or length(o->>'text')>2000
  or jsonb_typeof(o->'contribution') is distinct from 'string' or length(o->>'contribution')>600 then raise exception 'GLF_INVALID_ALIGNMENT'; end if;
  foreach field in array array['plan','ods','glf'] loop
   if jsonb_typeof(o->field) is distinct from 'array' then raise exception 'GLF_INVALID_ALIGNMENT'; end if;
   select count(distinct value)::integer into n from jsonb_array_elements(o->field);
   if n<>jsonb_array_length(o->field) or n>(case when field='glf' then 7 else 17 end) then raise exception 'GLF_INVALID_ALIGNMENT'; end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(o->'plan') t(value) where jsonb_typeof(value)<>'string' or value#>>'{}' not in ('G1','G2','G3','G4','C1','C2','C3','E1','E2','E3','H1','H2','H3','H4','N1','N2','N3'))
  or exists(select 1 from jsonb_array_elements(o->'glf') t(value) where jsonb_typeof(value)<>'string' or value#>>'{}' not in ('GLF-L01','GLF-L02','GLF-L03','GLF-L04','GLF-L05','GLF-L06','GLF-L07'))
  or exists(select 1 from jsonb_array_elements(o->'ods') t(value) where jsonb_typeof(value)<>'number' or (value#>>'{}') !~ '^[0-9]+$' or (value#>>'{}')::numeric not between 1 and 17) then raise exception 'GLF_INVALID_ALIGNMENT'; end if;
  has_plan:=has_plan or jsonb_array_length(o->'plan')>0;
  has_ods:=has_ods or jsonb_array_length(o->'ods')>0;
  has_glf:=has_glf or jsonb_array_length(o->'glf')>0;
  if s->>'version'='pg2030-ods-general-v2' then
   if jsonb_array_length(o->'glf')<>0 or (o->>'kind'='specific' and (jsonb_array_length(o->'plan')<>0 or jsonb_array_length(o->'ods')<>0 or o->>'contribution'<>'')) then raise exception 'GLF_INVALID_ALIGNMENT'; end if;
   if complete and (nullif(trim(o->>'text'),'') is null or (o->>'kind'='general' and (nullif(trim(o->>'contribution'),'') is null or jsonb_array_length(o->'plan')=0 or jsonb_array_length(o->'ods')=0))) then raise exception 'GLF_ALIGNMENT_REQUIRED'; end if;
  elsif complete and (nullif(trim(o->>'text'),'') is null or nullif(trim(o->>'contribution'),'') is null or jsonb_array_length(o->'plan')+jsonb_array_length(o->'ods')+jsonb_array_length(o->'glf')=0) then raise exception 'GLF_ALIGNMENT_REQUIRED'; end if;
 end loop;
 if general_count<>1 then raise exception 'GLF_INVALID_ALIGNMENT'; end if;
 if s ? 'legacy_text' and (jsonb_typeof(s->'legacy_text') is distinct from 'string' or length(s->>'legacy_text')>24001) then raise exception 'GLF_INVALID_ALIGNMENT'; end if;
 for activity in select value from jsonb_array_elements(p->'activities') loop
  if activity ? 'objective_ids' then
   if jsonb_typeof(activity->'objective_ids') is distinct from 'array' or jsonb_array_length(activity->'objective_ids')>10 then raise exception 'GLF_INVALID_ALIGNMENT'; end if;
   if exists(select 1 from jsonb_array_elements_text(activity->'objective_ids') t(value) where not (value=any(specific_ids))) then raise exception 'GLF_INVALID_ALIGNMENT'; end if;
  end if;
 end loop;
 if complete and (specific_count=0 or not has_plan or not has_ods or (s->>'version'<>'pg2030-ods-general-v2' and not has_glf)) then raise exception 'GLF_ALIGNMENT_REQUIRED'; end if;
end $$;

-- New complete submissions require identification. Drafts remain saveable and existing versions are never rewritten.
alter function private.validate_payload(jsonb,jsonb,boolean,integer) rename to validate_payload_before_applicant_identity;
create function private.validate_payload(p jsonb,rules jsonb,complete boolean,stage integer) returns void
language plpgsql security definer set search_path='' as $$
declare c jsonb:=p->'concept'; field text;
begin
 perform private.validate_payload_before_applicant_identity(p,rules,complete,stage);
 foreach field in array array['residence_number','ruc'] loop
  if c ? field and (jsonb_typeof(c->field) is distinct from 'string' or length(c->>field)>(case when field='ruc' then 13 else 50 end)) then raise exception 'GLF_INVALID_IDENTIFICATION'; end if;
 end loop;
 if complete then
  if c->>'applicant_type'='individual' and coalesce(trim(c->>'residence_number'),'') !~ '^[[:alnum:]][[:alnum:] -]{0,49}$' then raise exception 'GLF_RESIDENCE_REQUIRED'; end if;
  if c->>'applicant_type'='organization' and coalesce(trim(c->>'ruc'),'') !~ '^[0-9]{13}$' then raise exception 'GLF_RUC_REQUIRED'; end if;
  if (c->>'end_date')::date <= (c->>'start_date')::date then raise exception 'GLF_INVALID_DATES'; end if;
 end if;
end $$;
revoke all on function private.validate_payload(jsonb,jsonb,boolean,integer), private.validate_payload_before_applicant_identity(jsonb,jsonb,boolean,integer), private.validate_payload_before_risk_register(jsonb,jsonb,boolean,integer) from public,anon,authenticated;
