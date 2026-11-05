-- Structured sustainability strategies; no conversion or mutation of stored applications.
create or replace function private.validate_sustainability_plan(p jsonb, complete boolean) returns void
language plpgsql security definer set search_path='' as $$
declare c jsonb:=p->'concept'; item jsonb; ref jsonb; indicator jsonb; field text; seen text[]:='{}'; refs text[]; n integer:=0;
 uuid_pattern text:='^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$';
begin
 if not (c ? 'sustainability_plan') then return; end if;
 if jsonb_typeof(c->'sustainability_plan') is distinct from 'array' then raise exception 'GLF_INVALID_SUSTAINABILITY'; end if;
 if jsonb_array_length(c->'sustainability_plan')>30 then raise exception 'GLF_INVALID_SUSTAINABILITY'; end if;
 if complete and jsonb_array_length(c->'sustainability_plan')=0 then raise exception 'GLF_REQUIRED:sustainability'; end if;
 for item in select value from jsonb_array_elements(c->'sustainability_plan') loop
  n:=n+1;
  if jsonb_typeof(item) is distinct from 'object' then raise exception 'GLF_INVALID_SUSTAINABILITY'; end if;
  if exists(select 1 from jsonb_object_keys(item) x(key) where key not in ('id','references','strategy','actor_type','actor_id','actor_name','replication','replication_details','monitoring_id')) then raise exception 'GLF_INVALID_SUSTAINABILITY'; end if;
  foreach field in array array['id','strategy','actor_type','actor_id','actor_name','replication','replication_details','monitoring_id'] loop
   if jsonb_typeof(item->field) is distinct from 'string' then raise exception 'GLF_INVALID_SUSTAINABILITY'; end if;
  end loop;
  if item->>'id' !~ uuid_pattern or lower(item->>'id')=any(seen)
   or item->>'actor_type' not in ('','applicant','partner','other','undecided')
   or item->>'replication' not in ('','scale_up','replicate','both','none','undecided')
   or length(item->>'strategy')>12000 or length(item->>'replication_details')>12000 or length(item->>'actor_name')>200
   or (item->>'actor_id'<>'' and item->>'actor_id' !~ uuid_pattern)
   or (item->>'monitoring_id'<>'' and item->>'monitoring_id' !~ uuid_pattern)
   or (item->>'actor_type'<>'partner' and item->>'actor_id'<>'')
   or (item->>'actor_type'<>'other' and item->>'actor_name'<>'') then raise exception 'GLF_INVALID_SUSTAINABILITY'; end if;
  seen:=array_append(seen,lower(item->>'id'));
  if jsonb_typeof(item->'references') is distinct from 'array' then raise exception 'GLF_INVALID_SUSTAINABILITY'; end if;
  if jsonb_array_length(item->'references')>130 then raise exception 'GLF_INVALID_SUSTAINABILITY'; end if;
  refs:='{}';
  for ref in select value from jsonb_array_elements(item->'references') loop
   if jsonb_typeof(ref) is distinct from 'object' then raise exception 'GLF_INVALID_SUSTAINABILITY'; end if;
   if exists(select 1 from jsonb_object_keys(ref) x(key) where key not in ('type','id'))
    or jsonb_typeof(ref->'type') is distinct from 'string' or jsonb_typeof(ref->'id') is distinct from 'string'
    then raise exception 'GLF_INVALID_SUSTAINABILITY'; end if;
   if ref->>'type' not in ('activity','result') or ref->>'id' !~ uuid_pattern or (ref->>'type'||':'||lower(ref->>'id'))=any(refs) then raise exception 'GLF_INVALID_SUSTAINABILITY'; end if;
   refs:=array_append(refs,ref->>'type'||':'||lower(ref->>'id'));
   if complete then
    -- Reuse the existing target/objective validation without inferring cross-links.
    begin
     perform private.validate_monitoring_plan(jsonb_set(p,'{concept,monitoring_plan}',jsonb_build_array(jsonb_build_object('id',item->>'id','parameter',ref->>'type','reference_id',ref->>'id','indicator','reference','strategy','reference'))),true);
    exception when others then raise exception 'GLF_REQUIRED:sustainability_%',n; end;
   end if;
  end loop;
  if complete then
   if jsonb_array_length(item->'references')=0 or nullif(trim(item->>'strategy'),'') is null or item->>'actor_type'='' or item->>'replication'='' or nullif(trim(item->>'replication_details'),'') is null then raise exception 'GLF_REQUIRED:sustainability_%',n; end if;
   if item->>'actor_type'='partner' and not exists(select 1 from jsonb_array_elements(case when jsonb_typeof(c->'partner_organizations')='array' then c->'partner_organizations' else '[]'::jsonb end) x where x->>'id'=item->>'actor_id' and nullif(trim(x->>'name'),'') is not null) then raise exception 'GLF_REQUIRED:sustainability_%',n; end if;
   if item->>'actor_type'='other' and nullif(trim(item->>'actor_name'),'') is null then raise exception 'GLF_REQUIRED:sustainability_%',n; end if;
   if item->>'monitoring_id'<>'' then
    select value into indicator from jsonb_array_elements(case when jsonb_typeof(c->'monitoring_plan')='array' then c->'monitoring_plan' else '[]'::jsonb end) where value->>'id'=item->>'monitoring_id' limit 1;
    if indicator is null then raise exception 'GLF_REQUIRED:sustainability_%',n; end if;
    begin
     perform private.validate_monitoring_plan(jsonb_set(p,'{concept,monitoring_plan}',jsonb_build_array(indicator)),true);
    exception when others then raise exception 'GLF_REQUIRED:sustainability_%',n; end;
   end if;
  end if;
 end loop;
end $$;
revoke all on function private.validate_sustainability_plan(jsonb,boolean) from public,anon,authenticated;

do $$
declare definition text; old_guard text:='if complete and field<>''partners'' and not (field=''monitoring'' and concept ? ''monitoring_plan'') and nullif(trim(concept->>field),'''') is null then';
begin
 definition:=pg_get_functiondef('private.validate_payload_before_phone(jsonb,jsonb,boolean,integer)'::regprocedure);
 if position('private.validate_sustainability_plan' in definition)=0 then
  if position('private.validate_monitoring_plan' in definition)=0 or position(old_guard in definition)=0 then raise exception 'GLF_SUSTAINABILITY_VALIDATOR_CHANGED'; end if;
  definition:=replace(definition,old_guard,'if complete and field<>''partners'' and not (field=''monitoring'' and concept ? ''monitoring_plan'') and not (field=''sustainability'' and concept ? ''sustainability_plan'') and nullif(trim(concept->>field),'''') is null then');
  definition:=regexp_replace(definition,'begin',E'begin\n perform private.validate_sustainability_plan(p,complete);','i');
  execute definition;
 end if;
end $$;
revoke all on function private.validate_payload_before_phone(jsonb,jsonb,boolean,integer) from public,anon,authenticated;
alter table public.prepared_documents alter column concept_layout_version set default 'glf-concept-20261020-v5';
alter table public.application_versions alter column concept_layout_version set default 'glf-concept-20261020-v5';
