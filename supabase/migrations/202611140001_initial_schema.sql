create type public.user_role as enum ('athlete','coach');
create type public.workout_status as enum ('planned','completed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 100),
  role public.user_role not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.athlete_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  ftp integer check (ftp between 1 and 1000),
  max_heart_rate integer check (max_heart_rate between 40 and 250),
  resting_heart_rate integer check (resting_heart_rate between 20 and 150),
  sport text not null default 'cycling', units text not null default 'metric'
);
create table public.coach_athlete_links (
  id uuid primary key default gen_random_uuid(), athlete_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade, active boolean not null default true,
  monitoring_permissions jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(athlete_id,coach_id)
);
create table public.planned_workouts (
  id uuid primary key default gen_random_uuid(), athlete_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null references public.profiles(id), title text not null check(length(title) between 1 and 160),
  scheduled_at timestamptz not null, sport text not null default 'cycling', planned_duration_seconds integer not null check(planned_duration_seconds>0),
  planned_distance_meters integer check(planned_distance_meters>=0), intensity text, objective text, description text, coach_notes text,
  status public.workout_status not null default 'planned', version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.workout_intervals (
  id uuid primary key default gen_random_uuid(), workout_id uuid not null references public.planned_workouts(id) on delete cascade,
  position integer not null check(position>=0), kind text not null, duration_seconds integer not null check(duration_seconds>0),
  target_watts integer, target_ftp_percent numeric(5,2), repetitions integer not null default 1 check(repetitions>0), recovery_seconds integer check(recovery_seconds>=0), unique(workout_id,position)
);
create table public.completed_activities (
  id uuid primary key default gen_random_uuid(), athlete_id uuid not null references public.profiles(id) on delete cascade,
  planned_workout_id uuid references public.planned_workouts(id) on delete set null, source text not null default 'manual', source_file_hash text,
  started_at timestamptz not null, sport text not null, duration_seconds integer not null check(duration_seconds>0), distance_meters numeric check(distance_meters>=0),
  avg_power integer, normalized_power integer, avg_heart_rate integer, tss numeric, raw_file_path text, created_at timestamptz not null default now(), unique(athlete_id,source_file_hash)
);
create table public.daily_monitoring (
  id uuid primary key default gen_random_uuid(), athlete_id uuid not null references public.profiles(id) on delete cascade, recorded_on date not null,
  resting_heart_rate integer, weight_kg numeric(5,2), hrv_ms numeric, sleep_hours numeric(4,2), sleep_quality smallint, fatigue smallint,
  muscle_soreness smallint, motivation smallint, overall_feeling smallint, notes text, created_at timestamptz not null default now(), unique(athlete_id,recorded_on),
  check(sleep_quality between 1 and 10), check(fatigue between 1 and 10)
);
create table public.workout_comments (
  id uuid primary key default gen_random_uuid(), workout_id uuid not null references public.planned_workouts(id) on delete cascade,
  author_id uuid not null references public.profiles(id), body text not null check(length(body) between 1 and 2000), created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null, title text not null, body text, read_at timestamptz, created_at timestamptz not null default now()
);
create index planned_workouts_athlete_date_idx on public.planned_workouts(athlete_id,scheduled_at);
create index activities_athlete_date_idx on public.completed_activities(athlete_id,started_at desc);
create index monitoring_athlete_date_idx on public.daily_monitoring(athlete_id,recorded_on desc);

create function public.is_authorized_coach(target_athlete uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.coach_athlete_links where athlete_id=target_athlete and coach_id=auth.uid() and active)
$$;
alter table public.profiles enable row level security; alter table public.athlete_profiles enable row level security;
alter table public.coach_athlete_links enable row level security; alter table public.planned_workouts enable row level security;
alter table public.workout_intervals enable row level security; alter table public.completed_activities enable row level security;
alter table public.daily_monitoring enable row level security; alter table public.workout_comments enable row level security; alter table public.notifications enable row level security;
create policy profiles_self_or_linked on public.profiles for select using(id=auth.uid() or public.is_authorized_coach(id) or exists(select 1 from public.coach_athlete_links l where l.coach_id=profiles.id and l.athlete_id=auth.uid() and l.active));
create policy profiles_self_update on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
create policy athlete_profile_owner on public.athlete_profiles for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy athlete_profile_coach_read on public.athlete_profiles for select using(public.is_authorized_coach(user_id));
create policy links_participants_read on public.coach_athlete_links for select using(athlete_id=auth.uid() or coach_id=auth.uid());
create policy links_athlete_manage on public.coach_athlete_links for all using(athlete_id=auth.uid()) with check(athlete_id=auth.uid());
create policy workouts_participants_read on public.planned_workouts for select using(athlete_id=auth.uid() or public.is_authorized_coach(athlete_id));
create policy workouts_coach_write on public.planned_workouts for all using(public.is_authorized_coach(athlete_id)) with check(public.is_authorized_coach(athlete_id) and created_by=auth.uid());
create policy intervals_participants on public.workout_intervals for select using(exists(select 1 from public.planned_workouts w where w.id=workout_id and (w.athlete_id=auth.uid() or public.is_authorized_coach(w.athlete_id))));
create policy intervals_coach_write on public.workout_intervals for all using(exists(select 1 from public.planned_workouts w where w.id=workout_id and public.is_authorized_coach(w.athlete_id)));
create policy activities_owner on public.completed_activities for all using(athlete_id=auth.uid()) with check(athlete_id=auth.uid());
create policy activities_coach_read on public.completed_activities for select using(public.is_authorized_coach(athlete_id));
create policy monitoring_owner on public.daily_monitoring for all using(athlete_id=auth.uid()) with check(athlete_id=auth.uid());
create policy comments_participants on public.workout_comments for all using(author_id=auth.uid() or exists(select 1 from public.planned_workouts w where w.id=workout_id and (w.athlete_id=auth.uid() or public.is_authorized_coach(w.athlete_id))));
create policy notifications_owner on public.notifications for select using(user_id=auth.uid());
create policy notifications_owner_update on public.notifications for update using(user_id=auth.uid()) with check(user_id=auth.uid());
alter publication supabase_realtime add table public.planned_workouts, public.workout_comments, public.notifications;
