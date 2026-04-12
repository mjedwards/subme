alter table profiles
add column stripe_account_id text,
add column stripe_charges_enabled boolean default false,
add column stripe_payouts_enabled boolean default false,
add column stripe_details_submitted boolean default false;
