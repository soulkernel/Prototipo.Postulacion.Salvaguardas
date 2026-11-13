-- Revoke Auth sessions and refresh-token chains as well as checking the cutoff in RLS.
-- No sessions are deleted by installing this migration; only a confirmed account operation does so.
alter function public.manage_account(uuid,integer,text,text) set schema private;
alter function private.manage_account(uuid,integer,text,text) rename to manage_account_core;
revoke all on function private.manage_account_core(uuid,integer,text,text) from public,anon,authenticated;
create function public.manage_account(target_user uuid,expected_revision integer,operation text,reason text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform private.manage_account_core(target_user,expected_revision,operation,reason);
 if operation in ('deactivate','revoke_sessions','archive') then
  delete from auth.sessions where user_id=target_user;
 end if;
end $$;
revoke all on function public.manage_account(uuid,integer,text,text) from public,anon;
grant execute on function public.manage_account(uuid,integer,text,text) to authenticated;
