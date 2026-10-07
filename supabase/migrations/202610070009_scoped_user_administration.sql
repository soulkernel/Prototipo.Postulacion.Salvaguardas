alter table public.profiles add column user_admin_scope text not null default 'none'
 check(user_admin_scope in ('none','projects','sustainability'));
create or replace function public.assign_staff_role(target_user uuid, assigned_role public.app_role) returns void
language plpgsql security definer set search_path='' as $$
declare previous public.app_role; actor public.profiles; target public.profiles;
begin
 perform private.require_role(array['administrator','grants_manager','sustainability_reviewer']::public.app_role[]);
 select * into actor from public.profiles where id=auth.uid() for update;
 if target_user=auth.uid() then raise exception 'GLF_SELF_ROLE_CHANGE_FORBIDDEN'; end if;
 select * into target from public.profiles where id=target_user for update;
 if not found then raise exception 'GLF_NOT_FOUND'; end if;
 if actor.role<>'administrator' then
  if target.user_admin_scope<>'none' then raise exception 'GLF_FORBIDDEN'; end if;
  if not ((actor.user_admin_scope='projects' and actor.role='grants_manager' and assigned_role='project_coordinator' and target.role in ('applicant','project_coordinator'))
    or (actor.user_admin_scope='sustainability' and actor.role='sustainability_reviewer' and assigned_role='sustainability_reviewer' and target.role in ('applicant','sustainability_reviewer')))
  then raise exception 'GLF_FORBIDDEN'; end if;
 end if;
 previous:=target.role;
 update public.profiles set role=assigned_role,user_admin_scope=case when role=assigned_role then user_admin_scope else 'none' end where id=target_user;
 insert into private.role_events(actor_id,target_id,previous_role,assigned_role) values(auth.uid(),target_user,previous,assigned_role);
end $$;
create function private.user_admin_scope() returns text language sql stable security definer set search_path='' as $$
 select user_admin_scope from public.profiles where id=auth.uid() and active and private.current_role() is not null
$$;
revoke all on function private.user_admin_scope() from public,anon;
grant execute on function private.user_admin_scope() to authenticated;
drop policy profile_self on public.profiles;
create policy profile_self on public.profiles for select to authenticated using(
 id=auth.uid() or private.current_role()='administrator' or
 (private.current_role()='grants_manager' and private.user_admin_scope()='projects' and role in ('applicant','project_coordinator')) or
 (private.current_role()='sustainability_reviewer' and private.user_admin_scope()='sustainability' and role in ('applicant','sustainability_reviewer'))
);
-- Administrative scope cannot be set by applicants or delegated area managers.
create function public.set_user_admin_scope(target_user uuid, scope text) returns void
language plpgsql security definer set search_path='' as $$
declare target public.profiles;
begin
 perform private.require_role(array['administrator']::public.app_role[]);
 if target_user=auth.uid() then raise exception 'GLF_SELF_ROLE_CHANGE_FORBIDDEN'; end if;
 select * into target from public.profiles where id=target_user for update;
 if not found then raise exception 'GLF_NOT_FOUND'; end if;
 if scope not in ('none','projects','sustainability') or (scope='projects' and target.role<>'grants_manager') or (scope='sustainability' and target.role<>'sustainability_reviewer') then raise exception 'GLF_FORBIDDEN'; end if;
 update public.profiles set user_admin_scope=scope where id=target_user;
 insert into private.role_events(actor_id,target_id,previous_role,assigned_role) values(auth.uid(),target_user,target.role,target.role);
end $$;
revoke all on function public.set_user_admin_scope(uuid,text) from public,anon;
grant execute on function public.set_user_admin_scope(uuid,text) to authenticated;
