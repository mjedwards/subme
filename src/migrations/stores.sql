create table stores (
  id uuid primary key,
  slug text unique not null,
  name text not null,
  timezone text default 'America/New_York',
  branding jsonb,
  address_text text,
  lat double precision,
  lng double precision,
  geocoded_at timestamptz,
  geocoded_provider text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
