-- Explicit, resumable deletion of ONE draft partner and its unsubmitted letters.
-- Storage objects must be removed through the Storage API, never by SQL.
create table private.partner_removals (
 application_id uuid primary key references public.applications(id) on delete cascade,
 partner_id uuid not null, actor_id uuid not null references public.profiles(id),
 revision integer not null, document_ids uuid[] not null, paths text[] not null,
 created_at timestamptz not null default now()
);
alter table private.partner_removals enable row level security;
revoke all on private.partner_removals from public,anon,authenticated;

alter function private.can_edit_application(uuid) rename to can_edit_before_partner_removal;
create function private.can_edit_application(app uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select private.can_edit_before_partner_removal(app)
 and not exists(select 1 from private.partner_removals where application_id=app)
$$;
revoke all on function private.can_edit_application(uuid),private.can_edit_before_partner_removal(uuid) from public,anon,authenticated;
grant execute on function private.can_edit_application(uuid) to authenticated;

create function private.freeze_during_partner_removal() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from private.partner_removals where application_id=old.id) then raise exception 'GLF_PARTNER_DELETE_PENDING'; end if;
 return new;
end $$;
revoke all on function private.freeze_during_partner_removal() from public,anon,authenticated;
create trigger freeze_during_partner_removal before update on public.applications
 for each row execute function private.freeze_during_partner_removal();

create function private.freeze_partner_document_registration() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from private.partner_removals where application_id=new.application_id) then raise exception 'GLF_PARTNER_DELETE_PENDING'; end if;
 return new;
end $$;
revoke all on function private.freeze_partner_document_registration() from public,anon,authenticated;
create trigger freeze_partner_document_registration before insert on public.application_documents
 for each row execute function private.freeze_partner_document_registration();

create function public.pending_partner_removal(app_id uuid) returns uuid
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 if not exists(select 1 from public.applications where id=app_id and applicant_id=auth.uid()) then raise exception 'GLF_DELETE_FORBIDDEN' using errcode='42501'; end if;
 return (select partner_id from private.partner_removals where application_id=app_id and actor_id=auth.uid());
end $$;

create function public.begin_remove_partner(app_id uuid,expected_revision integer,partner_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.applications; job private.partner_removals; docs uuid[]; files text[];
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=app_id for update;
 if not found or a.applicant_id<>auth.uid() or a.deletion_pending then raise exception 'GLF_DELETE_FORBIDDEN' using errcode='42501'; end if;
 select * into job from private.partner_removals where application_id=a.id;
 if found then
  if job.partner_id<>begin_remove_partner.partner_id or job.actor_id<>auth.uid() or job.revision<>expected_revision then raise exception 'GLF_PARTNER_DELETE_PENDING'; end if;
  return jsonb_build_object('done',false,'paths',to_jsonb(job.paths));
 end if;
 -- A lost successful response can be retried without deleting another element.
 if not exists(select 1 from jsonb_array_elements(coalesce(a.payload->'concept'->'partner_organizations','[]')) p where lower(p->>'id')=partner_id::text) then
  if exists(select 1 from public.application_events e where e.application_id=a.id and e.actor_id=auth.uid() and e.event_type='partner_removed'
   and e.detail->>'partner_id'=partner_id::text and (e.detail->>'base_revision')::integer=expected_revision) then
   return jsonb_build_object('done',true,'revision',a.revision,'payload',a.payload);
  end if;
  raise exception 'GLF_PARTNER_NOT_FOUND';
 end if;
 if not private.can_edit_application(a.id) then raise exception 'GLF_APPLICATION_LOCKED' using errcode='42501'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT' using errcode='40001'; end if;
 select coalesce(array_agg(d.id),'{}'),coalesce(array_agg(d.storage_path),'{}') into docs,files
 from public.application_documents d where d.application_id=a.id
 and d.kind='partner_letter_'||replace(partner_id::text,'-','')
 and d.version_id is null
 and not exists(select 1 from public.application_versions v,
  lateral jsonb_array_elements(coalesce(v.payload->'attachments','[]')) f
  where v.application_id=a.id and (f->>'id'=d.id::text or f->>'storage_path'=d.storage_path));
 insert into private.partner_removals(application_id,partner_id,actor_id,revision,document_ids,paths)
 values(a.id,partner_id,auth.uid(),a.revision,docs,files);
 return jsonb_build_object('done',false,'paths',to_jsonb(files));
end $$;

-- Narrow Storage API access only while the owner has confirmed this operation.
create function private.can_delete_partner_file(object_name text) returns boolean
language sql stable security definer set search_path='' as $$
 select private.current_role()='applicant' and exists(
  select 1 from private.partner_removals j join public.applications a on a.id=j.application_id
  where j.actor_id=auth.uid() and a.applicant_id=auth.uid() and object_name=any(j.paths)
  and not a.deletion_pending
  and not exists(select 1 from public.application_documents d where d.storage_path=object_name and
   (d.version_id is not null or exists(select 1 from public.application_versions v,
     lateral jsonb_array_elements(coalesce(v.payload->'attachments','[]')) f
     where v.application_id=d.application_id and (f->>'id'=d.id::text or f->>'storage_path'=object_name))))
 )
$$;
revoke all on function private.can_delete_partner_file(text) from public,anon,authenticated;
grant execute on function private.can_delete_partner_file(text) to authenticated;
create policy applicant_delete_partner_files on storage.objects for delete to authenticated
 using(bucket_id='application-files' and private.can_delete_partner_file(name));
create policy applicant_read_partner_delete_files on storage.objects for select to authenticated
 using(bucket_id='application-files' and private.can_delete_partner_file(name));

create function public.finish_remove_partner(app_id uuid,expected_revision integer,partner_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.applications; job private.partner_removals; rows jsonb; names jsonb; text_names text; updated jsonb;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=app_id for update;
 select * into job from private.partner_removals where application_id=app_id;
 if a.id is null or a.applicant_id<>auth.uid() or a.deletion_pending or job.application_id is null
  or job.actor_id<>auth.uid() or job.partner_id<>finish_remove_partner.partner_id then raise exception 'GLF_DELETE_FORBIDDEN' using errcode='42501'; end if;
 if a.revision<>expected_revision or job.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT' using errcode='40001'; end if;
 if exists(select 1 from storage.objects where bucket_id='application-files' and name=any(job.paths)) then raise exception 'GLF_DELETE_FILES_PENDING'; end if;
 -- Historical references must still be intact at finalization, too.
 if exists(select 1 from public.application_documents d where d.id=any(job.document_ids) and
  (d.version_id is not null or exists(select 1 from public.application_versions v,
    lateral jsonb_array_elements(coalesce(v.payload->'attachments','[]')) f
    where v.application_id=a.id and f->>'id'=d.id::text))) then raise exception 'GLF_SUBMITTED_RECORD_PROTECTED'; end if;
 select coalesce(jsonb_agg(p order by n),'[]') into rows
 from jsonb_array_elements(a.payload->'concept'->'partner_organizations') with ordinality t(p,n)
 where lower(p->>'id')<>partner_id::text;
 select coalesce(jsonb_agg(p->'name' order by n),'[]'),coalesce(string_agg(n::text||'. '||trim(p->>'name'),E'\n' order by n),'') into names,text_names
 from jsonb_array_elements(rows) with ordinality t(p,n);
 updated:=jsonb_set(a.payload,'{concept}',a.payload->'concept'||jsonb_build_object('partner_organizations',rows,'associated_organizations',names,'partners',text_names));
 delete from public.application_documents where application_id=a.id and id=any(job.document_ids);
 delete from private.partner_removals where application_id=a.id;
 -- Only the confirmed partner JSON changes; all other fields/relations stay intact.
 update public.applications set payload=updated,revision=revision+1,updated_at=now() where id=a.id;
 insert into public.application_events(application_id,actor_id,event_type,detail)
 values(a.id,auth.uid(),'partner_removed',jsonb_build_object('partner_id',partner_id,'base_revision',expected_revision,'deleted_document_ids',job.document_ids));
 return jsonb_build_object('revision',a.revision+1,'payload',updated);
end $$;
revoke all on function public.pending_partner_removal(uuid),public.begin_remove_partner(uuid,integer,uuid),public.finish_remove_partner(uuid,integer,uuid) from public,anon,authenticated;
grant execute on function public.pending_partner_removal(uuid),public.begin_remove_partner(uuid,integer,uuid),public.finish_remove_partner(uuid,integer,uuid) to authenticated;
