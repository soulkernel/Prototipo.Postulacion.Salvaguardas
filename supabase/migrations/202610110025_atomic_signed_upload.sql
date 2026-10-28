-- Serialize the final registration against edits/preparation on another device.
create function public.register_signed_document(app_id uuid, expected_revision integer, object_path text, original_name text, mime text, bytes bigint, checksum text, document_kind text) returns uuid
language plpgsql security definer set search_path='' as $$
declare a public.applications;
begin
 perform private.require_role(array['applicant']::public.app_role[]);
 select * into a from public.applications where id=app_id for update;
 if not found or not private.can_edit_application(a.id) then raise exception 'GLF_APPLICATION_LOCKED'; end if;
 if a.stage<>1 or a.revision<>expected_revision then raise exception 'GLF_VERSION_CONFLICT'; end if;
 if document_kind not in ('concept_signed','matrix_signed') or mime<>'application/pdf' then raise exception 'GLF_SIGNED_DOCUMENT_PDF_REQUIRED'; end if;
 if not exists(select 1 from public.prepared_documents p where p.application_id=a.id and p.revision=a.revision and p.stage=a.stage and p.payload=a.payload)
 then raise exception 'GLF_PREPARE_DOCUMENTS_REQUIRED'; end if;
 return public.register_document(app_id,object_path,original_name,mime,bytes,checksum,document_kind);
end $$;
revoke all on function public.register_signed_document(uuid,integer,text,text,text,bigint,text,text) from public,anon;
grant execute on function public.register_signed_document(uuid,integer,text,text,text,bigint,text,text) to authenticated;
