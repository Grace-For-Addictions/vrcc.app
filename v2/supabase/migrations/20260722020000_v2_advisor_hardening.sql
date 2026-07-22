-- VRCC v2: fixes for security-advisor findings.
-- APPLIED to ykykeioydvtxpyreshhs as migration `v2_advisor_hardening`.

begin;

-- 1. Pin search_path on the bed-touch trigger function.
create or replace function public.v2_touch_bed()
returns trigger
language plpgsql set search_path = public as
$$ begin new.updated_at = now(); return new; end $$;

-- 2. Staff application updates: WITH CHECK must mirror USING so a row can't
--    be moved outside the staff member's program scope.
drop policy v2_ha_program_staff_update on public.v2_housing_applications;
create policy v2_ha_program_staff_update on public.v2_housing_applications
  for update to authenticated
  using (exists (select 1 from public.v2_housing_programs p
                 where p.id = program_id
                   and (p.manager_id = auth.uid() or p.navigator_id = auth.uid()
                        or public.v2_my_role() = 'admin')))
  with check (exists (select 1 from public.v2_housing_programs p
                      where p.id = program_id
                        and (p.manager_id = auth.uid() or p.navigator_id = auth.uid()
                             or public.v2_my_role() = 'admin')));

-- 3. RLS helper functions: only authenticated needs EXECUTE (policies evaluate
--    them as the querying role); anon and PUBLIC do not.
revoke execute on function
  public.v2_my_role(),
  public.v2_is_staff(),
  public.v2_is_my_participant(uuid)
from public, anon;
grant execute on function
  public.v2_my_role(),
  public.v2_is_staff(),
  public.v2_is_my_participant(uuid)
to authenticated;

commit;
