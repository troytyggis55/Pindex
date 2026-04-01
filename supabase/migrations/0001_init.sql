create table profiles
(
    id         uuid primary key references auth.users (id) on delete cascade,
    username   text        not null unique,
    avatar_url text,
    role       text        not null default 'user' check (role in ('user', 'association_admin', 'superadmin')),
    created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table associations
(
    id            uuid primary key     default gen_random_uuid(),
    name          text        not null,
    logo_url      text,
    admin_user_id uuid        references profiles (id) on delete set null,
    created_at    timestamptz not null default now()
);

create table pins
(
    id             uuid primary key     default gen_random_uuid(),
    name           text        not null,
    description    text,
    image_url      text,
    association_id uuid        references associations (id) on delete set null,
    edition_size   int,
    created_at     timestamptz not null default now(),
    released_at    timestamptz
);

create table user_pins
(
    id          uuid primary key     default gen_random_uuid(),
    user_id     uuid        not null references profiles (id) on delete cascade,
    pin_id      uuid        not null references pins (id) on delete cascade,
    status      text        not null check (status in ('collection', 'trading', 'wishlist')),
    acquired_at timestamptz not null default now(),
    unique (user_id, pin_id)
);

create table trades
(
    id           uuid primary key default gen_random_uuid(),
    initiator_id uuid not null references profiles (id) on delete cascade,
    receiver_id  uuid not null references profiles (id) on delete cascade,
    status       text not null    default 'pending' check (status in ('pending', 'accepted', 'completed', 'cancelled')),
    completed_at timestamptz
);

create table trade_items
(
    id       uuid primary key default gen_random_uuid(),
    trade_id uuid not null references trades (id) on delete cascade,
    pin_id   uuid not null references pins (id) on delete cascade,
    owner_id uuid not null references profiles (id) on delete cascade,
    side     text not null check (side in ('offered', 'requested'))
);

create table follows
(
    follower_id  uuid        not null references profiles (id) on delete cascade,
    following_id uuid        not null references profiles (id) on delete cascade,
    created_at   timestamptz not null default now(),
    primary key (follower_id, following_id)
);