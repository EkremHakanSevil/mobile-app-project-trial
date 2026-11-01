-- Arena: başlangıç şeması. Tüm modüller (profil, antrenman, beslenme, salonlar,
-- günlük giriş, kulüpler, sosyal akış, yarışmalar) baştan burada tanımlıdır.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enum'lar
-- ---------------------------------------------------------------------------
create type sex as enum ('male', 'female');
create type fitness_goal as enum ('lose_fat', 'build_muscle', 'strength', 'endurance', 'maintain');
create type activity_level as enum ('sedentary', 'light', 'moderate', 'active', 'very_active');
create type experience_level as enum ('beginner', 'intermediate', 'advanced');

create type muscle_group as enum (
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body', 'cardio'
);
create type exercise_category as enum ('strength', 'calisthenics', 'cardio', 'mobility');

create type meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type meal_source as enum ('photo_ai', 'manual', 'barcode');

create type day_pass_status as enum ('pending', 'paid', 'used', 'refunded', 'expired');
create type gym_staff_role as enum ('owner', 'staff');

create type sport_category as enum ('running', 'weightlifting', 'calisthenics', 'crossfit', 'cycling', 'general');
create type club_role as enum ('owner', 'admin', 'member');

-- Yarışma sonucunun nasıl sıralanacağı
create type competition_metric as enum ('time_asc', 'reps_desc', 'weight_desc', 'distance_desc');
create type proof_type as enum ('none', 'video', 'gps');
create type entry_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------------
-- Yardımcı: updated_at
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Profil
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username ~ '^[a-z0-9_]{3,24}$'),
  full_name text,
  avatar_path text,
  bio text check (char_length(bio) <= 300),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Sağlık verisi (KVKK: özel nitelikli). Ayrı tabloda, yalnızca sahibi erişir.
create table health_profiles (
  user_id uuid primary key references profiles (id) on delete cascade,
  birth_date date not null,
  sex sex not null,
  height_cm numeric(5, 1) not null check (height_cm between 100 and 250),
  weight_kg numeric(5, 1) not null check (weight_kg between 30 and 300),
  goal fitness_goal not null,
  activity_level activity_level not null,
  experience experience_level not null,
  consented_at timestamptz not null default now(), -- açık rıza zamanı
  updated_at timestamptz not null default now()
);
create trigger health_profiles_updated_at before update on health_profiles
  for each row execute function set_updated_at();

-- Kilo geçmişi (grafik ve hedef takibi için)
create table body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  measured_on date not null default current_date,
  weight_kg numeric(5, 1) not null,
  body_fat_pct numeric(4, 1),
  unique (user_id, measured_on)
);

-- Yeni kullanıcıda otomatik profil satırı
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Antrenman
-- ---------------------------------------------------------------------------
create table exercises (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_tr text not null,
  name_en text not null,
  category exercise_category not null,
  primary_muscle muscle_group not null,
  secondary_muscles muscle_group[] not null default '{}',
  equipment text,
  met numeric(4, 1), -- kalori tahmini için MET değeri
  created_by uuid references profiles (id) on delete set null -- null = sistem egzersizi
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  perceived_effort smallint check (perceived_effort between 1 and 10),
  -- AI değerlendirmesi: { verdict: 'under'|'optimal'|'over', summary, suggestions[], redundant[] }
  evaluation jsonb,
  created_at timestamptz not null default now()
);
create index workouts_user_started on workouts (user_id, started_at desc);

create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts (id) on delete cascade,
  exercise_id uuid not null references exercises (id),
  set_index smallint not null,
  reps smallint,
  weight_kg numeric(6, 2),
  duration_s integer,
  distance_m numeric(8, 1),
  rpe numeric(3, 1) check (rpe between 1 and 10),
  unique (workout_id, exercise_id, set_index)
);

-- ---------------------------------------------------------------------------
-- Beslenme
-- ---------------------------------------------------------------------------
create table meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  eaten_at timestamptz not null default now(),
  meal_type meal_type not null,
  source meal_source not null default 'manual',
  photo_path text,
  ai_confidence numeric(3, 2) check (ai_confidence between 0 and 1),
  created_at timestamptz not null default now()
);
create index meals_user_eaten on meals (user_id, eaten_at desc);

create table meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references meals (id) on delete cascade,
  name text not null,
  grams numeric(7, 1),
  kcal numeric(7, 1) not null,
  protein_g numeric(6, 1) not null default 0,
  carbs_g numeric(6, 1) not null default 0,
  fat_g numeric(6, 1) not null default 0
);

-- ---------------------------------------------------------------------------
-- Salonlar ve günlük giriş
-- Google Places verisi lisans gereği kalıcı saklanmaz; yalnızca place_id tutulur.
-- Ad/konum yalnızca anlaşmalı (salonun kendi verdiği) kayıtlar için saklanır.
-- ---------------------------------------------------------------------------
create table gyms (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique,
  name text not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  is_partner boolean not null default false,
  day_pass_price numeric(8, 2),        -- normal günlük ücret (TL)
  partner_price numeric(8, 2),         -- uygulama üzerinden indirimli ücret
  amenities text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (not is_partner or partner_price is not null)
);
create index gyms_partner_geo on gyms (is_partner, lat, lng);

create table gym_staff (
  gym_id uuid not null references gyms (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role gym_staff_role not null default 'staff',
  primary key (gym_id, user_id)
);

create table day_passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  gym_id uuid not null references gyms (id),
  valid_on date not null,
  price_paid numeric(8, 2) not null,
  currency text not null default 'TRY',
  status day_pass_status not null default 'pending',
  payment_provider text,
  payment_ref text unique,
  qr_token text unique not null default encode(gen_random_bytes(24), 'hex'),
  used_at timestamptz,
  verified_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index day_passes_user on day_passes (user_id, valid_on desc);

-- ---------------------------------------------------------------------------
-- Kulüpler ve sosyal akış
-- ---------------------------------------------------------------------------
create table clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 60),
  description text,
  category sport_category not null,
  city text,
  avatar_path text,
  is_private boolean not null default false,
  owner_id uuid not null references profiles (id),
  home_gym_id uuid references gyms (id) on delete set null,
  created_at timestamptz not null default now()
);

create table club_members (
  club_id uuid not null references clubs (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role club_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

-- Kulüp kurucusu otomatik owner üye olur
create or replace function handle_new_club() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into club_members (club_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end $$;
create trigger on_club_created after insert on clubs
  for each row execute function handle_new_club();

create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  club_id uuid references clubs (id) on delete cascade, -- null = genel akış
  body text check (char_length(body) <= 2000),
  media_paths text[] not null default '{}',
  workout_id uuid references workouts (id) on delete set null, -- antrenman paylaşımı
  created_at timestamptz not null default now()
);
create index posts_club_created on posts (club_id, created_at desc);

create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table post_likes (
  post_id uuid not null references posts (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  primary key (post_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Yarışmalar
-- ---------------------------------------------------------------------------
create table competitions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs (id) on delete cascade,
  title text not null,
  description text,
  category sport_category not null,
  exercise_id uuid references exercises (id),
  metric competition_metric not null,
  unit text not null, -- 's', 'reps', 'kg', 'm'
  proof proof_type not null default 'video',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  sponsor_name text,
  prize text,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table competition_entries (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  value numeric(10, 2) not null check (value > 0),
  proof_path text,
  status entry_status not null default 'pending',
  reviewed_by uuid references profiles (id),
  submitted_at timestamptz not null default now(),
  unique (competition_id, user_id)
);

create table entry_reports (
  entry_id uuid not null references competition_entries (id) on delete cascade,
  reporter_id uuid not null references profiles (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  primary key (entry_id, reporter_id)
);

-- Onaylı sonuçlardan sıralama
create view competition_leaderboard with (security_invoker = true) as
select
  e.competition_id,
  e.user_id,
  p.username,
  p.avatar_path,
  e.value,
  rank() over (
    partition by e.competition_id
    order by case when c.metric = 'time_asc' then e.value else -e.value end
  ) as rank
from competition_entries e
join competitions c on c.id = e.competition_id
join profiles p on p.id = e.user_id
where e.status = 'approved';

-- ---------------------------------------------------------------------------
-- Yetki yardımcıları
-- ---------------------------------------------------------------------------
create or replace function is_club_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from club_members where club_id = cid and user_id = auth.uid());
$$;

create or replace function is_club_admin(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from club_members
    where club_id = cid and user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

create or replace function can_view_club(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from clubs where id = cid and not is_private) or is_club_member(cid);
$$;

create or replace function is_gym_staff(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from gym_staff where gym_id = gid and user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table health_profiles enable row level security;
alter table body_measurements enable row level security;
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_sets enable row level security;
alter table meals enable row level security;
alter table meal_items enable row level security;
alter table gyms enable row level security;
alter table gym_staff enable row level security;
alter table day_passes enable row level security;
alter table clubs enable row level security;
alter table club_members enable row level security;
alter table posts enable row level security;
alter table post_comments enable row level security;
alter table post_likes enable row level security;
alter table competitions enable row level security;
alter table competition_entries enable row level security;
alter table entry_reports enable row level security;

-- Profil herkese açık (kullanıcı adı, avatar, bio); sağlık verisi yalnızca sahibine.
create policy "profiles read" on profiles for select to authenticated using (true);
create policy "profiles update own" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "health own" on health_profiles for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "measurements own" on body_measurements for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "exercises read" on exercises for select to authenticated using (true);
create policy "exercises create custom" on exercises for insert to authenticated
  with check (created_by = auth.uid());

create policy "workouts own" on workouts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "workout_sets own" on workout_sets for all to authenticated
  using (exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid()));

create policy "meals own" on meals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "meal_items own" on meal_items for all to authenticated
  using (exists (select 1 from meals m where m.id = meal_id and m.user_id = auth.uid()))
  with check (exists (select 1 from meals m where m.id = meal_id and m.user_id = auth.uid()));

create policy "gyms read" on gyms for select to authenticated using (active);
create policy "gyms staff update" on gyms for update to authenticated
  using (is_gym_staff(id)) with check (is_gym_staff(id));
create policy "gym_staff read own" on gym_staff for select to authenticated
  using (user_id = auth.uid());

-- Günlük giriş: oluşturma/ödeme onayı yalnızca edge function (service role) ile.
create policy "day_passes read own or staff" on day_passes for select to authenticated
  using (user_id = auth.uid() or is_gym_staff(gym_id));

create policy "clubs read" on clubs for select to authenticated using (can_view_club(id));
create policy "clubs create" on clubs for insert to authenticated with check (owner_id = auth.uid());
create policy "clubs admin update" on clubs for update to authenticated
  using (is_club_admin(id)) with check (is_club_admin(id));
create policy "clubs owner delete" on clubs for delete to authenticated using (owner_id = auth.uid());

create policy "members read" on club_members for select to authenticated using (can_view_club(club_id));
create policy "members join public" on club_members for insert to authenticated
  with check (
    user_id = auth.uid() and role = 'member'
    and exists (select 1 from clubs where id = club_id and not is_private)
  );
create policy "members leave or kick" on club_members for delete to authenticated
  using (user_id = auth.uid() or is_club_admin(club_id));

create policy "posts read" on posts for select to authenticated
  using (club_id is null or can_view_club(club_id));
create policy "posts create" on posts for insert to authenticated
  with check (author_id = auth.uid() and (club_id is null or is_club_member(club_id)));
create policy "posts delete" on posts for delete to authenticated
  using (author_id = auth.uid() or (club_id is not null and is_club_admin(club_id)));

create policy "comments read" on post_comments for select to authenticated
  using (exists (select 1 from posts p where p.id = post_id));
create policy "comments create" on post_comments for insert to authenticated
  with check (author_id = auth.uid() and exists (select 1 from posts p where p.id = post_id));
create policy "comments delete own" on post_comments for delete to authenticated
  using (author_id = auth.uid());

create policy "likes read" on post_likes for select to authenticated using (true);
create policy "likes own" on post_likes for insert to authenticated with check (user_id = auth.uid());
create policy "unlike own" on post_likes for delete to authenticated using (user_id = auth.uid());

create policy "competitions read" on competitions for select to authenticated using (can_view_club(club_id));
create policy "competitions admin write" on competitions for all to authenticated
  using (is_club_admin(club_id)) with check (is_club_admin(club_id) and created_by = auth.uid());

create policy "entries read" on competition_entries for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from competitions c where c.id = competition_id and can_view_club(c.club_id))
  );
create policy "entries submit" on competition_entries for insert to authenticated
  with check (
    user_id = auth.uid() and status = 'pending'
    and exists (
      select 1 from competitions c
      where c.id = competition_id and is_club_member(c.club_id)
        and now() between c.starts_at and c.ends_at
    )
  );
create policy "entries review" on competition_entries for update to authenticated
  using (exists (select 1 from competitions c where c.id = competition_id and is_club_admin(c.club_id)));

create policy "reports create" on entry_reports for insert to authenticated
  with check (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage bucket'ları (dosya yolu: <user_id>/<dosya>)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('meal-photos', 'meal-photos', false),
  ('post-media', 'post-media', true),
  ('proofs', 'proofs', false)
on conflict (id) do nothing;

create policy "upload own folder" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'meal-photos', 'post-media', 'proofs')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "read own private files" on storage.objects for select to authenticated
  using (bucket_id in ('meal-photos', 'proofs') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own files" on storage.objects for delete to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);
