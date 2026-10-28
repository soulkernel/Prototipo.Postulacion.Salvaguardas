-- M08: phase 1 does not collect/require administrative costs.
-- Modify only the two stage-blind checks in the original validator. Keep its
-- numeric bounds, the existing percentage/base and every other validation.
-- No payload, snapshot, historical amount or submitted record is updated.
do $m08$
declare
 definition text;
 required_pattern text := $rx$if\s+complete\s+and\s+concept->>field\s+is\s+null\s+then$rx$;
 limit_pattern text := $rx$if\s+\(concept->>'admin_cost'\)::numeric\s+>$rx$;
begin
 definition:=pg_get_functiondef('private.validate_payload_before_phone(jsonb,jsonb,boolean,integer)'::regprocedure);
 if (select count(*) from regexp_matches(definition,required_pattern,'g'))<>1
    or (select count(*) from regexp_matches(definition,limit_pattern,'g'))<>1 then
   raise exception 'GLF_M08_VALIDATOR_CHANGED';
 end if;
 definition:=regexp_replace(definition,required_pattern,
   $replacement$if complete and (stage=2 or field<>'admin_cost') and concept->>field is null then$replacement$);
 definition:=regexp_replace(definition,limit_pattern,
   $replacement$if stage=2 and (concept->>'admin_cost')::numeric >$replacement$);
 execute definition;
end $m08$;
revoke all on function private.validate_payload_before_phone(jsonb,jsonb,boolean,integer) from public,anon,authenticated;

-- Existing documents/versions remain NULL (legacy format). Set the default
-- separately so it applies only to future inserts, never to existing rows.
alter table public.prepared_documents add column concept_layout_version text;
alter table public.prepared_documents alter column concept_layout_version set default 'glf-concept-m08-v1';
alter table public.application_versions add column concept_layout_version text;
alter table public.application_versions alter column concept_layout_version set default 'glf-concept-m08-v1';

-- An old already-prepared/signed revision keeps its format when submitted
-- later. Do not reinterpret its PDF under the new layout just because the
-- submission occurs after M08. Payload equality/signature checks stay intact.
create function private.freeze_concept_layout() returns trigger
language plpgsql security definer set search_path='' as $$
declare prepared_layout text;
begin
 if new.stage=1 then
   select p.concept_layout_version into prepared_layout
   from public.prepared_documents p
   where p.application_id=new.application_id and p.stage=new.stage
     and p.revision=new.revision-1 and p.payload=new.payload-'attachments';
   if found then new.concept_layout_version:=prepared_layout; end if;
 end if;
 return new;
end $$;
revoke all on function private.freeze_concept_layout() from public,anon,authenticated;
create trigger freeze_concept_layout before insert on public.application_versions
for each row execute function private.freeze_concept_layout();
