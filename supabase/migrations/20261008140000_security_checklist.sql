alter table public.games enable row level security;
alter table public.scores enable row level security;

drop policy if exists "scores_insert_anon" on public.scores;

create policy "scores_insert_anon"
  on public.scores
  for insert
  to anon, authenticated
  with check (
    char_length(player_name) between 1 and 10
    and score >= 0
    and exists (
      select 1 from public.games g where g.id = scores.game_id
    )
  );

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
