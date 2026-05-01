-- ============================================================
-- RLS policies for all tables and storage buckets
-- ============================================================

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
alter table profiles enable row level security;

-- Anyone authenticated can read any profile (needed for search, social, trade confirmation)
create policy "profiles: authenticated read"
  on profiles for select
  to authenticated
  using (true);

-- Profile is created by the trigger (handle_new_user) which runs as postgres/service role,
-- so no INSERT policy for the client is needed.

-- Users can update only their own profile
create policy "profiles: update own"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- delete_own_account() is SECURITY DEFINER so it bypasses RLS — no DELETE policy needed.


-- ------------------------------------------------------------
-- organizations
-- ------------------------------------------------------------
alter table organizations enable row level security;

-- Anyone authenticated can read organizations (needed for pin browsing)
create policy "organizations: authenticated read"
  on organizations for select
  to authenticated
  using (true);

-- Only superadmin can create organizations
create policy "organizations: superadmin insert"
  on organizations for insert
  to authenticated
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );

-- Org admin can update their own org; superadmin can update any
create policy "organizations: admin update"
  on organizations for update
  to authenticated
  using (
    admin_user_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  )
  with check (
    admin_user_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );

-- Only superadmin can delete organizations
create policy "organizations: superadmin delete"
  on organizations for delete
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );


-- ------------------------------------------------------------
-- pins
-- ------------------------------------------------------------
alter table pins enable row level security;

-- Anyone authenticated can read pins
create policy "pins: authenticated read"
  on pins for select
  to authenticated
  using (true);

-- Org admin can insert pins for their org; superadmin can insert any
create policy "pins: admin insert"
  on pins for insert
  to authenticated
  with check (
    exists (
      select 1 from organizations
      where id = organization_id
        and (
          admin_user_id = auth.uid()
          or exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
        )
    )
  );

-- Org admin can update pins for their org; superadmin can update any
create policy "pins: admin update"
  on pins for update
  to authenticated
  using (
    exists (
      select 1 from organizations
      where id = organization_id
        and (
          admin_user_id = auth.uid()
          or exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
        )
    )
  )
  with check (
    exists (
      select 1 from organizations
      where id = organization_id
        and (
          admin_user_id = auth.uid()
          or exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
        )
    )
  );

-- Only superadmin can delete pins
create policy "pins: superadmin delete"
  on pins for delete
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );


-- ------------------------------------------------------------
-- user_pins
-- ------------------------------------------------------------
alter table user_pins enable row level security;

-- Users can read their own collection; others can read it too (needed for trade browsing)
create policy "user_pins: authenticated read"
  on user_pins for select
  to authenticated
  using (true);

-- Users can only insert their own user_pin rows
create policy "user_pins: insert own"
  on user_pins for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can only update their own rows (toggle flags)
create policy "user_pins: update own"
  on user_pins for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can only delete their own rows
create policy "user_pins: delete own"
  on user_pins for delete
  to authenticated
  using (user_id = auth.uid());


-- ------------------------------------------------------------
-- contacts
-- ------------------------------------------------------------
alter table contacts enable row level security;

-- Contacts are private — only the owning user can see them
create policy "contacts: read own"
  on contacts for select
  to authenticated
  using (user_id = auth.uid());

create policy "contacts: insert own"
  on contacts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "contacts: update own"
  on contacts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "contacts: delete own"
  on contacts for delete
  to authenticated
  using (user_id = auth.uid());


-- ------------------------------------------------------------
-- trades
-- ------------------------------------------------------------
alter table trades enable row level security;

-- Both parties can read trades they are part of
create policy "trades: read as participant"
  on trades for select
  to authenticated
  using (
    initiator_id = auth.uid()
    or receiver_profile_id = auth.uid()
  );

-- Any authenticated user can create a trade (they become the initiator)
create policy "trades: insert as initiator"
  on trades for insert
  to authenticated
  with check (initiator_id = auth.uid());

-- Initiator can update (e.g. cancel); receiver can update status to confirmed
create policy "trades: update as participant"
  on trades for update
  to authenticated
  using (
    initiator_id = auth.uid()
    or receiver_profile_id = auth.uid()
  );

-- Only the initiator can delete an unconfirmed trade
create policy "trades: delete own unconfirmed"
  on trades for delete
  to authenticated
  using (
    initiator_id = auth.uid()
    and status = 'unconfirmed'
  );


-- ------------------------------------------------------------
-- trade_items
-- ------------------------------------------------------------
alter table trade_items enable row level security;

-- Participants of the parent trade can read its items
create policy "trade_items: read as participant"
  on trade_items for select
  to authenticated
  using (
    exists (
      select 1 from trades
      where id = trade_id
        and (initiator_id = auth.uid() or receiver_profile_id = auth.uid())
    )
  );

-- Initiator of the trade can insert items
create policy "trade_items: insert as initiator"
  on trade_items for insert
  to authenticated
  with check (
    exists (
      select 1 from trades
      where id = trade_id
        and initiator_id = auth.uid()
    )
  );

-- Initiator can delete items from an unconfirmed trade
create policy "trade_items: delete as initiator unconfirmed"
  on trade_items for delete
  to authenticated
  using (
    exists (
      select 1 from trades
      where id = trade_id
        and initiator_id = auth.uid()
        and status = 'unconfirmed'
    )
  );


-- ------------------------------------------------------------
-- follows
-- ------------------------------------------------------------
alter table follows enable row level security;

-- Anyone authenticated can see who follows whom
create policy "follows: authenticated read"
  on follows for select
  to authenticated
  using (true);

-- Users can only follow as themselves
create policy "follows: insert own"
  on follows for insert
  to authenticated
  with check (follower_id = auth.uid());

-- Users can only unfollow as themselves
create policy "follows: delete own"
  on follows for delete
  to authenticated
  using (follower_id = auth.uid());


-- ------------------------------------------------------------
-- Storage: profile-images bucket
-- Paths are structured as: {user_id}.jpg
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('profile-images', 'profile-images', true)
  on conflict (id) do nothing;

create policy "profile-images: public read"
  on storage.objects for select
  using (bucket_id = 'profile-images');

create policy "profile-images: upload own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-images'
    and name = auth.uid()::text || '.jpg'
  );

create policy "profile-images: update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-images'
    and name = auth.uid()::text || '.jpg'
  );

create policy "profile-images: delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-images'
    and name = auth.uid()::text || '.jpg'
  );
