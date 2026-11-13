-- Presentation metadata only: preserve every existing payload, snapshot and recorded layout.
alter table public.prepared_documents alter column concept_layout_version set default 'glf-concept-20261020-v6';
alter table public.application_versions alter column concept_layout_version set default 'glf-concept-20261020-v6';
