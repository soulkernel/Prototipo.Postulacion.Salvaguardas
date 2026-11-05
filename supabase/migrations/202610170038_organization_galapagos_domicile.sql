-- M03 (supersedes M02): no updates to existing applications or frozen versions.
-- Reject new incompatible writes, including drafts; users correct them explicitly.
alter function private.validate_payload(jsonb,jsonb,boolean,integer)
  rename to validate_payload_before_organization_domicile;
create function private.validate_payload(p jsonb,rules jsonb,complete boolean,stage integer) returns void
language plpgsql security definer set search_path='' as $$
begin
  if p->'concept'->>'applicant_type'='organization'
     and p->'concept'->>'province' is distinct from 'Galápagos' then
    raise exception 'GLF_ORGANIZATION_PROVINCE';
  end if;
  perform private.validate_payload_before_organization_domicile(p,rules,complete,stage);
end $$;
revoke all on function private.validate_payload(jsonb,jsonb,boolean,integer),
  private.validate_payload_before_organization_domicile(jsonb,jsonb,boolean,integer)
  from public,anon,authenticated;
