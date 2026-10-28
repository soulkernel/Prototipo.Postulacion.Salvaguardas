-- Internal account activation: fifteen days from issuance. KYC case links are unchanged.
begin;
create or replace function public.finish_staff_link(invitation_id uuid, attempt uuid, recipient_id uuid, token_hash text) returns timestamptz
language plpgsql security definer set search_path='' as $$
declare expiry timestamptz:=now()+interval '15 days';
begin
 perform public.finish_staff_invitation(invitation_id,attempt,recipient_id,null);
 insert into private.staff_activation_links(invitation_id,token_hash,expires_at) values(invitation_id,token_hash,expiry)
 on conflict on constraint staff_activation_links_pkey do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at,consumed_at=null;
 update public.staff_invitation_drafts set delivery_method='manual',expires_at=expiry where id=invitation_id;
 insert into private.staff_invitation_events(invitation_id,actor_id,event_type) select id,sent_by,'link_prepared' from public.staff_invitation_drafts where id=invitation_id;
 return expiry;
end $$;

with extended as (
 update private.staff_activation_links l set expires_at=i.sent_at+interval '15 days'
 from public.staff_invitation_drafts i where i.id=l.invitation_id and i.status='sent'
 and i.delivery_method='manual' and l.consumed_at is null and l.expires_at>now()
 and i.sent_at is not null and l.expires_at<i.sent_at+interval '15 days'
 returning i.id,i.sent_by,l.expires_at
), synced as (
 update public.staff_invitation_drafts i set expires_at=e.expires_at,updated_at=now()
 from extended e where i.id=e.id returning i.id,i.sent_by,i.expires_at
)
insert into private.staff_invitation_events(invitation_id,actor_id,event_type,detail)
select id,sent_by,'validity_extended',jsonb_build_object('days',15,'expires_at',expires_at,'reason','User authorized fifteen-day internal activation on 2026-10-28') from synced;
commit;
