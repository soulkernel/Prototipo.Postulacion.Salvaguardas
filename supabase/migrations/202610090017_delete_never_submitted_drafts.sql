alter table public.applications add column deletion_pending boolean not null default false;
alter function private.can_edit_application(uuid) rename to can_edit_application_before_deletion;
create function private.can_edit_application(app uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.can_edit_application_before_deletion(app) and exists(select 1 from public.applications where id=app and not deletion_pending)
$$;
revoke all on function private.can_edit_application(uuid),private.can_edit_application_before_deletion(uuid) from public,anon,authenticated;
grant execute on function private.can_edit_application(uuid) to authenticated;

create function private.protect_submitted_application() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.submitted_at is not null or old.stage<>1 or old.status<>'draft' or exists(select 1 from public.application_versions where application_id=old.id) then raise exception 'GLF_SUBMITTED_RECORD_PROTECTED'; end if;
 return old;
end $$;
create trigger protect_submitted_application before delete on public.applications for each row execute function private.protect_submitted_application();
revoke all on function private.protect_submitted_application() from public,anon,authenticated;

create function public.begin_delete_draft(app_id uuid,expected_revision integer) returns text[] language plpgsql security definer set search_path='' as $$
declare a public.applications; paths text[];
begin
 select * into a from public.applications where id=app_id for update;
 if not found or private.current_role()<>'applicant' or a.applicant_id<>auth.uid() then raise exception 'GLF_DELETE_FORBIDDEN' using errcode='42501'; end if;
 if a.status<>'draft' or a.stage<>1 or a.submitted_at is not null or exists(select 1 from public.application_versions where application_id=a.id) then raise exception 'GLF_SUBMITTED_RECORD_PROTECTED'; end if;
 if a.revision<>expected_revision then raise exception 'GLF_REVISION_CONFLICT'; end if;
 update public.applications set deletion_pending=true where id=a.id;
 select coalesce(array_agg(name),array[]::text[]) into paths from storage.objects where bucket_id='application-files' and (storage.foldername(name))[1]=a.id::text;
 return paths;
end $$;
create policy applicant_delete_pending_files on storage.objects for delete to authenticated using (
 bucket_id='application-files' and exists(select 1 from public.applications a where a.id::text=(storage.foldername(name))[1] and a.applicant_id=auth.uid() and private.current_role()='applicant' and a.deletion_pending and a.status='draft' and a.stage=1 and a.submitted_at is null and not exists(select 1 from public.application_versions v where v.application_id=a.id))
);
grant delete on storage.objects to authenticated;
create policy applicant_read_pending_delete_files on storage.objects for select to authenticated using (
 bucket_id='application-files' and exists(select 1 from public.applications a where a.id::text=(storage.foldername(name))[1] and a.applicant_id=auth.uid() and private.current_role()='applicant' and a.deletion_pending and a.status='draft' and a.stage=1 and a.submitted_at is null and not exists(select 1 from public.application_versions v where v.application_id=a.id))
);
create function public.finish_delete_draft(app_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare a public.applications;
begin
 select * into a from public.applications where id=app_id for update;
 if not found or private.current_role()<>'applicant' or a.applicant_id<>auth.uid() or not a.deletion_pending then raise exception 'GLF_DELETE_FORBIDDEN' using errcode='42501'; end if;
 if a.status<>'draft' or a.stage<>1 or a.submitted_at is not null or exists(select 1 from public.application_versions where application_id=a.id) then raise exception 'GLF_SUBMITTED_RECORD_PROTECTED'; end if;
 if exists(select 1 from storage.objects where bucket_id='application-files' and (storage.foldername(name))[1]=a.id::text) then raise exception 'GLF_DELETE_FILES_PENDING'; end if;
 delete from public.prepared_documents where application_id=a.id;
 delete from public.application_documents where application_id=a.id;
 delete from public.risks where application_id=a.id;
 delete from public.activities where application_id=a.id;
 delete from public.application_events where application_id=a.id;
 delete from public.applications where id=a.id;
end $$;
revoke all on function public.begin_delete_draft(uuid,integer),public.finish_delete_draft(uuid) from public,anon,authenticated;
grant execute on function public.begin_delete_draft(uuid,integer),public.finish_delete_draft(uuid) to authenticated;
