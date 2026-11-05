-- Requested content cleanup only. No change to funding rules, dates or workflow.
begin;
do $$
declare c public.calls; actor uuid;
begin
 select id into actor from public.profiles where lower(id::text)='7f3af678-2728-41d5-8ff6-bfb5fa1395cf' and role='administrator' and active;
 if actor is null then raise exception 'Administrator missing'; end if;
 select * into c from public.calls where id='9e195a21-938c-459c-8a08-f955bfdc4d05' for update;
 if c.id is null or c.title_es <> 'Prueba interna GLF — sin validez oficial' then raise exception 'Unexpected call content; review before changing'; end if;
 update public.calls set title_es='Convocatoria de subvenciones GLF',title_en='GLF grant call',description_es='',description_en='',revision=revision+1 where id=c.id;
 insert into private.call_events(call_id,actor_id,event_type,revision) values(c.id,actor,'presentation_text_updated',c.revision+1);
end $$;
commit;
select title_es,title_en,description_es,status from public.calls where id='9e195a21-938c-459c-8a08-f955bfdc4d05';
