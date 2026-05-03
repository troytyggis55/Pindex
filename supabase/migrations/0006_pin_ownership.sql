-- Add columns
ALTER TABLE pins
    ADD COLUMN created_by uuid REFERENCES profiles (id) ON DELETE SET NULL;
ALTER TABLE pins
    ADD COLUMN org_claimed_at timestamptz NULL;

-- Backfill: existing org-owned pins are considered already claimed
UPDATE pins
SET org_claimed_at = created_at
WHERE organization_id IS NOT NULL;

-- Indexes
CREATE INDEX pins_org_unclaimed_idx ON pins (organization_id, org_claimed_at) WHERE org_claimed_at IS NULL AND organization_id IS NOT NULL;
CREATE INDEX pins_created_by_idx ON pins (created_by) WHERE created_by IS NOT NULL;

-- Drop old pin policies
DROP
POLICY "pins: admin insert" ON pins;
DROP
POLICY "pins: admin update" ON pins;
DROP
POLICY "pins: superadmin delete" ON pins;

-- New INSERT: any authenticated user, must set created_by = self, org_claimed_at must be null
CREATE
POLICY "pins: authenticated insert" ON pins FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND org_claimed_at IS NULL);

-- New UPDATE: creator (while unclaimed) OR org admin (after claimed) OR superadmin
CREATE
POLICY "pins: owner or org admin update" ON pins FOR
UPDATE TO authenticated
    USING (
    (created_by = auth.uid() AND org_claimed_at IS NULL)
    OR (org_claimed_at IS NOT NULL AND exists (
    select 1 from organizations where id = organization_id and admin_user_id = auth.uid()))
    OR exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
    )
WITH CHECK (
    (created_by = auth.uid() AND org_claimed_at IS NULL)
    OR (org_claimed_at IS NOT NULL AND exists (
    select 1 from organizations where id = organization_id and admin_user_id = auth.uid()))
    OR exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
    );

-- New DELETE: creator of unclaimed pin OR superadmin
CREATE
POLICY "pins: owner or superadmin delete" ON pins FOR DELETE
TO authenticated
  USING (
    (created_by = auth.uid() AND org_claimed_at IS NULL)
    OR exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );

-- Claim RPC: SECURITY DEFINER so the org admin can set org_claimed_at
CREATE
OR REPLACE FUNCTION claim_pin_for_org(p_pin_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
v_pin pins%ROWTYPE;
BEGIN
SELECT *
INTO v_pin
FROM pins
WHERE id = p_pin_id;
IF
NOT FOUND THEN RAISE EXCEPTION 'Pin not found';
END IF;
  IF
v_pin.org_claimed_at IS NOT NULL THEN RAISE EXCEPTION 'Already claimed';
END IF;
  IF
v_pin.organization_id IS NULL THEN RAISE EXCEPTION 'No org assigned';
END IF;
  IF
NOT exists (select 1 from organizations
    where id = v_pin.organization_id and admin_user_id = auth.uid())
  THEN RAISE EXCEPTION 'Not your org';
END IF;
UPDATE pins
SET org_claimed_at = now()
WHERE id = p_pin_id;
END; $$;

CREATE
POLICY "pin-images: creator upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pin-images'
    AND exists (select 1 from pins
      where id::text = split_part(name, '.', 1) and created_by = auth.uid()));