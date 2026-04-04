-- 1. Refactor user_pins: replace status enum with three independent boolean flags
ALTER TABLE user_pins
  ADD COLUMN in_collection boolean NOT NULL DEFAULT false,
  ADD COLUMN wishlisted    boolean NOT NULL DEFAULT false,
  ADD COLUMN want_to_trade boolean NOT NULL DEFAULT false;

UPDATE user_pins SET in_collection = true WHERE status IN ('collection', 'trading');
UPDATE user_pins SET want_to_trade = true WHERE status = 'trading';
UPDATE user_pins SET wishlisted    = true WHERE status = 'wishlist';

ALTER TABLE user_pins DROP COLUMN status;

-- 2. Create contacts table (each user's private catalog of non-Pindex trading partners)
CREATE TABLE contacts (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name              text        NOT NULL,
  linked_profile_id uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- 3. Refactor trades
--    - receiver_id → receiver_profile_id (nullable, since trade partner may not be on Pindex)
--    - add receiver_contact_id for non-Pindex partners
--    - simplify status: unconfirmed | confirmed
--    - replace completed_at with confirmed_at

ALTER TABLE trades RENAME COLUMN receiver_id TO receiver_profile_id;
ALTER TABLE trades ALTER COLUMN receiver_profile_id DROP NOT NULL;
ALTER TABLE trades RENAME CONSTRAINT trades_receiver_id_fkey TO trades_receiver_profile_id_fkey;

ALTER TABLE trades
  ADD COLUMN receiver_contact_id uuid        REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN confirmed_at        timestamptz;

ALTER TABLE trades DROP CONSTRAINT trades_status_check;
UPDATE trades SET status = 'confirmed'   WHERE status IN ('accepted', 'completed');
UPDATE trades SET status = 'unconfirmed' WHERE status IN ('pending',  'cancelled');
ALTER TABLE trades ALTER COLUMN status SET DEFAULT 'unconfirmed';
ALTER TABLE trades ADD CONSTRAINT trades_status_check CHECK (status IN ('unconfirmed', 'confirmed'));

-- Carry over completion timestamp as confirmation timestamp
UPDATE trades SET confirmed_at = completed_at WHERE status = 'confirmed' AND completed_at IS NOT NULL;
ALTER TABLE trades DROP COLUMN completed_at;

-- 4. Refactor trade_items
--    - side: offered/requested → gave/received (always from the initiator's perspective)
--    - drop owner_id (no longer meaningful)

ALTER TABLE trade_items DROP CONSTRAINT trade_items_side_check;
UPDATE trade_items SET side = 'gave'     WHERE side = 'offered';
UPDATE trade_items SET side = 'received' WHERE side = 'requested';
ALTER TABLE trade_items ADD CONSTRAINT trade_items_side_check CHECK (side IN ('gave', 'received'));

ALTER TABLE trade_items DROP COLUMN owner_id;
