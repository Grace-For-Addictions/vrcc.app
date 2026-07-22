-- VRCC v2 go-live wiring: profile auto-creation, Realtime, voice-notes bucket.

begin;

-- 1. Every new auth user gets a v2 profile (default role: participant).
create or replace function public.v2_handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  insert into public.v2_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)))
  on conflict (id) do nothing;
  return new;
end
$$;

revoke execute on function public.v2_handle_new_user() from public, anon, authenticated;

drop trigger if exists v2_on_auth_user_created on auth.users;
create trigger v2_on_auth_user_created
  after insert on auth.users
  for each row execute function public.v2_handle_new_user();

-- 2. Realtime for the live surfaces (idempotent).
do $$
declare
  t text;
begin
  foreach t in array array['v2_notifications', 'v2_session_requests', 'v2_housing_beds', 'v2_housing_applications']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;

-- 3. Private voice-notes bucket; files live under <auth.uid()>/... and are
-- readable/writable only by their owner. Upsert needs INSERT + SELECT + UPDATE.
insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', false)
on conflict (id) do nothing;

create policy "voice_notes_owner_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "voice_notes_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "voice_notes_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "voice_notes_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;
