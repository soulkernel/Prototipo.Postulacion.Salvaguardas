-- Ulf clarification supplied by the user on 2026-10-06: A-G at screening, A-Q at full proposal.
create function private.validate_payload(p jsonb, rules jsonb, complete boolean, stage integer) returns void language plpgsql security definer set search_path='' as $$
declare field text; concept jsonb:=p->'concept'; activity jsonb; risk jsonb; measure jsonb; category jsonb; starts date; ends date; months integer;
begin
 if stage not in (1,2) then raise exception 'GLF_INVALID_STAGE'; end if;
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
    if complete and (stage=2 or field in ('probability','severity')) and risk->>field is null then raise exception 'GLF_REQUIRED:%',field; end if;
   end loop;
   foreach field in array array['name','description','location','responsible'] loop
    if length(coalesce(risk->>field,''))>12000 then raise exception 'GLF_TEXT_TOO_LONG'; end if;
    if complete and (stage=2 or field in ('name','description')) and nullif(trim(risk->>field),'') is null then raise exception 'GLF_REQUIRED:%',field; end if;
   end loop;
   if risk->>'cost' is not null and (risk->>'cost')::numeric<0 then raise exception 'GLF_RISK_COST'; end if;
   if (risk->>'start_quarter')::integer not between 1 and 12 or (risk->>'end_quarter')::integer not between 1 and 12
      or (risk->>'end_quarter')::integer<(risk->>'start_quarter')::integer then raise exception 'GLF_RISK_QUARTERS'; end if;
   if complete and stage=2 and (risk->>'cost' is null or risk->>'start_quarter' is null or risk->>'end_quarter' is null) then raise exception 'GLF_RISK_PLAN_REQUIRED'; end if;
   if complete and stage=2 and starts is not null and ends is not null then
    if (starts+make_interval(months=>((risk->>'end_quarter')::integer-1)*3))::date>ends then raise exception 'GLF_RISK_OUTSIDE_PROJECT'; end if;
   end if;
   if jsonb_typeof(risk->'measures') is distinct from 'array' or jsonb_array_length(risk->'measures')>50 then raise exception 'GLF_INVALID_MEASURES'; end if;
   if complete and stage=2 and jsonb_array_length(risk->'measures')=0 then raise exception 'GLF_MEASURE_REQUIRED'; end if;
   if stage=1 and (jsonb_array_length(risk->'measures')>0 or risk->>'residual_probability' is not null or risk->>'residual_severity' is not null or risk->>'cost' is not null or risk->>'start_quarter' is not null or risk->>'end_quarter' is not null or coalesce(trim(risk->>'location'),'')<>'' or coalesce(trim(risk->>'responsible'),'')<>'') then raise exception 'GLF_SCREENING_ONLY'; end if;
   for measure in select value from jsonb_array_elements(risk->'measures') loop
    if measure->>'catalog_id' is not null then
      if not exists(select 1 from public.safeguard_catalog where id=(measure->>'catalog_id')::uuid and active) then raise exception 'GLF_UNAPPROVED_CATALOG_MEASURE'; end if;
    elsif complete and nullif(trim(measure->>'text'),'') is null then raise exception 'GLF_MEASURE_REQUIRED'; end if;
   end loop;
  end loop;
 end loop;
end $$;

create or replace function public.save_application(application_id uuid, expected_revision integer, payload jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare a public.applications; activity jsonb; risk jsonb; measure jsonb; position integer:=0; risk_position integer; measure_position integer; catalog_entry public.safeguard_catalog;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=application_id for update;
 if not found or not private.can_edit_application(a.id) then raise exception 'GLF_APPLICATION_LOCKED' using errcode='42501'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT' using errcode='40001'; end if;
 perform private.validate_payload(payload,a.rules_snapshot,false,a.stage);
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

create or replace function public.submit_application(application_id uuid, expected_revision integer) returns integer language plpgsql security definer set search_path='' as $$
declare a public.applications; c public.calls; required text; field jsonb;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=application_id for update;
 if not found or not private.can_edit_application(a.id) then raise exception 'GLF_APPLICATION_LOCKED' using errcode='42501'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT' using errcode='40001'; end if;
 perform private.validate_payload(a.payload,a.rules_snapshot,true,a.stage);
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


revoke all on function private.validate_payload(jsonb,jsonb,boolean,integer) from public,anon,authenticated;
