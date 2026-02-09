create table subscriptions (
  id uuid primary key,
  store_id uuid not null references stores(id),
  customer_id uuid not null references customers(id),
  plan_id uuid not null references plans(id),
  provider text default 'stripe',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  last_event_created timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
