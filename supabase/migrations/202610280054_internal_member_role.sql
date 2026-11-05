-- Identity for staff using other GLF applications; no grants privileges.
alter type public.app_role add value if not exists 'internal_member';
