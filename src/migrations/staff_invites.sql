create table staff_invites (
  id uuid primary key,
  store_id uuid not null references stores(id),
  email text not null,
  role text not null default 'staff',
  token text not null unique,
  status text not null default 'pending',
  invited_by_user_id uuid references profiles(user_id),
  accepted_by_user_id uuid references profiles(user_id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (role in ('staff')),
  check (status in ('pending', 'accepted', 'revoked', 'expired'))
);

create index staff_invites_store_id_idx on staff_invites(store_id);
create index staff_invites_email_idx on staff_invites(email);
create index staff_invites_status_idx on staff_invites(status);
