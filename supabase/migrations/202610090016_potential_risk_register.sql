-- Optional structured registry; historical textual payloads remain compatible.
alter function private.validate_payload(jsonb,jsonb,boolean,integer) rename to validate_payload_before_risk_register;
create function private.validate_payload(p jsonb,rules jsonb,complete boolean,stage integer) returns void
language plpgsql security definer set search_path='' as $$
declare rows jsonb:=p->'concept'->'risk_register'; item jsonb; activity jsonb; risk jsonb; source jsonb; ids uuid[]:=array[]::uuid[]; used uuid[]; rid uuid;
begin
 perform private.validate_payload_before_risk_register(p,rules,complete,stage);
 if rows is null then return; end if;
 if jsonb_typeof(rows) is distinct from 'array' then raise exception 'GLF_INVALID_RISK_REGISTER'; end if;
 if jsonb_array_length(rows)>100 then raise exception 'GLF_INVALID_RISK_REGISTER'; end if;
 for item in select value from jsonb_array_elements(rows) loop
  rid:=(item->>'id')::uuid;
  if rid is null or rid=any(ids) or item->>'dimension' is null or item->>'dimension' not in ('environmental','social')
  or jsonb_typeof(item->'name') is distinct from 'string' or length(item->>'name')>2000 then raise exception 'GLF_INVALID_RISK_REGISTER'; end if;
  ids:=array_append(ids,rid);
  if complete and nullif(trim(item->>'name'),'') is null then raise exception 'GLF_RISK_REGISTER_INCOMPLETE'; end if;
  if complete and not exists(select 1 from jsonb_array_elements(p->'activities') a, jsonb_array_elements(a->'risks') r where r->>'source_id'=rid::text) then raise exception 'GLF_RISK_REGISTER_INCOMPLETE'; end if;
 end loop;
 for activity in select value from jsonb_array_elements(p->'activities') loop
  used:=array[]::uuid[];
  for risk in select value from jsonb_array_elements(activity->'risks') loop
   if risk->>'source_id' is null then
    if complete then raise exception 'GLF_RISK_REGISTER_INCOMPLETE'; end if;
   else
    rid:=(risk->>'source_id')::uuid;
    select value into source from jsonb_array_elements(rows) where value->>'id'=rid::text;
    if source is null or rid=any(used) or risk->>'name' is distinct from source->>'name' or risk->>'dimension' is distinct from source->>'dimension' then raise exception 'GLF_INVALID_RISK_REFERENCE'; end if;
    used:=array_append(used,rid);
   end if;
  end loop;
 end loop;
end $$;
revoke all on function private.validate_payload(jsonb,jsonb,boolean,integer) from public,anon,authenticated;
revoke all on function private.validate_payload_before_risk_register(jsonb,jsonb,boolean,integer) from public,anon,authenticated;
