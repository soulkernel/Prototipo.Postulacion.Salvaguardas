-- Explicit snapshot of the existing TEST dossiers, authorized by the owner.
-- Future applications are not automatically shared with academic accounts.
create table private.academic_application_scope(application_id uuid primary key references public.applications(id) on delete cascade);
alter table private.academic_application_scope enable row level security;
revoke all on private.academic_application_scope from public,anon,authenticated;
insert into private.academic_application_scope select id from public.applications;
create table private.academic_sources(document_name text not null,document_version text not null,primary key(document_name,document_version));
alter table private.academic_sources enable row level security;
revoke all on private.academic_sources from public,anon,authenticated;
insert into private.academic_sources values
('CREF-01_ES_sp-spanish-2012','corpus-f6cce4e7fc6bfee9'),
('CREF-02_ES_2012-ifc-performance-standard-1-es','corpus-be950f1f85db9192'),
('CREF-03_ES_20210614-ifc-ps-guidance-note-1-es','corpus-5ddac41e4d295a62'),
('CREF-04_ES_2012-ifc-performance-standard-2-es','corpus-ca54a92af34249cb'),
('CREF-05_ES_2012-ifc-ps-guidance-note-2-es','corpus-961690b747721c8d'),
('CREF-06_ES_2012-ifc-performance-standard-3-es','corpus-f73d7fd2f793e238'),
('CREF-07_ES_2012-ifc-ps-guidance-note-3-es','corpus-a28b5c40919533b0'),
('CREF-08_ES_2012-ifc-performance-standard-4-es','corpus-96ace82373d9c1df'),
('CREF-09_ES_2012-ifc-ps-guidance-note-4-es','corpus-cfb585abe4fc118d'),
('CREF-10_ES_2012-ifc-performance-standard-5-es','corpus-9aa42d8036048eab'),
('CREF-11_ES_2012-ifc-ps-guidance-note-5-es','corpus-5b7806bff4f49563'),
('CREF-12_ES_2012-ifc-performance-standard-6-es','corpus-7426494dda416b50'),
('CREF-13_ES_20190627-ifc-ps-guidance-note-6-es','corpus-4dea7438f23d1223'),
('CREF-14_ES_2012-ifc-performance-standard-7-es','corpus-ab79eaf54f6e93e1'),
('CREF-15_ES_2012-ifc-ps-guidance-note-7-es','corpus-b3c28894ace00287'),
('CREF-16_ES_2012-ifc-performance-standard-8-es','corpus-d0a58d2b72f314f1'),
('CREF-17_ES_2012-ifc-ps-guidance-note-8-es','corpus-b7d35f6833a7fd74'),
('CREF-19_ES_2007-general-ehs-guidelines-es','corpus-ef6694a11157aec1'),
('CREF-33-41_ES_OIT_CONVENIOS_FICHAS_OPERATIVAS','corpus-9f02db7070137d3b'),
('CREF-43_ES_Estandar_Lista_Verde_UICN_v1.1','corpus-185c04189d64dc7f'),
('CREF-45_ES_BID_MARCO_POLITICA_AMBIENTAL_SOCIAL_FICHA_OPERATIVA','corpus-2a3a7b194ed25d1b'),
('GLF_ANEXO_A_POLITICA_AMBIENTAL_SOCIAL_ES','corpus-21469ae8e870c768'),
('GLF_ANEXO_B_LISTA_EXCLUSION_ES','corpus-05b48237ffae024b'),
('GLF_ANEXO_C_NORMAS_AMBIENTALES_SOCIALES_ES','corpus-ffe1f11808419010'),
('GLF_ANEXO_D_MARCO_JURIDICO_PERMISOS_ES','corpus-41c378f1413484fe'),
('GLF_ANEXO_E_HERRAMIENTA_ESSA_ES','corpus-e622530145ab5e3f'),
('GLF_ANEXO_F_CLAUSULAS_CONVENIOS_SUBVENCION_ES','corpus-60364e61cee1c96f'),
('GLF_ANEXO_G1_PLANTILLA_PLAN_PARTICIPACION_PARTES_INTERESADAS_ES','corpus-c18320214cede8d9'),
('GLF_ANEXO_G2_PLANTILLA_MECANISMO_RECLAMACIONES_ES','corpus-076fcc84c7209365'),
('GLF_ANEXO_G_PLANTILLA_PGAS_ES','corpus-ba170b1580ab9b1a'),
('GLF_ANEXO_H_FUNCIONES_RESPONSABILIDADES_SGAS_ES','corpus-4ab1170fb699238b'),
('GLF_ANEXO_I_HERRAMIENTA_SEGUIMIENTO_AMBIENTAL_SOCIAL_ES','corpus-b59942efa7e35e76'),
('GLF_ANEXO_J_DEFINICIONES_ES','corpus-23cf5d326cab7a42'),
('GLF_ANEXO_K_REFERENCIAS_ES','corpus-17669e4b2d3a12bb'),
('GLF_MANUAL_SGAS_ES','corpus-c8bee784df55b2a6'),
('GUIA_RECUPERACION_SALVAGUARDAS_POR_PROPUESTA_ES','corpus-a33b46973ace4a2b');
create or replace function private.can_read_application(app uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.applications where id=app and
 ((private.is_staff() and submitted_at is not null) or (applicant_id=auth.uid() and private.current_role()='applicant')
 or (private.is_academic() and exists(select 1 from private.academic_application_scope s where s.application_id=app))))
$$;
create function private.academic_call_access(target_call uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_academic() and exists(select 1 from private.academic_application_scope s join public.applications a on a.id=s.application_id where a.call_id=target_call)
$$;
revoke all on function private.academic_call_access(uuid) from public,anon;
grant execute on function private.is_academic(),private.academic_call_access(uuid) to authenticated;
create policy academic_calls_read on public.calls for select to authenticated using(private.academic_call_access(id));
create policy academic_reviews_read on public.technical_reviews for select to authenticated using(private.is_academic() and private.can_read_application(application_id));
create policy academic_decisions_read on public.governance_decisions for select to authenticated using(private.is_academic() and private.can_read_application(application_id));
create policy academic_rag_notes_read on public.rag_review_notes for select to authenticated using(private.is_academic() and private.can_read_application(application_id));
create or replace function public.match_evidence(query_embedding extensions.vector(384), result_limit integer default 6) returns table(id bigint,document_name text,document_version text,locator text,content text,similarity double precision)
language plpgsql stable security definer set search_path='' as $$
begin
 if not private.is_academic() then perform private.require_role(array['sustainability_reviewer','administrator']::public.app_role[]); end if;
 return query select k.id,k.document_name,k.document_version,k.locator,k.content,1-(k.embedding operator(extensions.<=>) query_embedding)
 from public.knowledge_chunks k where k.approved and k.embedding is not null
 and (not private.is_academic() or exists(select 1 from private.academic_sources s where s.document_name=k.document_name and s.document_version=k.document_version))
 order by k.embedding operator(extensions.<=>) query_embedding limit least(greatest(result_limit,1),20);
end $$;
create function public.academic_source_count() returns bigint language plpgsql stable security definer set search_path='' as $$
begin
 if not private.is_academic() then raise exception 'GLF_FORBIDDEN'; end if;
 return (select count(*) from public.knowledge_chunks k join private.academic_sources s using(document_name,document_version) where approved and embedding is not null);
end $$;
revoke all on function public.academic_source_count() from public,anon;
grant execute on function public.academic_source_count() to authenticated;
create function public.academic_call_report(requested_call uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.is_academic() then raise exception 'GLF_FORBIDDEN'; end if;
 with submitted as (
  select a.*,v.payload as submitted_payload from public.applications a
  left join lateral (select av.payload from public.application_versions av where av.application_id=a.id order by av.revision desc limit 1) v on true
  where a.call_id=requested_call and private.can_read_application(a.id)
 ) select jsonb_build_object('cutoff',now(),'call_id',requested_call,
 'received',count(*) filter(where submitted_at is not null),'invited',count(*) filter(where invited_at is not null),
 'phase2_received',count(*) filter(where phase2_submitted_at is not null),'approved',count(*) filter(where approved_at is not null),
 'signed',count(*) filter(where signed_at is not null),'not_selected',count(*) filter(where status='not_selected'),
 'requested_total',coalesce(sum((submitted_payload->'concept'->>'requested_amount')::numeric) filter(where submitted_at is not null),0),
 'approved_total',(select coalesce(sum(d.approved_amount),0) from public.governance_decisions d join public.applications app on app.id=d.application_id where app.call_id=requested_call and private.can_read_application(app.id) and d.decision='approve'),
 'signed_total',(select coalesce(sum(g.approved_amount),0) from public.project_agreements g join public.applications app on app.id=g.application_id where app.call_id=requested_call and private.can_read_application(app.id)),
 'by_type',(select coalesce(jsonb_agg(x),'[]') from (select submitted_payload->'concept'->>'project_type' as project_type,count(*) as received from submitted where submitted_at is not null group by 1 order by 1) x))
 into result from submitted;
 return result;
end $$;

revoke all on function public.academic_call_report(uuid) from public,anon;
grant execute on function public.academic_call_report(uuid) to authenticated;
