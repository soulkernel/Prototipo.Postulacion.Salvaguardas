-- M07: preserve existing payloads, call rules and submitted versions.
-- Incomplete drafts may still be saved, including historical topic values.
-- Completing an application requires its frozen call catalogue; membership
-- validation for nonempty catalogues remains in the existing validator chain.
alter function private.validate_payload(jsonb,jsonb,boolean,integer)
  rename to validate_payload_before_call_topics;
create function private.validate_payload(p jsonb,rules jsonb,complete boolean,stage integer) returns void
language plpgsql security definer set search_path='' as $$
begin
  if complete then
    if jsonb_typeof(rules->'themes') is distinct from 'array' then
      raise exception 'GLF_CALL_THEMES_REQUIRED';
    elsif jsonb_array_length(rules->'themes')=0 then
      raise exception 'GLF_CALL_THEMES_REQUIRED';
    end if;
  end if;
  perform private.validate_payload_before_call_topics(p,rules,complete,stage);
end $$;
revoke all on function private.validate_payload(jsonb,jsonb,boolean,integer),
  private.validate_payload_before_call_topics(jsonb,jsonb,boolean,integer)
  from public,anon,authenticated;
