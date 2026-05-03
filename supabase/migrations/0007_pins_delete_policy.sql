CREATE POLICY "pins: creator or org admin delete" ON pins FOR DELETE TO authenticated
  USING (
    (created_by = auth.uid() AND org_claimed_at IS NULL)
    OR EXISTS (
      SELECT 1 FROM organizations
      WHERE id = pins.organization_id
        AND admin_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );
