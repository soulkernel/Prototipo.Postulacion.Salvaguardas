-- Only newly prepared documents use format 3. Existing metadata and files are
-- untouched; a submitted version inherits the exact format prepared for signing.
create or replace function private.freeze_document_metadata() returns trigger
language plpgsql security definer set search_path='' as $$
declare author uuid; prepared public.prepared_documents;
begin
 if tg_table_name='application_versions' then
  select * into prepared from public.prepared_documents p
   where p.application_id=new.application_id and p.revision=new.revision and p.stage=new.stage;
  if found then
   new.document_metadata:=prepared.document_metadata;
   return new;
  end if;
  author:=new.actor_id;
 else
  author:=auth.uid();
 end if;
 new.document_metadata:=jsonb_build_object('format_version',3,'author_name',
  coalesce((select p.full_name from public.profiles p where p.id=author),''));
 return new;
end $$;
