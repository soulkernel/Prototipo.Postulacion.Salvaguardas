-- Academic access is deliberately NOT a staff role. No change to staff MFA.
alter table public.profiles
 add column access_kind text not null default 'standard' check(access_kind in ('standard','academic')),
 add column access_expires_at timestamptz,
 add column archived_at timestamptz,
 add column sessions_revoked_before timestamptz,
 add column account_revision integer not null default 0,
 add constraint academic_profile check(access_kind<>'academic' or (role='applicant' and user_admin_scope='none' and access_expires_at is not null));
create table private.account_events(id bigint generated always as identity primary key,actor_id uuid not null,target_id uuid not null,operation text not null,reason text not null,created_at timestamptz not null default now());
create table private.account_deletion_tickets(user_id uuid primary key,actor_id uuid not null,expires_at timestamptz not null);
create table private.academic_queries(user_id uuid not null,created_at timestamptz not null default now());
create index on private.academic_queries(user_id,created_at);
alter table private.account_events enable row level security;
alter table private.account_deletion_tickets enable row level security;
alter table private.academic_queries enable row level security;
revoke all on private.account_events,private.account_deletion_tickets,private.academic_queries from public,anon,authenticated;

create function private.account_session_valid(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=target and p.active and p.archived_at is null
 and (p.access_kind='standard' or p.access_expires_at>now())
 and (p.sessions_revoked_before is null or exists(select 1 from auth.sessions s
 where s.user_id=p.id and s.id::text=auth.jwt()->>'session_id' and s.created_at>p.sessions_revoked_before)))
$$;
create or replace function private.current_role() returns public.app_role language sql stable security definer set search_path='' as $$
 select role from public.profiles where id=auth.uid() and access_kind='standard' and private.account_session_valid(id)
 and (role='applicant' or coalesce(auth.jwt()->>'aal','')='aal2')
$$;
create function private.is_academic() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and access_kind='academic' and private.account_session_valid(id))
$$;
create function public.access_session_valid() returns boolean language sql stable security definer set search_path='' as $$select private.account_session_valid(auth.uid())$$;
revoke all on function private.account_session_valid(uuid),private.is_academic(),public.access_session_valid() from public,anon;
grant execute on function public.access_session_valid() to authenticated;

create function private.may_manage_account(target public.profiles) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(private.current_role()='administrator' or
 (target.access_kind='standard' and target.user_admin_scope='none' and
 ((private.current_role()='grants_manager' and private.user_admin_scope()='projects' and target.role='project_coordinator') or
 (private.current_role()='sustainability_reviewer' and private.user_admin_scope()='sustainability' and target.role='sustainability_reviewer'))),false)
$$;
revoke all on function private.may_manage_account(public.profiles) from public,anon,authenticated;
create function private.bump_account_revision() returns trigger language plpgsql set search_path='' as $$
begin new.account_revision:=old.account_revision+1; return new; end $$;
create trigger account_revision before update on public.profiles for each row execute function private.bump_account_revision();

create function public.list_managed_accounts() returns table(id uuid,full_name text,email text,role public.app_role,active boolean,user_admin_scope text,access_kind text,access_expires_at timestamptz,archived_at timestamptz,account_revision integer)
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_role(array['administrator','grants_manager','sustainability_reviewer']::public.app_role[]);
 return query select p.id,p.full_name,u.email::text,p.role,p.active,p.user_admin_scope,p.access_kind,p.access_expires_at,p.archived_at,p.account_revision
 from public.profiles p join auth.users u on u.id=p.id where private.may_manage_account(p) order by p.full_name,p.id;
end $$;
create function public.manage_account(target_user uuid,expected_revision integer,operation text,reason text) returns void
language plpgsql security definer set search_path='' as $$
declare target public.profiles;
begin
 perform pg_advisory_xact_lock(130031);
 if target_user=auth.uid() then raise exception 'GLF_SELF_ACCOUNT_CHANGE'; end if;
 select * into target from public.profiles where id=target_user for update;
 if not found then raise exception 'GLF_NOT_FOUND'; end if;
 if not private.may_manage_account(target) then raise exception 'GLF_FORBIDDEN'; end if;
 if target.account_revision<>expected_revision then raise exception 'GLF_CONCURRENT_CHANGE'; end if;
 if length(trim(reason)) not between 3 and 500 then raise exception 'GLF_REASON_REQUIRED'; end if;
 if operation not in ('deactivate','reactivate','revoke_sessions','archive','unarchive') then raise exception 'GLF_INVALID_OPERATION'; end if;
 if target.role='administrator' and target.active and operation in ('deactivate','archive') and
 (select count(*) from public.profiles where role='administrator' and active and archived_at is null)<=1 then raise exception 'GLF_LAST_ADMIN'; end if;
 if exists(select 1 from private.account_deletion_tickets where user_id=target_user and expires_at>now()) then raise exception 'GLF_DELETION_PENDING'; end if;
 if operation='archive' and target.active then raise exception 'GLF_DEACTIVATE_FIRST'; end if;
 if operation='reactivate' and (target.archived_at is not null or (target.access_kind='academic' and target.access_expires_at<=now())) then raise exception 'GLF_CANNOT_REACTIVATE'; end if;
 update public.profiles set
 active=case when operation='deactivate' then false when operation='reactivate' then true else active end,
 archived_at=case when operation='archive' then now() when operation='unarchive' then null else archived_at end,
 sessions_revoked_before=case when operation in ('deactivate','revoke_sessions','archive') then clock_timestamp() else sessions_revoked_before end
 where profiles.id=target_user;
 insert into private.account_events(actor_id,target_id,operation,reason) values(auth.uid(),target_user,operation,trim(reason));
end $$;
revoke all on function public.list_managed_accounts(),public.manage_account(uuid,integer,text,text) from public,anon;
grant execute on function public.list_managed_accounts(),public.manage_account(uuid,integer,text,text) to authenticated;

-- All domain FK references and actor audit history forbid irreversible deletion.
create function private.account_has_history(target uuid) returns boolean language plpgsql stable security definer set search_path='' as $$
declare fk record; found_row boolean;
begin
 for fk in select n.nspname schema_name,c.relname table_name,a.attname column_name from pg_constraint k
 join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace
 join pg_attribute a on a.attrelid=c.oid and a.attnum=k.conkey[1]
 where k.contype='f' and k.confrelid in ('public.profiles'::regclass,'auth.users'::regclass)
 and n.nspname<>'auth' and not (k.conrelid='public.profiles'::regclass and a.attname='id') loop
 execute format('select exists(select 1 from %I.%I where %I=$1)',fk.schema_name,fk.table_name,fk.column_name) into found_row using target;
 if found_row then return true; end if;
 end loop;
 return exists(select 1 from private.role_events where actor_id=target)
 or exists(select 1 from private.account_events where actor_id=target)
 or exists(select 1 from private.corpus_events where actor_id=target);
end $$;
revoke all on function private.account_has_history(uuid) from public,anon,authenticated;
create function public.prepare_account_deletion(target_user uuid,expected_revision integer,reason text) returns void language plpgsql security definer set search_path='' as $$
declare target public.profiles;
begin
 perform private.require_role(array['administrator']::public.app_role[]);
 if target_user=auth.uid() then raise exception 'GLF_SELF_ACCOUNT_CHANGE'; end if;
 select * into target from public.profiles where id=target_user for update;
 if not found then raise exception 'GLF_NOT_FOUND'; end if;
 if target.account_revision<>expected_revision then raise exception 'GLF_CONCURRENT_CHANGE'; end if;
 if target.active or target.archived_at is null then raise exception 'GLF_ARCHIVE_FIRST'; end if;
 if length(trim(reason)) not between 3 and 500 then raise exception 'GLF_REASON_REQUIRED'; end if;
 if private.account_has_history(target_user) then raise exception 'GLF_ACCOUNT_HAS_HISTORY'; end if;
 insert into private.account_deletion_tickets values(target_user,auth.uid(),now()+interval '10 minutes') on conflict(user_id) do update set expires_at=excluded.expires_at,actor_id=excluded.actor_id;
 insert into private.account_events(actor_id,target_id,operation,reason) values(auth.uid(),target_user,'delete_requested',trim(reason));
end $$;
create function private.guard_account_deletion() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.active or old.archived_at is null or not exists(select 1 from private.account_deletion_tickets where user_id=old.id and expires_at>now())
 or private.account_has_history(old.id) then raise exception 'GLF_ACCOUNT_DELETE_FORBIDDEN'; end if;
 insert into private.account_events(actor_id,target_id,operation,reason) select actor_id,old.id,'deleted','Cuenta sin historial eliminada' from private.account_deletion_tickets where user_id=old.id;
 delete from private.account_deletion_tickets where user_id=old.id;
 delete from private.academic_queries where user_id=old.id;
 return old;
end $$;
alter table public.profiles drop constraint profiles_id_fkey;
alter table public.profiles add constraint profiles_id_fkey foreign key(id) references auth.users(id) on delete cascade;
create trigger protect_account_deletion before delete on public.profiles for each row execute function private.guard_account_deletion();
revoke all on function public.prepare_account_deletion(uuid,integer,text) from public,anon;
grant execute on function public.prepare_account_deletion(uuid,integer,text) to authenticated;

-- Provisioning is server-only. Existing identities are never converted.
create function public.finish_academic_account(target_user uuid,actor uuid) returns timestamptz language plpgsql security definer set search_path='' as $$
declare expires timestamptz:=now()+interval '3 months';
begin
 if not exists(select 1 from public.profiles where id=actor and role='administrator' and active and archived_at is null) then raise exception 'GLF_FORBIDDEN'; end if;
 if not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=target_user and p.role='applicant' and p.access_kind='standard' and u.raw_user_meta_data->>'glf_academic_provision'='true') then raise exception 'GLF_FORBIDDEN'; end if;
 update public.profiles set access_kind='academic',access_expires_at=expires where id=target_user;
 insert into private.account_events values(default,actor,target_user,'create_academic','Acceso académico por tres meses',now());
 return expires;
end $$;
revoke all on function public.finish_academic_account(uuid,uuid) from public,anon,authenticated;
grant execute on function public.finish_academic_account(uuid,uuid) to service_role;

create function public.consume_academic_query() returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not private.is_academic() then raise exception 'GLF_FORBIDDEN'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,31));
 if (select count(*) from private.academic_queries where user_id=auth.uid() and created_at>now()-interval '1 hour')>=15
 or (select count(*) from private.academic_queries where user_id=auth.uid() and created_at>date_trunc('day',now()))>=60 then return false; end if;
 delete from private.academic_queries where user_id=auth.uid() and created_at<now()-interval '2 days';
 insert into private.academic_queries(user_id) values(auth.uid()); return true;
end $$;
revoke all on function public.consume_academic_query() from public,anon;
grant execute on function public.consume_academic_query() to authenticated;
create or replace function public.match_evidence(query_embedding extensions.vector(384), result_limit integer default 6) returns table(id bigint,document_name text,document_version text,locator text,content text,similarity double precision)
language plpgsql stable security definer set search_path='' as $$
begin
 if not private.is_academic() then perform private.require_role(array['sustainability_reviewer','administrator']::public.app_role[]); end if;
 return query select k.id,k.document_name,k.document_version,k.locator,k.content,1-(k.embedding operator(extensions.<=>) query_embedding)
 from public.knowledge_chunks k where k.approved and k.embedding is not null
 and (not private.is_academic() or k.source_kind in ('official','translation'))
 order by k.embedding operator(extensions.<=>) query_embedding limit least(greatest(result_limit,1),20);
end $$;
revoke all on function private.bump_account_revision(),private.guard_account_deletion() from public,anon,authenticated;
