-- Make username nullable so a freshly-created profile can exist without one.
-- This lets the app detect "logged in but no username chosen yet" and force
-- the user through the choose-username screen before entering the app.
alter table public.profiles alter column username drop not null;

-- The new-user trigger previously seeded username with the email address, which
-- made every profile look "complete" and silently skipped username selection.
-- Now it creates the row with a null username; the user sets it in-app.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;
