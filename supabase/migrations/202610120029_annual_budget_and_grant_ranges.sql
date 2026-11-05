-- New applications only: preserve every existing draft and submitted snapshot.
create or replace function public.create_application(call_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare c public.calls; result uuid:=gen_random_uuid(); updated_rules jsonb;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 perform 1 from public.profiles where id=auth.uid() for update;
 select * into c from public.calls where id=call_id;
 if not found or c.status<>'published' or now()<c.opens_at or now()>=c.closes_at then raise exception 'GLF_CALL_NOT_OPEN'; end if;
 if (select count(*) from public.applications where applicant_id=auth.uid() and public.applications.call_id=create_application.call_id and status='draft')>=10 then raise exception 'GLF_DRAFT_LIMIT'; end if;
 updated_rules=c.rules||jsonb_build_object('version',c.rules_version,'grant_rule_version','glf-2025-v1','categories',(select jsonb_agg(case when cat->>'id'='medium' then cat||'{"min_amount":100000.01,"max_amount":250000}'::jsonb when cat->>'id'='large' then cat||'{"min_amount":250000.01}'::jsonb else cat end order by ord) from jsonb_array_elements(c.rules->'categories') with ordinality r(cat,ord)));
 insert into public.applications(id,reference_code,call_id,applicant_id,rules_snapshot) values(result,c.code||'-'||upper(substr(replace(result::text,'-',''),1,12)),c.id,auth.uid(),updated_rules);
 insert into public.application_events(application_id,actor_id,event_type) values(result,auth.uid(),'created');
 return result;
end $$;
alter function private.validate_payload(jsonb,jsonb,boolean,integer) rename to validate_payload_before_annual_budget;
create function private.validate_payload(p jsonb,rules jsonb,complete boolean,stage integer) returns void language plpgsql security definer set search_path='' as $$
declare b jsonb:=p->'budget'; l jsonb; a jsonb; r jsonb; glf numeric:=0; other numeric:=0; admin numeric:=0; years integer; duration_years integer;
begin
 perform private.validate_payload_before_annual_budget(p,rules,complete,stage);
 if complete and jsonb_typeof(rules->'themes')='array' and jsonb_array_length(rules->'themes')>0 and not exists(select 1 from jsonb_array_elements(rules->'themes') t where t->>'id'=p->'concept'->>'project_type') then raise exception 'GLF_INVALID_PROJECT_THEME'; end if;
 if b is not null then
 if jsonb_typeof(b) is distinct from 'object' or b->>'version' is distinct from 'glf-annual-v1' or b->>'currency' is distinct from 'USD' or coalesce(b->>'years','') !~ '^[1-3]$' or jsonb_typeof(b->'lines') is distinct from 'array' then raise exception 'GLF_INVALID_BUDGET'; end if;
 years=(b->>'years')::integer;
 if jsonb_array_length(b->'lines')>300 then raise exception 'GLF_INVALID_BUDGET'; end if;
 if exists(select 1 from jsonb_array_elements(b->'lines') x group by x->>'id' having count(*)>1) then raise exception 'GLF_DUPLICATE_BUDGET_LINE'; end if;
 for l in select * from jsonb_array_elements(b->'lines') loop
 if jsonb_typeof(l) is distinct from 'object' or coalesce(l->>'id','') !~ '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$' or coalesce(l->>'year','') !~ '^[1-3]$' or l->>'category' not in('personnel','equipment','training','consultancy','services','travel','administration') or l->>'category' is null or l->>'remuneration' not in('yes','no','pending') or l->>'remuneration' is null or jsonb_typeof(l->'description') is distinct from 'string' or length(l->>'description')>2000 or jsonb_typeof(l->'glf') is distinct from 'number' or jsonb_typeof(l->'other') is distinct from 'number' or coalesce(l->>'glf','') !~ '^[0-9]{1,14}$' or coalesce(l->>'other','') !~ '^[0-9]{1,14}$' then raise exception 'GLF_INVALID_BUDGET_LINE'; end if;
 if (l->>'year')::int>years then raise exception 'GLF_BUDGET_YEAR'; end if;
 glf=glf+(l->>'glf')::numeric; other=other+(l->>'other')::numeric;
 if l->>'category'='administration' then admin=admin+(l->>'glf')::numeric+(l->>'other')::numeric; end if;
 end loop;
 if glf>99999999999999 or other>99999999999999 then raise exception 'GLF_INVALID_BUDGET'; end if;
 if complete and jsonb_array_length(b->'lines')>0 then
 if exists(select 1 from jsonb_array_elements(b->'lines') x where btrim(x->>'description')='') then raise exception 'GLF_BUDGET_DESCRIPTION'; end if;
 if glf is distinct from ((p->'concept'->>'requested_amount')::numeric*100) or other is distinct from ((p->'concept'->>'cofinance_amount')::numeric*100) or admin is distinct from ((p->'concept'->>'admin_cost')::numeric*100) then raise exception 'GLF_BUDGET_TOTALS'; end if;
 duration_years=case when (p->'concept'->>'end_date')::date <= (p->'concept'->>'start_date')::date + interval '1 year' - interval '1 day' then 1 when (p->'concept'->>'end_date')::date <= (p->'concept'->>'start_date')::date + interval '2 years' - interval '1 day' then 2 else 3 end;
 if years>least(3,duration_years) then raise exception 'GLF_BUDGET_YEAR'; end if;
 end if;
 end if;
 for a in select * from jsonb_array_elements(p->'activities') loop
 for r in select * from jsonb_array_elements(a->'risks') loop
 if coalesce(r->>'performance_standard','')<>'' and not exists(select 1 from public.safeguard_catalog c where c.normative_reference=r->>'performance_standard') then raise exception 'GLF_INVALID_PERFORMANCE_STANDARD'; end if;
 end loop; end loop;
end $$;
revoke all on function private.validate_payload(jsonb,jsonb,boolean,integer),private.validate_payload_before_annual_budget(jsonb,jsonb,boolean,integer) from public,anon,authenticated;
