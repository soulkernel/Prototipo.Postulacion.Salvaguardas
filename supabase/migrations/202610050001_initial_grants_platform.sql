-- First deployment only. No earlier version of this migration was applied.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create schema if not exists extensions;
create extension if not exists vector with schema extensions;

create type public.app_role as enum ('applicant','grants_manager','sustainability_reviewer','project_coordinator','committee_member','administrator');
create type public.application_status as enum ('draft','submitted','under_review','selected_for_phase2','not_selected','phase2_draft','phase2_submitted','approved','contract_pending','contract_signed','closed');
create table public.profiles (
 id uuid primary key references auth.users(id), full_name text not null default '',
 role public.app_role not null default 'applicant', active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.calls (
 id uuid primary key default gen_random_uuid(), code text not null unique,
 title_es text not null, title_en text not null, description_es text not null default '', description_en text not null default '',
 status text not null default 'draft' check(status in ('draft','published','closed','archived')),
 opens_at timestamptz not null, closes_at timestamptz not null check(closes_at>opens_at),
 rules_version text not null, rules jsonb not null, phase2_schema jsonb not null default '[]',
 created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.applications (
 id uuid primary key default gen_random_uuid(), reference_code text not null unique,
 call_id uuid not null references public.calls(id), applicant_id uuid not null references public.profiles(id),
 status public.application_status not null default 'draft', stage smallint not null default 1 check(stage in (1,2)),
 revision integer not null default 0, payload jsonb not null default '{"concept":{},"activities":[],"phase2":{}}',
 rules_snapshot jsonb not null, correction_deadline timestamptz, phase2_deadline timestamptz,
 submitted_at timestamptz, invited_at timestamptz, phase2_submitted_at timestamptz, approved_at timestamptz, signed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index applications_owner on public.applications(applicant_id);
create index applications_call on public.applications(call_id,status);
create table public.activities (
 id uuid primary key, application_id uuid not null references public.applications(id),
 title text not null default '', description text not null default '', sort_order integer not null, unique(id,application_id)
);
create table public.risks (
 id uuid primary key, application_id uuid not null references public.applications(id),
 activity_id uuid not null, name text not null default '', description text not null default '',
 dimension text not null check(dimension in ('environmental','social')),
 probability smallint check(probability between 1 and 5), severity smallint check(severity between 1 and 5),
 residual_probability smallint check(residual_probability between 1 and 5), residual_severity smallint check(residual_severity between 1 and 5),
 initial_score smallint generated always as (probability*severity) stored,
 residual_score smallint generated always as (residual_probability*residual_severity) stored,
 location text not null default '', cost numeric(14,2) check(cost>=0), responsible text not null default '',
 start_quarter smallint check(start_quarter between 1 and 12), end_quarter smallint check(end_quarter between 1 and 12),
 duration_quarters smallint generated always as (end_quarter-start_quarter+1) stored,
 check(end_quarter>=start_quarter), foreign key(activity_id,application_id) references public.activities(id,application_id)
);
create index risks_application on public.risks(application_id);
create table public.safeguard_catalog (
 id uuid primary key default gen_random_uuid(), code text not null, version text not null,
 label_es text not null, label_en text not null, normative_reference text not null,
 approved_by uuid not null references public.profiles(id), active boolean not null default false, unique(code,version)
);
create table public.risk_safeguards (
 id uuid primary key default gen_random_uuid(), risk_id uuid not null references public.risks(id) on delete cascade,
 catalog_id uuid references public.safeguard_catalog(id), proposed_text text,
 check((catalog_id is null and nullif(trim(proposed_text),'') is not null) or (catalog_id is not null and proposed_text is null))
);
create table public.application_versions (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id),
 revision integer not null, stage smallint not null, payload jsonb not null, rules_snapshot jsonb not null,
 actor_id uuid not null references public.profiles(id), submitted_at timestamptz not null default now(),
 unique(application_id,revision)
);
create table public.application_events (
 id bigint generated always as identity primary key, application_id uuid not null references public.applications(id),
 actor_id uuid not null references public.profiles(id), event_type text not null, detail jsonb not null default '{}',
 created_at timestamptz not null default now()
);
create table public.technical_reviews (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id),
 revision integer not null, reviewer_id uuid not null references public.profiles(id), review_type text not null check(review_type in ('safeguards','grants','coordination')),
 findings text not null, recommendation text not null, global_risk_category text,
 created_at timestamptz not null default now()
);
create table public.governance_decisions (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id),
 revision integer not null, body text not null check(body in ('CAT','committee','council')),
 decision text not null check(decision in ('recommend','invite','not_select','approve','reject')),
 reference text not null, rationale text not null, approved_amount numeric(14,2) check(approved_amount>0), recorded_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now()
);
create table public.application_documents (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id),
 version_id uuid references public.application_versions(id), kind text not null, storage_path text not null unique,
 file_name text not null, content_type text not null check(content_type in ('application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')),
 size_bytes bigint not null check(size_bytes between 1 and 26214400), sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
 uploaded_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.project_agreements (
 id uuid primary key default gen_random_uuid(), application_id uuid not null unique references public.applications(id),
 approved_amount numeric(14,2) not null check(approved_amount>0), cofinance_amount numeric(14,2) not null check(cofinance_amount>=0),
 reference text not null, document_id uuid not null references public.application_documents(id),
 glf_signed_on date not null, applicant_signed_on date not null, recorded_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now()
);
create table public.knowledge_chunks (
 id bigint generated always as identity primary key, document_name text not null, document_version text not null,
 locator text not null, content text not null, embedding extensions.vector(384), approved boolean not null default false,
 created_at timestamptz not null default now(), unique(document_name,document_version,locator)
);
create table private.role_events (
 id bigint generated always as identity primary key, actor_id uuid not null, target_id uuid not null,
 previous_role public.app_role not null, assigned_role public.app_role not null, created_at timestamptz not null default now()
);
create function private.current_role() returns public.app_role language sql stable security definer set search_path='' as $$
 select role from public.profiles where id=auth.uid() and active and (role='applicant' or coalesce(auth.jwt()->>'aal','')='aal2')
$$;
create function private.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(private.current_role()<>'applicant',false)
$$;
create function private.can_read_application(app uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.applications where id=app and ((private.is_staff() and submitted_at is not null) or (applicant_id=auth.uid() and private.current_role()='applicant')))
$$;
create function private.can_edit_application(app uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.applications a join public.calls c on c.id=a.call_id
 where a.id=app and a.applicant_id=auth.uid() and private.current_role()='applicant'
 and ((a.stage=1 and c.status='published' and now() between c.opens_at and c.closes_at and (a.status='draft' or a.correction_deadline>now()))
 or (a.stage=2 and a.phase2_deadline>now() and (a.status in ('selected_for_phase2','phase2_draft') or a.correction_deadline>now()))))
$$;
create function private.new_user() returns trigger language plpgsql security definer set search_path='' as $$
 begin insert into public.profiles(id,full_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),200)); return new; end
$$;
create trigger glf_new_user after insert on auth.users for each row execute function private.new_user();
-- Function ownership is privileged, but helpers live outside the exposed API schema.
revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.current_role(),private.is_staff(),private.can_read_application(uuid),private.can_edit_application(uuid) to authenticated;
