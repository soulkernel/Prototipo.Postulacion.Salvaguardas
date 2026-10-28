-- One-time operational record, NOT a migration or automatic approval rule.
-- Ulf validated the entire loaded corpus, as confirmed by Schubert in this chat.
-- Scope fixed to the inspected snapshot: 3,549 chunks / 36 document versions,
-- IDs <= 3,565. New imports remain pending and are excluded.
begin;
do $$
declare actor uuid; total integer;
begin
 select p.id into actor from public.profiles p join auth.users u on u.id=p.id
 where lower(u.email)='schubert1@gmail.com' and p.role='administrator' and p.active;
 if actor is null then raise exception 'Administrative recorder not found'; end if;
 select count(*) into total from public.knowledge_chunks where id<=3565;
 if total<>3549 or exists(select 1 from public.knowledge_chunks where id<=3565 and embedding is null)
 then raise exception 'Corpus snapshot changed or lacks embeddings'; end if;
 with changed as (
  update public.knowledge_chunks set approved=true where id<=3565 and not approved returning id
 ) insert into private.corpus_events(actor_id,chunk_id,action)
 select actor,id,'approved_ulf_validation_confirmed_by_schubert_2026-10-12' from changed;
end $$;
commit;
select count(*) as total, count(distinct (document_name,document_version)) as documentos,
 count(*) filter(where approved) as aprobados,
 count(*) filter(where embedding is null) as sin_embedding
from public.knowledge_chunks where id<=3565;
