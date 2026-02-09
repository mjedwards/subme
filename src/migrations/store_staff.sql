create table store_staff (
  id uuid primary key,
  store_id uuid not null references stores(id),
  profile_id uuid not null references profiles(user_id),
  role text not null,
  active boolean default true,
  work_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (store_id, profile_id),
  check (role in ('owner', 'staff'))
);
