-- All mutations use authenticated, explicitly authorized, atomic RPCs.
create function private.require_role(allowed public.app_role[]) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(private.current_role()=any(allowed),false) then
  raise exception 'GLF_FORBIDDEN' using errcode='42501';
 end if;
end $$;

create function public.assign_staff_role(target_user uuid, assigned_role public.app_role) returns void language plpgsql security definer set search_path='' as $$
declare previous public.app_role;
begin
 perform private.require_role(array['administrator']::public.app_role[]);
 if target_user=auth.uid() then raise exception 'GLF_SELF_ROLE_CHANGE_FORBIDDEN' using errcode='42501'; end if;
 select role into previous from public.profiles where id=target_user for update;
 if not found then raise exception 'GLF_NOT_FOUND'; end if;
 update public.profiles set role=assigned_role where id=target_user;
 insert into private.role_events(actor_id,target_id,previous_role,assigned_role) values(auth.uid(),target_user,previous,assigned_role);
end $$;

create function public.create_call(details jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 perform private.require_role(array['grants_manager','administrator']::public.app_role[]);
 if nullif(trim(details->>'code'),'') is null or nullif(trim(details->>'title_es'),'') is null or nullif(trim(details->>'title_en'),'') is null
 or jsonb_typeof(details->'rules') is distinct from 'object' or length(details::text)>100000 then raise exception 'GLF_INVALID_CALL'; end if;
 insert into public.calls(code,title_es,title_en,description_es,description_en,opens_at,closes_at,rules_version,rules,phase2_schema,created_by)
 values(details->>'code',details->>'title_es',details->>'title_en',coalesce(details->>'description_es',''),coalesce(details->>'description_en',''),
 (details->>'opens_at')::timestamptz,(details->>'closes_at')::timestamptz,coalesce(details->>'rules_version','1.0'),details->'rules',coalesce(details->'phase2_schema','[]'),auth.uid())
 returning id into result;
 return result;
end $$;

create function public.publish_call(call_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare c public.calls; category jsonb;
begin
 perform private.require_role(array['grants_manager','administrator']::public.app_role[]);
 select * into c from public.calls where id=call_id for update;
 if not found or c.status<>'draft' or c.closes_at<=now() then raise exception 'GLF_INVALID_CALL_STATE'; end if;
 if jsonb_typeof(c.rules->'categories') is distinct from 'array' or jsonb_array_length(c.rules->'categories')<1
 or jsonb_typeof(c.rules->'applicant_types') is distinct from 'array' or jsonb_array_length(c.rules->'applicant_types')<1
 or nullif(trim(c.rules->>'privacy_es'),'') is null or nullif(trim(c.rules->>'privacy_en'),'') is null
 then raise exception 'GLF_CALL_RULES_REQUIRED'; end if;
 if coalesce((c.rules->>'summary_word_limit')::integer,0) not between 1 and 5000 or coalesce((c.rules->>'max_admin_percent')::numeric,-1) not between 0 and 100 or jsonb_typeof(c.phase2_schema) is distinct from 'array' then raise exception 'GLF_INVALID_CALL_RULES'; end if;
 for category in select value from jsonb_array_elements(c.rules->'categories') loop
  if nullif(category->>'id','') is null or nullif(category->>'label_es','') is null or nullif(category->>'label_en','') is null
  or coalesce((category->>'min_amount')::numeric,-1)<0 or coalesce((category->>'max_months')::integer,0) not between 1 and 36
  or coalesce((category->>'cofinance_percent')::numeric,-1) not between 0 and 100
  or (category->>'max_amount')::numeric<(category->>'min_amount')::numeric
  then raise exception 'GLF_INVALID_CATEGORY'; end if;
 end loop;
 if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(c.rules->'categories')) then raise exception 'GLF_DUPLICATE_CATEGORY'; end if;
 update public.calls set status='published' where id=call_id;
end $$;

create function public.create_application(call_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare c public.calls; result uuid:=gen_random_uuid();
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 perform 1 from public.profiles where id=auth.uid() for update;
 select * into c from public.calls where id=call_id;
 if not found or c.status<>'published' or now()<c.opens_at or now()>=c.closes_at then raise exception 'GLF_CALL_NOT_OPEN'; end if;
 if (select count(*) from public.applications where applicant_id=auth.uid() and public.applications.call_id=create_application.call_id and status='draft')>=10
 then raise exception 'GLF_DRAFT_LIMIT'; end if;
 insert into public.applications(id,reference_code,call_id,applicant_id,rules_snapshot)
 values(result,c.code||'-'||upper(substr(replace(result::text,'-',''),1,12)),c.id,auth.uid(),c.rules||jsonb_build_object('version',c.rules_version));
 insert into public.application_events(application_id,actor_id,event_type) values(result,auth.uid(),'created');
 return result;
end $$;

create function private.validate_payload(p jsonb, rules jsonb, complete boolean) returns void language plpgsql security definer set search_path='' as $$
declare field text; concept jsonb:=p->'concept'; activity jsonb; risk jsonb; measure jsonb; category jsonb; starts date; ends date; months integer;
begin
 if jsonb_typeof(p) is distinct from 'object' or jsonb_typeof(concept) is distinct from 'object' or jsonb_typeof(p->'activities') is distinct from 'array'
 or jsonb_array_length(p->'activities')>100 or length(p::text)>500000 then raise exception 'GLF_INVALID_PAYLOAD'; end if;
 foreach field in array array['title','applicant_type','applicant_name','contact_name','email','phone','address','partners','location','project_type','category_id','summary','objectives','beneficiaries','results','sustainability','alignment','monitoring','environmental_risks','social_risks'] loop
  if concept ? field and jsonb_typeof(concept->field) is distinct from 'string' then raise exception 'GLF_INVALID_TEXT:%',field; end if;
  if length(coalesce(concept->>field,''))>12000 then raise exception 'GLF_TEXT_TOO_LONG:%',field; end if;
  if complete and field<>'partners' and nullif(trim(concept->>field),'') is null then raise exception 'GLF_REQUIRED:%',field; end if;
 end loop;
 foreach field in array array['requested_amount','cofinance_amount','admin_cost'] loop
  if concept->>field is not null and ((concept->>field)::numeric<0 or (concept->>field)::numeric>999999999999.99) then raise exception 'GLF_INVALID_AMOUNT'; end if;
  if complete and concept->>field is null then raise exception 'GLF_REQUIRED:%',field; end if;
 end loop;
 if concept->>'start_date' is not null and concept->>'start_date'<>'' then starts:=(concept->>'start_date')::date; end if;
 if concept->>'end_date' is not null and concept->>'end_date'<>'' then ends:=(concept->>'end_date')::date; end if;
 if starts is not null and ends is not null and ends<starts then raise exception 'GLF_INVALID_DATES'; end if;
 if complete then
  if starts is null or ends is null then raise exception 'GLF_REQUIRED:dates'; end if;
  if (concept->>'requested_amount')::numeric<=0 then raise exception 'GLF_INVALID_AMOUNT'; end if;
  if (concept->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'GLF_INVALID_EMAIL'; end if;
  if not coalesce((rules->'applicant_types') ? (concept->>'applicant_type'),false) then raise exception 'GLF_APPLICANT_TYPE'; end if;
  select value into category from jsonb_array_elements(rules->'categories') where value->>'id'=concept->>'category_id';
  if category is null then raise exception 'GLF_CATEGORY_REQUIRED'; end if;
  if (concept->>'requested_amount')::numeric<(category->>'min_amount')::numeric
    or ((category->>'max_amount') is not null and (concept->>'requested_amount')::numeric>(category->>'max_amount')::numeric) then raise exception 'GLF_CATEGORY_AMOUNT'; end if;
  if ends> (starts+make_interval(months=>(category->>'max_months')::integer)-interval '1 day')::date then raise exception 'GLF_CATEGORY_DURATION'; end if;
  if (concept->>'cofinance_amount')::numeric < (concept->>'requested_amount')::numeric*(category->>'cofinance_percent')::numeric/100 then raise exception 'GLF_COFINANCE_REQUIRED'; end if;
  if (concept->>'admin_cost')::numeric > ((concept->>'requested_amount')::numeric+(concept->>'cofinance_amount')::numeric)*coalesce((rules->>'max_admin_percent')::numeric,10)/100 then raise exception 'GLF_ADMIN_LIMIT'; end if;
  if cardinality(regexp_split_to_array(trim(concept->>'summary'),'\s+'))>coalesce((rules->>'summary_word_limit')::integer,500) then raise exception 'GLF_SUMMARY_WORD_LIMIT'; end if;
  if jsonb_array_length(p->'activities')=0 then raise exception 'GLF_ACTIVITIES_REQUIRED'; end if;
  if p->>'truthful' is distinct from 'true' or p->>'consent' is distinct from 'true' then raise exception 'GLF_DECLARATIONS_REQUIRED'; end if;
 end if;
 for activity in select value from jsonb_array_elements(p->'activities') loop
  perform (activity->>'id')::uuid;
  if jsonb_typeof(activity->'risks') is distinct from 'array' or jsonb_array_length(activity->'risks')>100 then raise exception 'GLF_INVALID_RISKS'; end if;
  if complete and (nullif(trim(activity->>'title'),'') is null or nullif(trim(activity->>'description'),'') is null) then raise exception 'GLF_ACTIVITY_REQUIRED'; end if;
  if complete and jsonb_array_length(activity->'risks')=0 and nullif(trim(activity->>'no_risks_reason'),'') is null then raise exception 'GLF_RISK_OR_JUSTIFICATION_REQUIRED'; end if;
  for risk in select value from jsonb_array_elements(activity->'risks') loop
   perform (risk->>'id')::uuid;
   if not coalesce(risk->>'dimension' in ('environmental','social'),false) then raise exception 'GLF_RISK_DIMENSION'; end if;
   foreach field in array array['probability','severity','residual_probability','residual_severity'] loop
    if risk->>field is not null and (risk->>field)::smallint not between 1 and 5 then raise exception 'GLF_RISK_SCALE'; end if;
    if complete and risk->>field is null then raise exception 'GLF_REQUIRED:%',field; end if;
   end loop;
   foreach field in array array['name','description','location','responsible'] loop
    if length(coalesce(risk->>field,''))>12000 then raise exception 'GLF_TEXT_TOO_LONG'; end if;
    if complete and nullif(trim(risk->>field),'') is null then raise exception 'GLF_REQUIRED:%',field; end if;
   end loop;
   if risk->>'cost' is not null and (risk->>'cost')::numeric<0 then raise exception 'GLF_RISK_COST'; end if;
   if (risk->>'start_quarter')::integer not between 1 and 12 or (risk->>'end_quarter')::integer not between 1 and 12
      or (risk->>'end_quarter')::integer<(risk->>'start_quarter')::integer then raise exception 'GLF_RISK_QUARTERS'; end if;
   if complete and (risk->>'cost' is null or risk->>'start_quarter' is null or risk->>'end_quarter' is null) then raise exception 'GLF_RISK_PLAN_REQUIRED'; end if;
   if complete and starts is not null and ends is not null then
    if (starts+make_interval(months=>((risk->>'end_quarter')::integer-1)*3))::date>ends then raise exception 'GLF_RISK_OUTSIDE_PROJECT'; end if;
   end if;
   if jsonb_typeof(risk->'measures') is distinct from 'array' or jsonb_array_length(risk->'measures')>50 then raise exception 'GLF_INVALID_MEASURES'; end if;
   if complete and jsonb_array_length(risk->'measures')=0 then raise exception 'GLF_MEASURE_REQUIRED'; end if;
   for measure in select value from jsonb_array_elements(risk->'measures') loop
    if measure->>'catalog_id' is not null then
      if not exists(select 1 from public.safeguard_catalog where id=(measure->>'catalog_id')::uuid and active) then raise exception 'GLF_UNAPPROVED_CATALOG_MEASURE'; end if;
    elsif complete and nullif(trim(measure->>'text'),'') is null then raise exception 'GLF_MEASURE_REQUIRED'; end if;
   end loop;
  end loop;
 end loop;
end $$;

create function public.save_application(application_id uuid, expected_revision integer, payload jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare a public.applications; activity jsonb; risk jsonb; measure jsonb; position integer:=0; risk_position integer; measure_position integer; catalog_entry public.safeguard_catalog;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=application_id for update;
 if not found or not private.can_edit_application(a.id) then raise exception 'GLF_APPLICATION_LOCKED' using errcode='42501'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT' using errcode='40001'; end if;
 perform private.validate_payload(payload,a.rules_snapshot,false);
 delete from public.risk_safeguards where risk_id in(select id from public.risks where public.risks.application_id=a.id);
 delete from public.risks where public.risks.application_id=a.id;
 delete from public.activities where public.activities.application_id=a.id;
 for activity in select value from jsonb_array_elements(payload->'activities') loop
  insert into public.activities(id,application_id,title,description,sort_order)
  values((activity->>'id')::uuid,a.id,coalesce(activity->>'title',''),coalesce(activity->>'description',''),position);
  position:=position+1; risk_position:=0;
  for risk in select value from jsonb_array_elements(activity->'risks') loop
   insert into public.risks(id,application_id,activity_id,name,description,dimension,probability,severity,residual_probability,residual_severity,location,cost,responsible,start_quarter,end_quarter)
   values((risk->>'id')::uuid,a.id,(activity->>'id')::uuid,coalesce(risk->>'name',''),coalesce(risk->>'description',''),risk->>'dimension',
   (risk->>'probability')::smallint,(risk->>'severity')::smallint,(risk->>'residual_probability')::smallint,(risk->>'residual_severity')::smallint,
   coalesce(risk->>'location',''),(risk->>'cost')::numeric,coalesce(risk->>'responsible',''),(risk->>'start_quarter')::smallint,(risk->>'end_quarter')::smallint);
   measure_position:=0;
   for measure in select value from jsonb_array_elements(risk->'measures') loop
    if measure->>'catalog_id' is not null then
      select * into catalog_entry from public.safeguard_catalog where id=(measure->>'catalog_id')::uuid and active;
      payload:=jsonb_set(payload,array['activities',(position-1)::text,'risks',risk_position::text,'measures',measure_position::text],jsonb_build_object('catalog_id',catalog_entry.id,'label_es',catalog_entry.label_es,'label_en',catalog_entry.label_en,'normative_reference',catalog_entry.normative_reference));
    else
      payload:=jsonb_set(payload,array['activities',(position-1)::text,'risks',risk_position::text,'measures',measure_position::text],jsonb_build_object('text',coalesce(measure->>'text','')));
    end if;
    if measure->>'catalog_id' is not null or nullif(trim(measure->>'text'),'') is not null then
    insert into public.risk_safeguards(risk_id,catalog_id,proposed_text) values((risk->>'id')::uuid,(measure->>'catalog_id')::uuid,case when measure->>'catalog_id' is null then measure->>'text' else null end);
    end if;
    measure_position:=measure_position+1;
   end loop;
   risk_position:=risk_position+1;
  end loop;
 end loop;
 update public.applications set payload=save_application.payload,revision=revision+1,updated_at=now(),
 status=case when status='selected_for_phase2' then 'phase2_draft'::public.application_status else status end where id=a.id;
 return a.revision+1;
end $$;

create function public.submit_application(application_id uuid, expected_revision integer) returns integer language plpgsql security definer set search_path='' as $$
declare a public.applications; c public.calls; required text; field jsonb;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=application_id for update;
 if not found or not private.can_edit_application(a.id) then raise exception 'GLF_APPLICATION_LOCKED' using errcode='42501'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT' using errcode='40001'; end if;
 perform private.validate_payload(a.payload,a.rules_snapshot,true);
 select * into c from public.calls where id=a.call_id;
 for required in select jsonb_array_elements_text(coalesce(a.rules_snapshot->'required_attachments','[]')) loop
  if not exists(select 1 from public.application_documents where public.application_documents.application_id=a.id and kind=required) then raise exception 'GLF_ATTACHMENT_REQUIRED:%',required; end if;
 end loop;
 if a.stage=2 then
  if jsonb_array_length(c.phase2_schema)=0 then raise exception 'GLF_PHASE2_NOT_CONFIGURED'; end if;
  for field in select value from jsonb_array_elements(c.phase2_schema) loop
   if (field->>'required')::boolean and nullif(trim(a.payload->'phase2'->>(field->>'id')),'') is null then raise exception 'GLF_PHASE2_REQUIRED:%',field->>'id'; end if;
  end loop;
 end if;
 update public.applications set status=case when stage=1 then 'submitted'::public.application_status else 'phase2_submitted'::public.application_status end,
 revision=revision+1,submitted_at=coalesce(submitted_at,now()),phase2_submitted_at=case when stage=2 then now() else phase2_submitted_at end,
 correction_deadline=null,updated_at=now() where id=a.id;
 insert into public.application_versions(application_id,revision,stage,payload,rules_snapshot,actor_id) values(a.id,a.revision+1,a.stage,a.payload||jsonb_build_object('attachments',(select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'file_name',d.file_name,'kind',d.kind,'sha256',d.sha256)),'[]') from public.application_documents d where d.application_id=a.id)),a.rules_snapshot,auth.uid());
 insert into public.application_events(application_id,actor_id,event_type,detail) values(a.id,auth.uid(),'submitted',jsonb_build_object('revision',a.revision+1,'stage',a.stage));
 return a.revision+1;
end $$;

create function public.reopen_application(application_id uuid, deadline timestamptz, reason text) returns void language plpgsql security definer set search_path='' as $$
declare a public.applications; cutoff timestamptz;
begin
 perform private.require_role(array['grants_manager']::public.app_role[]);
 select * into a from public.applications where id=application_id for update;
 if not found or a.status not in ('submitted','under_review','phase2_submitted') or nullif(trim(reason),'') is null then raise exception 'GLF_INVALID_REOPEN'; end if;
 select case when a.stage=1 then closes_at else a.phase2_deadline end into cutoff from public.calls where id=a.call_id;
 if deadline<=now() or deadline>cutoff then raise exception 'GLF_CORRECTION_DEADLINE'; end if;
 update public.applications set correction_deadline=deadline,payload=jsonb_set(jsonb_set(payload,'{consent}','false'),'{truthful}','false'),revision=revision+1,updated_at=now() where id=a.id;
 insert into public.application_events(application_id,actor_id,event_type,detail) values(a.id,auth.uid(),'correction_authorized',jsonb_build_object('deadline',deadline,'reason',reason));
end $$;

create function public.record_review(application_id uuid, expected_revision integer, review_type text, findings text, recommendation text, category text default null) returns uuid language plpgsql security definer set search_path='' as $$
declare a public.applications; result uuid;
begin
 perform private.require_role(case review_type when 'safeguards' then array['sustainability_reviewer']::public.app_role[] when 'grants' then array['grants_manager']::public.app_role[] when 'coordination' then array['project_coordinator']::public.app_role[] else '{}'::public.app_role[] end);
 select * into a from public.applications where id=application_id for update;
 if not found or a.status not in ('submitted','under_review','phase2_submitted') or a.correction_deadline>now() then raise exception 'GLF_REVIEW_STATE'; end if;
 if expected_revision<>a.revision then raise exception 'GLF_VERSION_CONFLICT' using errcode='40001'; end if;
 if not exists(select 1 from public.application_versions v where v.application_id=a.id and v.revision=a.revision) then raise exception 'GLF_RESUBMISSION_REQUIRED'; end if;
 if nullif(trim(findings),'') is null or nullif(trim(recommendation),'') is null then raise exception 'GLF_REVIEW_REQUIRED'; end if;
 if review_type<>'safeguards' and category is not null then raise exception 'GLF_FORBIDDEN' using errcode='42501'; end if;
 insert into public.technical_reviews(application_id,revision,reviewer_id,review_type,findings,recommendation,global_risk_category)
 values(a.id,a.revision,auth.uid(),review_type,findings,recommendation,category) returning id into result;
 if a.status='submitted' then update public.applications set status='under_review',updated_at=now() where id=a.id; end if;
 insert into public.application_events(application_id,actor_id,event_type,detail) values(a.id,auth.uid(),'review_recorded',jsonb_build_object('review_id',result,'review_type',review_type));
 return result;
end $$;

create function public.record_decision(application_id uuid, expected_revision integer, body text, decision text, reference text, rationale text, invitation_deadline timestamptz default null, approved_amount numeric default null) returns uuid language plpgsql security definer set search_path='' as $$
declare a public.applications; result uuid; c public.calls;
begin
 perform private.require_role(array['committee_member']::public.app_role[]);
 select * into a from public.applications where id=application_id for update;
 if not found or a.correction_deadline>now() then raise exception 'GLF_DECISION_STATE'; end if;
 if expected_revision<>a.revision then raise exception 'GLF_VERSION_CONFLICT' using errcode='40001'; end if;
 if not exists(select 1 from public.application_versions v where v.application_id=a.id and v.revision=a.revision) then raise exception 'GLF_RESUBMISSION_REQUIRED'; end if;
 if nullif(trim(reference),'') is null or nullif(trim(rationale),'') is null then raise exception 'GLF_DECISION_EVIDENCE_REQUIRED'; end if;
 if decision in ('invite','not_select','recommend') and (a.stage<>1 or a.status not in ('submitted','under_review')) then raise exception 'GLF_DECISION_STATE'; end if;
 if decision in ('approve','reject') and (a.stage<>2 or a.status<>'phase2_submitted') then raise exception 'GLF_DECISION_STATE'; end if;
 if body='CAT' and decision<>'recommend' then raise exception 'GLF_CAT_RECOMMENDATION_ONLY'; end if;
 if body not in ('committee','council','CAT') then raise exception 'GLF_DECISION_BODY'; end if;
 if decision<>'recommend' and not exists(select 1 from public.technical_reviews r where r.application_id=a.id and r.revision=a.revision and r.review_type='safeguards') then raise exception 'GLF_TECHNICAL_REVIEW_REQUIRED'; end if;
 if decision='invite' then
  select * into c from public.calls where id=a.call_id;
  if invitation_deadline is null or invitation_deadline<=now() or jsonb_array_length(c.phase2_schema)=0 then raise exception 'GLF_PHASE2_CONFIGURATION_REQUIRED'; end if;
 end if;
 if decision='approve' and coalesce(approved_amount,0)<=0 then raise exception 'GLF_APPROVED_AMOUNT_REQUIRED'; end if;
 insert into public.governance_decisions(application_id,revision,body,decision,reference,rationale,approved_amount,recorded_by)
 values(a.id,a.revision,body,decision,reference,rationale,case when decision='approve' then approved_amount else null end,auth.uid()) returning id into result;
 if decision='invite' then update public.applications set status='selected_for_phase2',stage=2,payload=jsonb_set(jsonb_set(payload,'{consent}','false'),'{truthful}','false'),invited_at=now(),phase2_deadline=invitation_deadline,revision=revision+1,updated_at=now() where id=a.id;
 elsif decision in ('not_select','reject') then update public.applications set status='not_selected',revision=revision+1,updated_at=now() where id=a.id;
 elsif decision='approve' then update public.applications set status='approved',approved_at=now(),revision=revision+1,updated_at=now() where id=a.id;
 end if;
 insert into public.application_events(application_id,actor_id,event_type,detail) values(a.id,auth.uid(),'decision_recorded',jsonb_build_object('decision',decision,'reference',reference));
 return result;
end $$;
-- Revoke Postgres's default PUBLIC execution on every exposed mutator.
revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.current_role(),private.is_staff(),private.can_read_application(uuid),private.can_edit_application(uuid) to authenticated;
revoke all on function public.assign_staff_role(uuid,public.app_role),public.create_call(jsonb),public.publish_call(uuid),public.create_application(uuid),
 public.save_application(uuid,integer,jsonb),public.submit_application(uuid,integer),public.reopen_application(uuid,timestamptz,text),
 public.record_review(uuid,integer,text,text,text,text),public.record_decision(uuid,integer,text,text,text,text,timestamptz,numeric) from public,anon;
grant execute on function public.assign_staff_role(uuid,public.app_role),public.create_call(jsonb),public.publish_call(uuid),public.create_application(uuid),
 public.save_application(uuid,integer,jsonb),public.submit_application(uuid,integer),public.reopen_application(uuid,timestamptz,text),
 public.record_review(uuid,integer,text,text,text,text),public.record_decision(uuid,integer,text,text,text,text,timestamptz,numeric) to authenticated;
