-- Draft editing, optimistic concurrency and a reviewed publication gate.
alter table public.calls add column revision integer not null default 0;
alter table public.calls alter column opens_at drop not null;
alter table public.calls alter column closes_at drop not null;
alter table public.calls add constraint published_call_dates check(status='draft' or (opens_at is not null and closes_at is not null));
create table private.call_events (
 id uuid primary key default gen_random_uuid(), call_id uuid not null references public.calls(id),
 actor_id uuid not null references public.profiles(id), event_type text not null, revision integer not null,
 created_at timestamptz not null default now()
);
alter table private.call_events enable row level security;
revoke all on private.call_events from public,anon,authenticated;

create function public.save_call_draft(details jsonb, call_id uuid default null, expected_revision integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.calls;
begin
 perform private.require_role(array['grants_manager','administrator']::public.app_role[]);
 if jsonb_typeof(details) is distinct from 'object' or length(details::text)>100000
 or nullif(trim(details->>'code'),'') is null or length(details->>'code')>200
 or jsonb_typeof(details->'rules') is distinct from 'object'
 or jsonb_typeof(details->'phase2_schema') is distinct from 'array' then raise exception 'GLF_INVALID_CALL'; end if;
 if call_id is not null then
  select * into c from public.calls where id=call_id for update;
  if not found or c.status<>'draft' then raise exception 'GLF_INVALID_CALL_STATE'; end if;
  if expected_revision is null or c.revision<>expected_revision then raise exception 'GLF_REVISION_CONFLICT'; end if;
  update public.calls set code=trim(details->>'code'),title_es=coalesce(details->>'title_es',''),title_en=coalesce(details->>'title_en',''),
   description_es=coalesce(details->>'description_es',''),description_en=coalesce(details->>'description_en',''),
   opens_at=nullif(details->>'opens_at','')::timestamptz,closes_at=nullif(details->>'closes_at','')::timestamptz,
   rules_version=coalesce(details->>'rules_version',''),rules=details->'rules',phase2_schema=details->'phase2_schema',revision=revision+1
   where id=call_id returning * into c;
 else
  insert into public.calls(code,title_es,title_en,description_es,description_en,opens_at,closes_at,rules_version,rules,phase2_schema,created_by)
   values(trim(details->>'code'),coalesce(details->>'title_es',''),coalesce(details->>'title_en',''),coalesce(details->>'description_es',''),coalesce(details->>'description_en',''),
   nullif(details->>'opens_at','')::timestamptz,nullif(details->>'closes_at','')::timestamptz,coalesce(details->>'rules_version',''),details->'rules',details->'phase2_schema',auth.uid()) returning * into c;
 end if;
 insert into private.call_events(call_id,actor_id,event_type,revision) values(c.id,auth.uid(),'draft_saved',c.revision);
 return to_jsonb(c);
end $$;

-- Keep the established rule checks and strengthen every publication path.
alter function public.publish_call(uuid) rename to publish_call_rules;
revoke all on function public.publish_call_rules(uuid) from public,anon,authenticated;
create function public.publish_call(call_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare c public.calls;
begin
 perform private.require_role(array['grants_manager','administrator']::public.app_role[]);
 select * into c from public.calls where id=call_id for update;
 if not found or c.status<>'draft' or c.opens_at is null or c.closes_at is null or c.closes_at<=now() then raise exception 'GLF_INVALID_CALL_STATE'; end if;
 if nullif(trim(c.title_es),'') is null or nullif(trim(c.title_en),'') is null
 or nullif(trim(c.description_es),'') is null or nullif(trim(c.description_en),'') is null
 or nullif(trim(c.rules_version),'') is null then raise exception 'GLF_CALL_CONTENT_REQUIRED'; end if;
 if exists(select 1 from jsonb_array_elements_text(c.rules->'applicant_types') t where t not in ('individual','organization')) then raise exception 'GLF_CALL_RULES_REQUIRED'; end if;
 if exists(select 1 from jsonb_array_elements(c.phase2_schema) f where nullif(trim(f->>'label_es'),'') is null or nullif(trim(f->>'label_en'),'') is null) then raise exception 'GLF_INVALID_PHASE2_FIELDS'; end if;
 perform public.publish_call_rules(call_id);
 update public.calls set revision=revision+1 where id=call_id returning * into c;
 insert into private.call_events(call_id,actor_id,event_type,revision) values(c.id,auth.uid(),'published',c.revision);
end $$;
create function public.publish_call_reviewed(call_id uuid,expected_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.calls;
begin
 perform private.require_role(array['grants_manager','administrator']::public.app_role[]);
 select * into c from public.calls where id=call_id for update;
 if not found or expected_revision is null or c.revision<>expected_revision then raise exception 'GLF_REVISION_CONFLICT'; end if;
 perform public.publish_call(call_id);
 select * into c from public.calls where id=call_id;
 return to_jsonb(c);
end $$;
revoke all on function public.save_call_draft(jsonb,uuid,integer),public.publish_call(uuid),public.publish_call_reviewed(uuid,integer) from public,anon;
grant execute on function public.save_call_draft(jsonb,uuid,integer),public.publish_call(uuid),public.publish_call_reviewed(uuid,integer) to authenticated;
