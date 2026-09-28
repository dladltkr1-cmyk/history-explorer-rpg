-- The verifier is inserted privately after deployment; no administrator code
-- or password hash belongs in the public game repository.
create table if not exists public.admin_auth (
  key text primary key check (key = 'admin'),
  salt text not null,
  digest text not null
);
alter table public.admin_auth enable row level security;
revoke all on public.admin_auth from public, anon, authenticated;
grant select on public.admin_auth to service_role;
