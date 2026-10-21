-- New completion/preparation/submission requires at least one linked indicator.
-- Saving incomplete legacy drafts and reading frozen versions remain possible.
-- No application, prepared document, snapshot or stored narrative is rewritten.
do $$
declare definition text;
begin
 definition:=pg_get_functiondef('private.validate_monitoring_plan(jsonb,boolean)'::regprocedure);
 if position('GLF_LINKED_MONITORING_REQUIRED' in definition)=0 then
  if position('if not (c ? ''monitoring_plan'') then return; end if;' in definition)=0 then
   raise exception 'GLF_MONITORING_VALIDATOR_CHANGED';
  end if;
  definition:=replace(definition,
   'if not (c ? ''monitoring_plan'') then return; end if;',
   'if not (c ? ''monitoring_plan'') then
     -- GLF_LINKED_MONITORING_REQUIRED: no inference from legacy narrative.
     if complete then raise exception ''GLF_REQUIRED:monitoring''; end if;
     return;
    end if;');
  execute definition;
 end if;
end $$;
revoke all on function private.validate_monitoring_plan(jsonb,boolean) from public,anon,authenticated;
