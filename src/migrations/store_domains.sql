create table store_domains (
  id uuid primary key,
  store_id uuid not null references stores(id),
  hostname text unique not null,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
