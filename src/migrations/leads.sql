create table leads (
  id uuid primary key,
  store_id uuid not null references stores(id),
  email text not null,
  phone text,
  source text,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
