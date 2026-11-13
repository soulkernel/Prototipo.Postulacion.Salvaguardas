-- Staff accounts are enabled only by the invited, verified recipient.
alter table public.staff_invitation_drafts
 add column status text not null default 'draft' check(status in ('draft','sending','sent','failed','accepted','cancelled')),
 add column attempt_id uuid,
 add column last_attempt_at timestamptz,
 add column sent_at timestamptz,
 add column expires_at timestamptz,
 add column accepted_at timestamptz,
 add column invited_user_id uuid references auth.users(id),
 add column sent_by uuid references public.profiles(id),
 add column send_count integer not null default 0,
 add column last_error text;

create table private.staff_invitation_events (
 id bigint generated always as identity primary key,
 invitation_id uuid not null references public.staff_invitation_drafts(id),
 actor_id uuid, event_type text not null, created_at timestamptz not null default now(),
 detail jsonb not null default '{}'
);
alter table private.staff_invitation_events enable row level security;
revoke all on private.staff_invitation_events from public,anon,authenticated;

create function private.may_manage_invitation(actor public.profiles, invitation public.staff_invitation_drafts) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(actor.active and (actor.role='administrator' or
  (actor.role='grants_manager' and actor.user_admin_scope='projects' and invitation.assigned_role='project_coordinator' and invitation.user_admin_scope='none') or
  (actor.role='sustainability_reviewer' and actor.user_admin_scope='sustainability' and invitation.assigned_role='sustainability_reviewer' and invitation.user_admin_scope='none')),false)
$$;
revoke all on function private.may_manage_invitation(public.profiles,public.staff_invitation_drafts) from public,anon,authenticated;

create or replace function public.prepare_staff_invitation(contact_email text, contact_name text, desired_role public.app_role, desired_scope text default 'none') returns uuid
language plpgsql security definer set search_path='' as $$
declare actor public.profiles; existing public.staff_invitation_drafts; result uuid;
begin
 perform private.require_role(array['administrator','grants_manager','sustainability_reviewer']::public.app_role[]);
 select * into actor from public.profiles where id=auth.uid() for update;
 contact_email:=lower(trim(contact_email)); contact_name:=trim(contact_name);
 if contact_email is null or contact_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or length(contact_email)>254
 or contact_name is null or contact_name ~ '[[:cntrl:]]' or length(contact_name) not between 2 and 200 or desired_role is null or desired_role='applicant'
 or desired_scope is null or desired_scope not in ('none','projects','sustainability')
 or (desired_scope='projects' and desired_role<>'grants_manager') or (desired_scope='sustainability' and desired_role<>'sustainability_reviewer') then raise exception 'GLF_INVALID_INVITATION'; end if;
 perform pg_advisory_xact_lock(hashtextextended(contact_email,0));
 select * into existing from public.staff_invitation_drafts where email=contact_email for update;
 if existing.id is not null and (not private.may_manage_invitation(actor,existing)) then raise exception 'GLF_FORBIDDEN'; end if;
 if existing.id is not null and existing.status not in ('draft','failed','cancelled') then raise exception 'GLF_INVITATION_LOCKED'; end if;
 if exists(select 1 from auth.users where lower(email)=contact_email and (existing.invited_user_id is null or id<>existing.invited_user_id)) then raise exception 'GLF_ACCOUNT_EXISTS'; end if;
 if actor.role<>'administrator' and (desired_scope<>'none' or not ((actor.role='grants_manager' and actor.user_admin_scope='projects' and desired_role='project_coordinator')
 or (actor.role='sustainability_reviewer' and actor.user_admin_scope='sustainability' and desired_role='sustainability_reviewer'))) then raise exception 'GLF_FORBIDDEN'; end if;
 insert into public.staff_invitation_drafts(email,full_name,assigned_role,user_admin_scope,prepared_by)
 values(contact_email,contact_name,desired_role,desired_scope,auth.uid())
 on conflict(email) do update set full_name=excluded.full_name,assigned_role=excluded.assigned_role,user_admin_scope=excluded.user_admin_scope,prepared_by=excluded.prepared_by,status='draft',last_error=null,updated_at=now()
 returning id into result;
 insert into private.staff_invitation_events(invitation_id,actor_id,event_type,detail) values(result,auth.uid(),'prepared',jsonb_build_object('role',desired_role,'scope',desired_scope));
 return result;
end $$;

create function public.begin_staff_invitation(invitation_id uuid, expected_updated_at timestamptz) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.profiles; i public.staff_invitation_drafts; attempt uuid:=gen_random_uuid(); recovered_id uuid;
begin
 perform private.require_role(array['administrator','grants_manager','sustainability_reviewer']::public.app_role[]);
 select * into actor from public.profiles where id=auth.uid() for update;
 select * into i from public.staff_invitation_drafts where id=invitation_id for update;
 if not found then raise exception 'GLF_NOT_FOUND'; end if;
 if not private.may_manage_invitation(actor,i) then raise exception 'GLF_FORBIDDEN'; end if;
 if expected_updated_at is null or i.updated_at<>expected_updated_at then raise exception 'GLF_VERSION_CONFLICT'; end if;
 if i.status in ('accepted','cancelled') then raise exception 'GLF_INVITATION_LOCKED'; end if;
 if i.last_attempt_at>now()-interval '60 seconds' or (i.status='sending' and i.last_attempt_at>now()-interval '5 minutes') then raise exception 'GLF_INVITATION_WAIT'; end if;
 if (select count(*) from private.staff_invitation_events where actor_id=auth.uid() and event_type='send_started' and created_at>now()-interval '1 hour')>=10 then raise exception 'GLF_INVITATION_RATE_LIMIT'; end if;
 -- Recover a previous delivery whose Auth user was created but not yet recorded.
 if i.invited_user_id is null then
  select id into recovered_id from auth.users where lower(email)=i.email and invited_at is not null and raw_user_meta_data->>'glf_invitation_id'=i.id::text;
  if recovered_id is not null then
   if exists(select 1 from public.profiles where id=recovered_id and role<>'applicant') or exists(select 1 from public.applications where applicant_id=recovered_id) then raise exception 'GLF_ACCOUNT_EXISTS'; end if;
   i.invited_user_id:=recovered_id;
  end if;
 end if;
 if exists(select 1 from auth.users where lower(email)=i.email and (i.invited_user_id is null or id<>i.invited_user_id)) then raise exception 'GLF_ACCOUNT_EXISTS'; end if;
 update public.staff_invitation_drafts set status='sending',attempt_id=attempt,invited_user_id=i.invited_user_id,last_attempt_at=now(),sent_by=auth.uid(),last_error=null,updated_at=now() where id=i.id;
 insert into private.staff_invitation_events(invitation_id,actor_id,event_type) values(i.id,auth.uid(),'send_started');
 return jsonb_build_object('attempt_id',attempt,'email',i.email,'full_name',i.full_name,'invited_user_id',i.invited_user_id);
end $$;

-- Only the trusted Edge Function can report delivery. A browser cannot mark an invitation sent.
create function public.finish_staff_invitation(invitation_id uuid, attempt uuid, recipient_id uuid, failure_code text default null) returns void
language plpgsql security definer set search_path='' as $$
declare i public.staff_invitation_drafts;
begin
 select * into i from public.staff_invitation_drafts where id=invitation_id for update;
 if not found or i.status<>'sending' or i.attempt_id is distinct from attempt then raise exception 'GLF_INVITATION_STATE'; end if;
 if failure_code is not null then
  update public.staff_invitation_drafts set status='failed',last_error=left(failure_code,80),updated_at=now() where id=i.id;
  insert into private.staff_invitation_events(invitation_id,actor_id,event_type,detail) values(i.id,i.sent_by,'send_failed',jsonb_build_object('code',left(failure_code,80)));
 else
  if recipient_id is null or not exists(select 1 from auth.users where id=recipient_id and lower(email)=i.email) then raise exception 'GLF_INVITATION_RECIPIENT'; end if;
  if i.invited_user_id is not null and i.invited_user_id<>recipient_id then raise exception 'GLF_INVITATION_RECIPIENT'; end if;
  if exists(select 1 from public.profiles where id=recipient_id and role<>'applicant') or exists(select 1 from public.applications where applicant_id=recipient_id) then raise exception 'GLF_ACCOUNT_EXISTS'; end if;
  update public.profiles set active=false where id=recipient_id;
  update public.staff_invitation_drafts set status='sent',invited_user_id=recipient_id,sent_at=now(),expires_at=now()+interval '1 hour',send_count=send_count+1,last_error=null,updated_at=now() where id=i.id;
  insert into private.staff_invitation_events(invitation_id,actor_id,event_type) values(i.id,i.sent_by,'sent');
 end if;
end $$;

create function public.cancel_staff_invitation(invitation_id uuid, expected_updated_at timestamptz) returns void
language plpgsql security definer set search_path='' as $$
declare actor public.profiles; i public.staff_invitation_drafts;
begin
 perform private.require_role(array['administrator','grants_manager','sustainability_reviewer']::public.app_role[]);
 select * into actor from public.profiles where id=auth.uid();
 select * into i from public.staff_invitation_drafts where id=invitation_id for update;
 if not found then raise exception 'GLF_NOT_FOUND'; end if;
 if not private.may_manage_invitation(actor,i) then raise exception 'GLF_FORBIDDEN'; end if;
 if expected_updated_at is null or i.updated_at<>expected_updated_at then raise exception 'GLF_VERSION_CONFLICT'; end if;
 if i.status in ('accepted','sending') then raise exception 'GLF_INVITATION_LOCKED'; end if;
 update public.staff_invitation_drafts set status='cancelled',updated_at=now() where id=i.id;
 insert into private.staff_invitation_events(invitation_id,actor_id,event_type) values(i.id,auth.uid(),'cancelled');
end $$;

-- Password is set through Auth before this RPC. JWT metadata never assigns staff privileges.
create function public.accept_staff_invitation(invitation_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare i public.staff_invitation_drafts; sender public.profiles; target public.profiles;
begin
 select * into i from public.staff_invitation_drafts where id=invitation_id for update;
 if not found or auth.uid() is null or i.invited_user_id is distinct from auth.uid() then raise exception 'GLF_FORBIDDEN'; end if;
 if i.status<>'sent' or i.expires_at<=now() then raise exception 'GLF_INVITATION_EXPIRED'; end if;
 if not exists(select 1 from auth.users where id=auth.uid() and lower(email)=i.email and email_confirmed_at is not null and nullif(encrypted_password,'') is not null) then raise exception 'GLF_INVITATION_RECIPIENT'; end if;
 select * into sender from public.profiles where id=i.sent_by;
 if not private.may_manage_invitation(sender,i) then raise exception 'GLF_FORBIDDEN'; end if;
 select * into target from public.profiles where id=auth.uid() for update;
 if target.role<>'applicant' or exists(select 1 from public.applications where applicant_id=auth.uid()) then raise exception 'GLF_ACCOUNT_EXISTS'; end if;
 update public.profiles set full_name=i.full_name,role=i.assigned_role,user_admin_scope=i.user_admin_scope,active=true where id=auth.uid();
 insert into private.role_events(actor_id,target_id,previous_role,assigned_role) values(i.sent_by,auth.uid(),target.role,i.assigned_role);
 update public.staff_invitation_drafts set status='accepted',accepted_at=now(),updated_at=now() where id=i.id;
 insert into private.staff_invitation_events(invitation_id,actor_id,event_type) values(i.id,auth.uid(),'accepted');
end $$;

create function public.get_staff_activation(invitation_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.staff_invitation_drafts;
begin
 select * into i from public.staff_invitation_drafts where id=invitation_id;
 if not found or auth.uid() is null or i.invited_user_id is distinct from auth.uid() then raise exception 'GLF_FORBIDDEN'; end if;
 return jsonb_build_object('full_name',i.full_name,'email',i.email,'assigned_role',i.assigned_role,'status',i.status,'expires_at',i.expires_at);
end $$;
revoke all on function public.begin_staff_invitation(uuid,timestamptz),public.cancel_staff_invitation(uuid,timestamptz),public.accept_staff_invitation(uuid),public.get_staff_activation(uuid),public.finish_staff_invitation(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.begin_staff_invitation(uuid,timestamptz),public.cancel_staff_invitation(uuid,timestamptz),public.accept_staff_invitation(uuid),public.get_staff_activation(uuid) to authenticated;
grant execute on function public.finish_staff_invitation(uuid,uuid,uuid,text) to service_role;

-- Auth invited users have no applicant privileges while their invitation is pending.
create or replace function private.new_user() returns trigger language plpgsql security definer set search_path='' as $$
 begin insert into public.profiles(id,full_name,active) values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),200),new.invited_at is null); return new; end
$$;
