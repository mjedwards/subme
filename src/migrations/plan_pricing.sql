alter table plans
add column stripe_product_id text,
add column amount_cents integer,
add column currency text default 'usd',
add column billing_interval text;
