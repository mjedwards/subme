create table customers (
  id uuid primary key,
  store_id uuid not null references stores(id),
  profile_id uuid not null references profiles(user_id),
  email text,
  name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (store_id, profile_id),
  unique (store_id, email)
);
