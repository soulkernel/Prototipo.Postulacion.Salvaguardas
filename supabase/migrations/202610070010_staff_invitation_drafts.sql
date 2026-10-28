-- Preparation only: never creates Auth users or sends emails.
create table public.staff_invitation_drafts (
 id uuid primary key default gen_random_uuid(),
 email text not null unique check(email=lower(trim(email)) and length(email)<=254),
 full_name text not null check(length(trim(full_name)) between 1 and 200),
 assigned_role public.app_role not null check(assigned_role<>'applicant'),
 user_admin_scope text not null default 'none' check(user_admin_scope in ('none','projects','sustainability')),
 prepared_by uuid not null references public.profiles(id),
 updated_at timestamptz not null default now()
);
alter table public.staff_invitation_drafts enable row level security;
revoke all on public.staff_invitation_drafts from anon,authenticated;
grant select on public.staff_invitation_drafts to authenticated;
create policy invitation_drafts_read on public.staff_invitation_drafts for select to authenticated using(
 private.current_role()='administrator' or
 (private.current_role()='grants_manager' and private.user_admin_scope()='projects' and assigned_role='project_coordinator' and user_admin_scope='none') or
 (private.current_role()='sustainability_reviewer' and private.user_admin_scope()='sustainability' and assigned_role='sustainability_reviewer' and user_admin_scope='none')
);
create function public.prepare_staff_invitation(contact_email text, contact_name text, desired_role public.app_role, desired_scope text default 'none') returns uuid
language plpgsql security definer set search_path='' as $$
declare actor public.profiles; existing public.staff_invitation_drafts; result uuid;
begin
 perform private.require_role(array['administrator','grants_manager','sustainability_reviewer']::public.app_role[]);
 select * into actor from public.profiles where id=auth.uid() for update;
 contact_email:=lower(trim(contact_email)); contact_name:=trim(contact_name);
 if contact_email is null or contact_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or length(contact_email)>254
 or contact_name is null or length(contact_name) not between 1 and 200 or desired_role is null or desired_role='applicant'
 or desired_scope is null or desired_scope not in ('none','projects','sustainability')
 or (desired_scope='projects' and desired_role<>'grants_manager') or (desired_scope='sustainability' and desired_role<>'sustainability_reviewer') then raise exception 'GLF_INVALID_INVITATION'; end if;
 perform pg_advisory_xact_lock(hashtextextended(contact_email,0));
 select * into existing from public.staff_invitation_drafts where email=contact_email for update;
 if actor.role<>'administrator' then
  if desired_scope<>'none' or (existing.id is not null and (existing.assigned_role<>desired_role or existing.user_admin_scope<>'none'))
  or not ((actor.role='grants_manager' and actor.user_admin_scope='projects' and desired_role='project_coordinator')
   or (actor.role='sustainability_reviewer' and actor.user_admin_scope='sustainability' and desired_role='sustainability_reviewer')) then raise exception 'GLF_FORBIDDEN'; end if;
 end if;
 insert into public.staff_invitation_drafts(email,full_name,assigned_role,user_admin_scope,prepared_by)
 values(contact_email,contact_name,desired_role,desired_scope,auth.uid())
 on conflict(email) do update set full_name=excluded.full_name,assigned_role=excluded.assigned_role,user_admin_scope=excluded.user_admin_scope,prepared_by=excluded.prepared_by,updated_at=now()
 returning id into result;
 return result;
end $$;
revoke all on function public.prepare_staff_invitation(text,text,public.app_role,text) from public,anon;
grant execute on function public.prepare_staff_invitation(text,text,public.app_role,text) to authenticated;

-- Audit the exact scope before and after every delegation, including automatic resets.
create table private.user_scope_events (
 id bigint generated always as identity primary key, actor_id uuid,
 target_id uuid not null, previous_scope text not null, assigned_scope text not null,
 created_at timestamptz not null default now()
);
revoke all on private.user_scope_events from public,anon,authenticated;
alter table private.user_scope_events enable row level security;
create function private.audit_user_scope() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.user_admin_scope is distinct from new.user_admin_scope then
  insert into private.user_scope_events(actor_id,target_id,previous_scope,assigned_scope)
  values(auth.uid(),new.id,old.user_admin_scope,new.user_admin_scope);
 end if;
 return new;
end $$;
revoke all on function private.audit_user_scope() from public,anon,authenticated;
create trigger audit_user_scope after update of user_admin_scope on public.profiles for each row execute function private.audit_user_scope();

