-- ============================================================
-- Comparte Viaje - Esquema de base de datos (Supabase / Postgres)
-- ============================================================
-- Auth propia (sin proveedor externo): el usuario se identifica
-- con su DNI + email, y su contraseña se guarda hasheada
-- (bcrypt). El "id" de cada usuario ES su número de DNI.
-- ============================================================

create extension if not exists "pgcrypto";

-- Usuarios
create table if not exists profiles (
  id text primary key,                 -- número de DNI (sin puntos)
  dni text unique not null,            -- mismo valor que id, se mantiene
                                        -- como columna aparte por claridad semántica
  email text unique not null,
  password_hash text not null,
  name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint dni_matches_id check (id = dni),
  constraint dni_format check (dni ~ '^[0-9]{7,8}$')
);

create index if not exists idx_profiles_email on profiles (lower(email));

-- Viajes publicados
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  driver_id text not null references profiles(id) on delete cascade,
  title text not null,
  origin text not null,
  destination text not null,
  departure_date timestamptz not null,
  seats_total int not null check (seats_total > 0),
  seats_available int not null check (seats_available >= 0),
  price_per_seat numeric(10,2) default 0,
  description text,
  status text not null default 'active', -- active | cancelled | completed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_trips_origin on trips (lower(origin));
create index if not exists idx_trips_destination on trips (lower(destination));
create index if not exists idx_trips_departure on trips (departure_date);

-- Pasajeros / participantes de un viaje
create table if not exists trip_participants (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  user_id text not null references profiles(id) on delete cascade,
  status text not null default 'confirmed', -- pending | confirmed | rejected | cancelled
  seats_reserved int not null default 1,
  created_at timestamptz default now(),
  unique (trip_id, user_id)
);

-- Gastos asociados a un viaje (nafta, peajes, comida, etc.)
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  paid_by text not null references profiles(id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null check (amount > 0),
  created_at timestamptz default now()
);

-- Cómo se divide cada gasto entre los participantes
create table if not exists expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  user_id text not null references profiles(id) on delete cascade,
  amount_owed numeric(10,2) not null check (amount_owed >= 0),
  settled boolean not null default false,
  unique (expense_id, user_id)
);

-- ============================================================
-- Row Level Security
-- El backend accede con la Service Role Key (bypassa RLS) y es
-- quien valida el JWT propio, así que RLS queda como una
-- segunda capa de defensa por si en el futuro se expone la
-- anon key directamente al cliente.
-- ============================================================
alter table profiles enable row level security;
alter table trips enable row level security;
alter table trip_participants enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;

-- Lectura pública de viajes activos (útil si en el futuro se
-- quiere buscar sin login). Escrituras solo vía service role.
create policy "trips_public_read" on trips
  for select using (true);
