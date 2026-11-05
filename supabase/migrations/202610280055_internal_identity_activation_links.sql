-- Internal identity does not imply access to grants, files, reports or RAG.
create or replace function private.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(private.current_role() in ('grants_manager','sustainability_reviewer','project_coordinator','committee_member','administrator'),false)
$$;
alter table public.staff_invitation_drafts add column delivery_method text not null default 'email' check(delivery_method in ('email','manual'));
create table private.staff_activation_links (
 invitation_id uuid primary key references public.staff_invitation_drafts(id),
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
 expires_at timestamptz not null, consumed_at timestamptz
);
alter table private.staff_activation_links enable row level security;
revoke all on private.staff_activation_links from public,anon,authenticated;
create function public.begin_staff_link(invitation_id uuid, expected_updated_at timestamptz) returns jsonb
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
 if (select count(*) from private.staff_invitation_events where actor_id=auth.uid() and event_type='link_started' and created_at>now()-interval '1 hour')>=30 then raise exception 'GLF_INVITATION_RATE_LIMIT'; end if;
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
 insert into private.staff_invitation_events(invitation_id,actor_id,event_type) values(i.id,auth.uid(),'link_started');
 return jsonb_build_object('attempt_id',attempt,'email',i.email,'full_name',i.full_name,'invited_user_id',i.invited_user_id);
end $$;


create function public.finish_staff_link(invitation_id uuid, attempt uuid, recipient_id uuid, token_hash text) returns timestamptz
language plpgsql security definer set search_path='' as $$
declare expiry timestamptz:=now()+interval '7 days';
begin
 perform public.finish_staff_invitation(invitation_id,attempt,recipient_id,null);
 insert into private.staff_activation_links(invitation_id,token_hash,expires_at) values(invitation_id,token_hash,expiry)
 on conflict on constraint staff_activation_links_pkey do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at,consumed_at=null;
 update public.staff_invitation_drafts set delivery_method='manual',expires_at=expiry where id=invitation_id;
 insert into private.staff_invitation_events(invitation_id,actor_id,event_type) select id,sent_by,'link_prepared' from public.staff_invitation_drafts where id=invitation_id;
 return expiry;
end $$;
create function public.consume_staff_link(secret_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare l private.staff_activation_links; i public.staff_invitation_drafts; sender public.profiles;
begin
 select * into l from private.staff_activation_links where token_hash=secret_hash for update;
 if not found or l.consumed_at is not null or l.expires_at<=now() then raise exception 'GLF_INVITATION_EXPIRED'; end if;
 select * into i from public.staff_invitation_drafts where id=l.invitation_id for update;
 select * into sender from public.profiles where id=i.sent_by;
 if i.status<>'sent' or i.delivery_method<>'manual' or i.expires_at<=now() or not coalesce(private.may_manage_invitation(sender,i),false)
 or not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=i.invited_user_id and not p.active and p.role='applicant' and lower(u.email)=i.email)
 then raise exception 'GLF_INVITATION_EXPIRED'; end if;
 update private.staff_activation_links set consumed_at=now() where invitation_id=i.id;
 insert into private.staff_invitation_events(invitation_id,actor_id,event_type) values(i.id,i.invited_user_id,'link_opened');
 return jsonb_build_object('id',i.id,'recipient_id',i.invited_user_id,'email',i.email);
end $$;
revoke all on function public.begin_staff_link(uuid,timestamptz),public.finish_staff_link(uuid,uuid,uuid,text),public.consume_staff_link(text) from public,anon,authenticated;
grant execute on function public.begin_staff_link(uuid,timestamptz) to authenticated;
grant execute on function public.finish_staff_link(uuid,uuid,uuid,text),public.consume_staff_link(text) to service_role;


create function private.invalidate_staff_link() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status in ('sending','cancelled','accepted') then delete from private.staff_activation_links where invitation_id=new.id; end if;
 return new;
end $$;
revoke all on function private.invalidate_staff_link() from public,anon,authenticated;
create trigger invalidate_staff_link after update of status on public.staff_invitation_drafts for each row execute function private.invalidate_staff_link();
