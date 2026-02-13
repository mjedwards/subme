create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger stores_set_updated_at
before update on stores
for each row
execute function set_updated_at();

create trigger profiles_set_updated_at
before update on profiles
for each row
execute function set_updated_at();

create trigger store_staff_set_updated_at
before update on store_staff
for each row
execute function set_updated_at();

create trigger customers_set_updated_at
before update on customers
for each row
execute function set_updated_at();

create trigger plans_set_updated_at
before update on plans
for each row
execute function set_updated_at();

create trigger subscriptions_set_updated_at
before update on subscriptions
for each row
execute function set_updated_at();

create trigger redemptions_set_updated_at
before update on redemptions
for each row
execute function set_updated_at();

create trigger store_domains_set_updated_at
before update on store_domains
for each row
execute function set_updated_at();

create trigger leads_set_updated_at
before update on leads
for each row
execute function set_updated_at();
