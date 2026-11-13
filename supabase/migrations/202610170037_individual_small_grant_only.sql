-- M01, GLF procedures 2025 section 4. No data/snapshot rewrites.
-- Incomplete and historical drafts remain editable, without recategorization.
-- All complete validation paths (prepare and submit, both stages) enforce M01.
alter function private.validate_payload(jsonb,jsonb,boolean,integer)
  rename to validate_payload_before_individual_small;
create function private.validate_payload(p jsonb,rules jsonb,complete boolean,stage integer) returns void
language plpgsql security definer set search_path='' as $$
declare c jsonb:=p->'concept';
begin
  if complete and c->>'applicant_type'='individual' then
    if c->>'category_id' is distinct from 'small' then
      raise exception 'GLF_INDIVIDUAL_SMALL_ONLY';
    end if;
    if jsonb_typeof(c->'requested_amount')='number' and (c->>'requested_amount')::numeric>100000 then
      raise exception 'GLF_INDIVIDUAL_SMALL_ONLY';
    end if;
  end if;
  perform private.validate_payload_before_individual_small(p,rules,complete,stage);
end $$;
revoke all on function private.validate_payload(jsonb,jsonb,boolean,integer),
  private.validate_payload_before_individual_small(jsonb,jsonb,boolean,integer)
  from public,anon,authenticated;
