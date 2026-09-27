-- Apply in the Supabase project. Browser roles cannot query this table.
create table if not exists public.game_saves (
  code text primary key check (code ~ '^HE([0-9]{4}|[0-9]{6})$'),
  state jsonb not null,
  updated_at bigint not null check (updated_at > 0),
  saved_at timestamptz not null default now()
);
alter table public.game_saves enable row level security;
revoke all on public.game_saves from anon, authenticated;

-- One atomic compare-and-set prevents an older tablet from overwriting a newer save.
create or replace function public.put_game_save(p_code text, p_state jsonb, p_updated_at bigint)
returns text language plpgsql security invoker set search_path = '' as $$
begin
  update public.game_saves
     set state = p_state, updated_at = p_updated_at, saved_at = now()
   where code = p_code and updated_at <= p_updated_at;
  if found then return 'saved'; end if;
  if exists (select 1 from public.game_saves where code = p_code) then return 'stale'; end if;
  return 'missing';
end;
$$;
revoke all on function public.put_game_save(text, jsonb, bigint) from public, anon, authenticated;
grant execute on function public.put_game_save(text, jsonb, bigint) to service_role;
