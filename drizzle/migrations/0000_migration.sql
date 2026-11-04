
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at = now(); return new; end $$;

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.editing_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text,
  settings_json jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text,
  creative_brief text,
  target_duration int not null default 30,
  aspect_ratio text not null default '9:16',
  resolution text not null default '1080p',
  frame_rate int not null default 30,
  editing_style text[] not null default '{}',
  editing_pace text,
  narrative_objective text,
  hook_strategy jsonb not null default '{}'::jsonb,
  beat_sync_mode text,
  original_audio_mode text,
  subtitle_settings jsonb not null default '{}'::jsonb,
  transition_settings jsonb not null default '{}'::jsonb,
  effects_settings jsonb not null default '{}'::jsonb,
  color_profile text,
  editing_profile_id uuid references public.editing_profiles(id) on delete set null,
  status text not null default 'draft',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid references public.projects(id) on delete cascade,
  telegram_file_id text,
  telegram_file_unique_id text,
  filename text,
  file_size bigint,
  media_type text not null default 'video',
  duration numeric,
  width int, height int, frame_rate numeric, codec text,
  external_storage_reference text,
  download_status text not null default 'pending',
  analysis_status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (user_id, telegram_file_unique_id)
);

create table public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid references public.projects(id) on delete cascade,
  telegram_file_id text,
  filename text,
  duration numeric, bpm numeric, time_signature text,
  energy_data jsonb, beat_data jsonb,
  selected_start numeric, selected_end numeric,
  analysis_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.video_analysis (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete cascade,
  analysis_data jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.music_analysis (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  music_track_id uuid references public.music_tracks(id) on delete cascade,
  bpm numeric, beat_positions jsonb, downbeats jsonb, musical_bars jsonb, energy_curve jsonb, suggested_segments jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.edit_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version int not null default 1,
  timeline_json jsonb not null default '{}'::jsonb,
  creative_explanation text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid references public.projects(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued',
  progress int not null default 0,
  current_stage text,
  worker_id text,
  error_message text,
  idempotency_key text unique,
  payload jsonb not null default '{}'::jsonb,
  started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.renders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  version int not null default 1,
  output_reference text, preview_url text, download_url text,
  duration numeric, resolution text, file_size bigint,
  quality_report jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  render_id uuid references public.renders(id) on delete cascade,
  feedback_type text not null default 'comment',
  feedback_text text,
  preference_tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.integration_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  event_type text not null,
  external_event_id text,
  processing_status text not null default 'received',
  error_message text,
  created_at timestamptz not null default now(),
  unique (source, external_event_id)
);

create index on public.projects(user_id); create index on public.projects(status);
create index on public.assets(user_id); create index on public.assets(project_id);
create index on public.music_tracks(project_id); create index on public.video_analysis(project_id);
create index on public.music_analysis(project_id); create index on public.edit_plans(project_id);
create index on public.jobs(user_id); create index on public.jobs(project_id); create index on public.jobs(status);
create index on public.renders(user_id); create index on public.renders(project_id);
create index on public.feedback(project_id); create index on public.editing_profiles(user_id);

create trigger t1 before update on public.user_profiles for each row execute function public.set_updated_at();
create trigger t2 before update on public.projects for each row execute function public.set_updated_at();
create trigger t3 before update on public.editing_profiles for each row execute function public.set_updated_at();
create trigger t4 before update on public.video_analysis for each row execute function public.set_updated_at();

create or replace function public.owns_project(_pid uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.projects where id=_pid and user_id=auth.uid()) $$;

grant select, insert, update, delete on public.user_profiles, public.editing_profiles, public.projects, public.assets, public.music_tracks, public.video_analysis, public.music_analysis, public.edit_plans, public.jobs, public.renders, public.feedback to authenticated;
grant all on public.user_profiles, public.editing_profiles, public.projects, public.assets, public.music_tracks, public.video_analysis, public.music_analysis, public.edit_plans, public.jobs, public.renders, public.feedback, public.integration_events to service_role;

alter table public.user_profiles enable row level security;
alter table public.editing_profiles enable row level security;
alter table public.projects enable row level security;
alter table public.assets enable row level security;
alter table public.music_tracks enable row level security;
alter table public.video_analysis enable row level security;
alter table public.music_analysis enable row level security;
alter table public.edit_plans enable row level security;
alter table public.jobs enable row level security;
alter table public.renders enable row level security;
alter table public.feedback enable row level security;
alter table public.integration_events enable row level security;

create policy own on public.user_profiles for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy own on public.editing_profiles for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy own on public.projects for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy own on public.assets for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid() and (project_id is null or public.owns_project(project_id)));
create policy own on public.music_tracks for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid() and (project_id is null or public.owns_project(project_id)));
create policy own on public.video_analysis for all to authenticated using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy own on public.music_analysis for all to authenticated using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy own on public.edit_plans for all to authenticated using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy own on public.jobs for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid() and (project_id is null or public.owns_project(project_id)));
create policy own on public.renders for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid() and public.owns_project(project_id));
create policy own on public.feedback for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid() and public.owns_project(project_id));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.user_profiles(user_id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1))); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter publication supabase_realtime add table public.jobs;
alter publication supabase_realtime add table public.renders;
