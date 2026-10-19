-- M13: optional complementary instruments, attached only to the v2 general objective.
-- No record, snapshot, identifier or existing requirement is changed.
alter function private.validate_payload(jsonb,jsonb,boolean,integer)
  rename to validate_payload_before_other_instruments;
create function private.validate_payload(p jsonb,rules jsonb,complete boolean,stage integer) returns void
language plpgsql security definer set search_path='' as $$
declare s jsonb:=p->'concept'->'strategic_alignment'; o jsonb; item jsonb; ids uuid[]; item_id uuid;
begin
 perform private.validate_payload_before_other_instruments(p,rules,complete,stage);
 if s is null then return; end if;
 for o in select value from jsonb_array_elements(s->'objectives') loop
  if not (o ? 'other_instruments') then continue; end if;
  if jsonb_typeof(o->'other_instruments') is distinct from 'array' then raise exception 'GLF_INVALID_OTHER_INSTRUMENT'; end if;
  if jsonb_array_length(o->'other_instruments')>10 then raise exception 'GLF_INVALID_OTHER_INSTRUMENT'; end if;
  if jsonb_array_length(o->'other_instruments')>0 and
     (s->>'version'<>'pg2030-ods-general-v2' or o->>'kind'<>'general') then raise exception 'GLF_INVALID_OTHER_INSTRUMENT'; end if;
  ids:=array[]::uuid[];
  for item in select value from jsonb_array_elements(o->'other_instruments') loop
   if jsonb_typeof(item) is distinct from 'object' then raise exception 'GLF_INVALID_OTHER_INSTRUMENT'; end if;
   if exists(select 1 from jsonb_object_keys(item) k where k not in ('id','name','objective'))
      or jsonb_typeof(item->'id') is distinct from 'string'
      or (item->>'id') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
      or jsonb_typeof(item->'name') is distinct from 'string' or length(item->>'name')>2000
      or jsonb_typeof(item->'objective') is distinct from 'string' or length(item->>'objective')>2000
     then raise exception 'GLF_INVALID_OTHER_INSTRUMENT'; end if;
   item_id:=(item->>'id')::uuid;
   if item_id=any(ids) then raise exception 'GLF_INVALID_OTHER_INSTRUMENT'; end if;
   ids:=array_append(ids,item_id);
   if complete and (nullif(trim(item->>'name'),'') is null or nullif(trim(item->>'objective'),'') is null)
     then raise exception 'GLF_OTHER_INSTRUMENT_REQUIRED'; end if;
  end loop;
 end loop;
end $$;
revoke all on function private.validate_payload(jsonb,jsonb,boolean,integer),
 private.validate_payload_before_other_instruments(jsonb,jsonb,boolean,integer) from public,anon,authenticated;
