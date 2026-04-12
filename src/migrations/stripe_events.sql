create table stripe_events (
  id uuid primary key,
  event_id text unique not null,
  type text not null,
  stripe_account_id text,
  created_at timestamptz,
  payload jsonb,
  processed_at timestamptz default now()
);
