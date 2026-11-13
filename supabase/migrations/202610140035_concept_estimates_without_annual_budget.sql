-- Concept notes use independent estimates. Keep any existing annual detail stored,
-- but only reconcile its descriptions, horizon and totals in the full project.
alter function private.validate_payload(jsonb,jsonb,boolean,integer)
  rename to validate_payload_before_concept_estimates;
create function private.validate_payload(p jsonb,rules jsonb,complete boolean,stage integer) returns void
language plpgsql security definer set search_path='' as $$
begin
  if stage=1 and complete then
    -- Retain structural checks for previously stored detail without requiring it.
    perform private.validate_payload_before_concept_estimates(p,rules,false,stage);
    perform private.validate_payload_before_concept_estimates(p-'budget',rules,true,stage);
  else
    perform private.validate_payload_before_concept_estimates(p,rules,complete,stage);
  end if;
end $$;
revoke all on function private.validate_payload(jsonb,jsonb,boolean,integer),
  private.validate_payload_before_concept_estimates(jsonb,jsonb,boolean,integer)
  from public,anon,authenticated;
