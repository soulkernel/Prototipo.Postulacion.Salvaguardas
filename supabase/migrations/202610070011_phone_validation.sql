-- Preserve payload shape and incomplete drafts; enforce canonical format on completion.
alter function private.validate_payload(jsonb,jsonb,boolean,integer) rename to validate_payload_before_phone;
create function private.validate_payload(p jsonb,rules jsonb,complete boolean,stage integer) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform private.validate_payload_before_phone(p,rules,complete,stage);
 if length(coalesce(p->'concept'->>'phone',''))>32
 or (complete and coalesce(p->'concept'->>'phone','') !~ '^[+][1-9][0-9]{6,14}$')
 then raise exception 'GLF_INVALID_PHONE'; end if;
end $$;
revoke all on function private.validate_payload(jsonb,jsonb,boolean,integer),private.validate_payload_before_phone(jsonb,jsonb,boolean,integer) from public,anon,authenticated;
