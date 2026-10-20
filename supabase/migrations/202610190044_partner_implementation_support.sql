-- Add partner implementation support to the existing stable-ID contract.
-- Drafts remain incomplete-capable. No rows, files, versions or permissions are changed.
do $$
declare definition text; updated text;
begin
 definition:=pg_get_functiondef('private.validate_payload_before_call_topics(jsonb,jsonb,boolean,integer)'::regprocedure);
 if position($pattern$(row-'id'-'name')<>'{}'::jsonb$pattern$ in definition)=0
   or position('ids:=array_append(ids,lower(row->>''id''));' in definition)=0 then
   raise exception 'GLF_PARTNER_SUPPORT_VALIDATOR_CHANGED';
 end if;
 updated:=replace(definition,$pattern$(row-'id'-'name')<>'{}'::jsonb$pattern$,$replacement$(row-'id'-'name'-'support')<>'{}'::jsonb$replacement$);
 updated:=replace(updated,'ids:=array_append(ids,lower(row->>''id''));', $replacement$
   if row ? 'support' and (jsonb_typeof(row->'support') is distinct from 'string' or length(row->>'support')>12000) then raise exception 'GLF_INVALID_PARTNERS'; end if;
   if complete and nullif(trim(row->>'support'),'') is null then raise exception 'GLF_REQUIRED:partners'; end if;
   ids:=array_append(ids,lower(row->>'id'));
 $replacement$);
 execute updated;
end $$;
revoke all on function private.validate_payload_before_call_topics(jsonb,jsonb,boolean,integer) from public,anon,authenticated;
