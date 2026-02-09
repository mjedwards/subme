create table redemptions (
  id uuid primary key,
  store_id uuid not null references stores(id),
  subscription_id uuid not null references subscriptions(id),
  customer_id uuid not null references customers(id),
  period_start timestamptz not null,
  redeemed_at timestamptz default now(),
  staff_user_id uuid references profiles(user_id),
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (subscription_id, period_start)
);
