-- RLS is disabled for now (server uses service key only).
-- TODO: Enable RLS and add policies before production.

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  phone text not null,
  created_at timestamptz default now()
);

create table if not exists settings (
  user_id text primary key,
  alert_message text default 'I need help. Here is my live location:',
  sensitivity int default 5,
  phrases jsonb default '{"yerix":true,"help me":true,"save me":true}'::jsonb
);

create table if not exists emergencies (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  trigger text not null,
  status text default 'active',
  created_at timestamptz default now(),
  ended_at timestamptz
);

create table if not exists location_points (
  id bigserial primary key,
  emergency_id uuid references emergencies(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz default now()
);
