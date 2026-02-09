create table profiles (
  user_id uuid primary key references auth.users(id),
  email text not null,
  name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
