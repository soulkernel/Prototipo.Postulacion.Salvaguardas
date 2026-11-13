begin;

-- Read models project only the current row. Caller RLS applies to both tables;
-- no duplicate payloads or unrestricted SECURITY DEFINER access is introduced.
create or replace view public.latest_submitted_applications
with (security_invoker = true) as
select a.id, a.call_id, a.reference_code, a.status, v.id as version_id,
  v.revision, v.stage, v.submitted_at,
  coalesce(v.payload #>> '{concept,title}', '') as title,
  coalesce(v.payload #>> '{concept,category_id}', '') as category,
  coalesce(nullif(v.payload #>> '{concept,applicant_name}', ''), v.payload #>> '{concept,contact_name}', '') as proponent,
  v.payload
from public.applications a
join lateral (
  select id, revision, stage, submitted_at, payload
  from public.application_versions
  where application_id = a.id
  order by revision desc, id desc limit 1
) v on true
where a.submitted_at is not null;

create or replace view public.applicant_application_summaries
with (security_invoker = true) as
select a.id, a.applicant_id, a.reference_code, a.status, a.updated_at,
  a.submitted_at, a.revision, a.stage, a.deletion_pending,
  coalesce(a.payload #>> '{concept,title}', '') as title,
  coalesce(a.payload #>> '{concept,category_id}', '') as category,
  exists(select 1 from public.application_versions v where v.application_id = a.id) as has_versions
from public.applications a;

revoke all on public.latest_submitted_applications, public.applicant_application_summaries from public, anon;
grant select on public.latest_submitted_applications, public.applicant_application_summaries to authenticated;

-- Same criterion identifiers/answer schema, aligned with the approved phase-one
-- form. Existing review answers remain valid; phase two is unaffected.
update public.review_templates set criteria = (
  select jsonb_agg(case item->>'id'
    when 'budget' then jsonb_set(item, '{text}', to_jsonb('¿Se incluye el presupuesto resumido y coincide con los montos declarados?'::text))
    when 'cofinance' then jsonb_set(item, '{text}', to_jsonb('¿El cofinanciamiento cumple lo requerido para la categoría de subvención?'::text))
    else item end order by position)
  from jsonb_array_elements(criteria) with ordinality as criterion(item, position)
) where stage = 1 and kind = 'administrative';

notify pgrst, 'reload schema';
commit;
