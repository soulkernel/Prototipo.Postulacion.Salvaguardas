-- Ingestion never grants technical approval. Access still requires MFA.
alter table public.knowledge_chunks add column source_kind text not null default 'unclassified'
 check(source_kind in ('official','translation','summary','unclassified'));
create policy knowledge_admin_pending on public.knowledge_chunks for select to authenticated
 using ((select private.current_role())='administrator');
create table private.corpus_events (
 id bigint generated always as identity primary key,
 actor_id uuid not null, chunk_id bigint not null references public.knowledge_chunks(id),
 action text not null, created_at timestamptz not null default now()
);
alter table private.corpus_events enable row level security;
revoke all on private.corpus_events from public,anon,authenticated;
create function public.import_evidence(items jsonb) returns integer
language plpgsql security definer set search_path='' as $$
declare item jsonb; chunk bigint; total integer:=0;
begin
 perform private.require_role(array['administrator']::public.app_role[]);
 if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) not between 1 and 8
 then raise exception 'GLF_INVALID_CORPUS_BATCH'; end if;
 for item in select value from jsonb_array_elements(items) loop
  if length(coalesce(item->>'document_name','')) not between 1 and 200
   or length(coalesce(item->>'document_version','')) not between 1 and 100
   or length(coalesce(item->>'locator','')) not between 1 and 250
   or length(coalesce(item->>'content','')) not between 1 and 12000
   or jsonb_array_length(item->'embedding')<>384
  then raise exception 'GLF_INVALID_CORPUS_ITEM'; end if;
  insert into public.knowledge_chunks(document_name,document_version,locator,content,embedding,source_kind,approved)
  values(item->>'document_name',item->>'document_version',item->>'locator',item->>'content',
   (item->>'embedding')::extensions.vector(384),coalesce(item->>'source_kind','unclassified'),false)
  on conflict(document_name,document_version,locator) do nothing returning id into chunk;
  if chunk is not null then
   insert into private.corpus_events(actor_id,chunk_id,action) values(auth.uid(),chunk,'import_pending');
   total:=total+1;
  elsif exists(select 1 from public.knowledge_chunks k where k.document_name=item->>'document_name'
   and k.document_version=item->>'document_version' and k.locator=item->>'locator'
   and k.content<>item->>'content') then raise exception 'GLF_CORPUS_VERSION_CONFLICT';
  end if;
 end loop;
 return total;
end $$;
revoke all on function public.import_evidence(jsonb) from public,anon;
grant execute on function public.import_evidence(jsonb) to authenticated;
