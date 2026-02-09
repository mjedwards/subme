create table plans (
  id uuid primary key,
  store_id uuid not null references stores(id),
  name text not null,
  description text,
  benefit_type text,
  redemptions_per_period int default 1,
  stripe_price_id text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
