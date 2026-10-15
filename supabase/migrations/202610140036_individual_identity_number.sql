-- Add a conditional identity number to future submissions. Existing versions
-- and incomplete drafts remain intact; numbers are strings to retain leading zeros.
alter function private.validate_payload(jsonb,jsonb,boolean,integer)
  rename to validate_payload_before_identity_number;
create function private.validate_payload(p jsonb,rules jsonb,complete boolean,stage integer) returns void
language plpgsql security definer set search_path='' as $$
declare c jsonb:=p->'concept';
begin
  perform private.validate_payload_before_identity_number(p,rules,complete,stage);
  if c ? 'identity_number' and (jsonb_typeof(c->'identity_number') is distinct from 'string' or length(c->>'identity_number')>10) then
    raise exception 'GLF_INVALID_IDENTITY_NUMBER';
  end if;
  if complete and c->>'applicant_type'='individual' and coalesce(c->>'identity_number','') !~ '^[0-9]{10}$' then
    raise exception 'GLF_IDENTITY_NUMBER_REQUIRED';
  end if;
end $$;
revoke all on function private.validate_payload(jsonb,jsonb,boolean,integer),
  private.validate_payload_before_identity_number(jsonb,jsonb,boolean,integer)
  from public,anon,authenticated;
