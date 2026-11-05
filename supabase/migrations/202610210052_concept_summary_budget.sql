-- Approved summary budget for concept notes. Annual phase-two detail is preserved.
-- No payload, prepared document, sent version, signature or historical value is updated.
create function private.validate_summary_budget(p jsonb, complete boolean, stage integer)
returns void language plpgsql security definer set search_path='' as $$
declare b jsonb:=p->'concept'->'summary_budget'; e jsonb; field text;
 total numeric:=0; fees numeric:=0; expected numeric; glf numeric;
begin
 if b is null then
   if complete and stage=1 then raise exception 'GLF_REQUIRED:summary_budget'; end if;
   return;
 end if;
 if jsonb_typeof(b) is distinct from 'object' or b->>'version' is distinct from 'glf-summary-v1'
 or b->>'currency' is distinct from 'USD' or jsonb_typeof(b->'entries') is distinct from 'array'
 or jsonb_array_length(b->'entries')>100 then raise exception 'GLF_INVALID_SUMMARY_BUDGET'; end if;
 if exists(select 1 from jsonb_object_keys(b) k where k not in('version','currency','entries','administrative','other_remuneration','sgas')) then raise exception 'GLF_INVALID_SUMMARY_BUDGET'; end if;
 foreach field in array array['administrative','other_remuneration','sgas'] loop
   if not b ? field or (b->field<>'null'::jsonb and (jsonb_typeof(b->field)<>'number' or ((b->>field)::numeric<0 or trunc((b->>field)::numeric)<>(b->>field)::numeric) or (b->>field)::numeric>99999999999999)) then raise exception 'GLF_INVALID_SUMMARY_BUDGET'; end if;
   if complete and stage=1 and b->field='null'::jsonb then raise exception 'GLF_REQUIRED:summary_budget_%',field; end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(b->'entries') x group by lower(x->>'activity_id') having count(*)>1) then raise exception 'GLF_INVALID_SUMMARY_BUDGET'; end if;
 for e in select * from jsonb_array_elements(b->'entries') loop
   if jsonb_typeof(e) is distinct from 'object' or coalesce(e->>'activity_id','') !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
   or exists(select 1 from jsonb_object_keys(e) k where k not in('activity_id','goods','services','consultancies','fees')) then raise exception 'GLF_INVALID_SUMMARY_BUDGET'; end if;
   foreach field in array array['goods','services','consultancies','fees'] loop
     if not e ? field or (e->field<>'null'::jsonb and (jsonb_typeof(e->field)<>'number' or ((e->>field)::numeric<0 or trunc((e->>field)::numeric)<>(e->>field)::numeric) or (e->>field)::numeric>99999999999999)) then raise exception 'GLF_INVALID_SUMMARY_BUDGET'; end if;
     if complete and stage=1 and e->field='null'::jsonb then raise exception 'GLF_REQUIRED:summary_budget_activity'; end if;
     total:=total+coalesce((e->>field)::numeric,0);
   end loop;
   fees:=fees+coalesce((e->>'fees')::numeric,0);
 end loop;
 if total>199999999999998 then raise exception 'GLF_INVALID_SUMMARY_BUDGET'; end if;
 if not complete or stage<>1 then return; end if;
 if jsonb_array_length(p->'activities')=0 then raise exception 'GLF_REQUIRED:summary_budget_activities'; end if;
 if exists(select 1 from jsonb_array_elements(b->'entries') x where not exists(select 1 from jsonb_array_elements(p->'activities') a where a->>'id'=x->>'activity_id')) then raise exception 'GLF_REQUIRED:summary_budget_unlinked'; end if;
 if exists(select 1 from jsonb_array_elements(p->'activities') a where not exists(select 1 from jsonb_array_elements(b->'entries') x where x->>'activity_id'=a->>'id')) then raise exception 'GLF_REQUIRED:summary_budget_activity'; end if;
 glf:=round((p->'concept'->>'requested_amount')::numeric*100);
 expected:=glf+round((p->'concept'->>'cofinance_amount')::numeric*100);
 if expected is null then raise exception 'GLF_REQUIRED:summary_budget_reference'; end if;
 if total<>expected then raise exception 'GLF_REQUIRED:summary_budget_totals'; end if;
 if (b->>'administrative')::numeric*10>expected then raise exception 'GLF_REQUIRED:summary_budget_admin_limit'; end if;
 if (fees+(b->>'other_remuneration')::numeric)*10>glf*3 then raise exception 'GLF_REQUIRED:summary_budget_remuneration_limit'; end if;
 if (b->>'other_remuneration')::numeric>total-fees then raise exception 'GLF_REQUIRED:summary_budget_remuneration_subset'; end if;
 if (b->>'sgas')::numeric>total then raise exception 'GLF_REQUIRED:summary_budget_sgas_subset'; end if;
end $$;
alter function private.validate_payload(jsonb,jsonb,boolean,integer)
 rename to validate_payload_before_summary_budget;
create function private.validate_payload(p jsonb,rules jsonb,complete boolean,stage integer)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.validate_payload_before_summary_budget(p,rules,complete,stage);
 perform private.validate_summary_budget(p,complete,stage);
end $$;
revoke all on function private.validate_summary_budget(jsonb,boolean,integer),
 private.validate_payload(jsonb,jsonb,boolean,integer),
 private.validate_payload_before_summary_budget(jsonb,jsonb,boolean,integer) from public,anon,authenticated;
alter table public.prepared_documents alter column concept_layout_version set default 'glf-concept-20261020-v7';
alter table public.application_versions alter column concept_layout_version set default 'glf-concept-20261020-v7';
