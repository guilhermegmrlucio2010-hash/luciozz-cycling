create policy workouts_athlete_insert on public.planned_workouts for insert
with check (athlete_id=auth.uid() and created_by=auth.uid());
create policy workouts_athlete_update on public.planned_workouts for update
using (athlete_id=auth.uid()) with check (athlete_id=auth.uid());
create policy workouts_athlete_delete on public.planned_workouts for delete
using (athlete_id=auth.uid());
