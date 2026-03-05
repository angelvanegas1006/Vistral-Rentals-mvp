-- Migration: RLS policies to protect dev cards (is_dev=true)
-- Non-developer users cannot see or modify dev rows.
-- Service role key bypasses RLS (API routes already have server-side checks).
-- Run in Supabase SQL Editor AFTER add_is_dev_column.sql

-- ==========================================
-- LEADS TABLE
-- ==========================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow access to non-dev leads for any authenticated user.
-- Allow access to dev leads ONLY for users with role='developer'.
CREATE POLICY "leads_dev_protection" ON leads
FOR ALL TO authenticated
USING (
  is_dev IS NOT TRUE
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'developer'
  )
)
WITH CHECK (
  is_dev IS NOT TRUE
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'developer'
  )
);

-- ==========================================
-- PROPERTIES TABLE (defense-in-depth)
-- ==========================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "properties_dev_protection" ON properties
FOR ALL TO authenticated
USING (
  is_dev IS NOT TRUE
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'developer'
  )
)
WITH CHECK (
  is_dev IS NOT TRUE
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'developer'
  )
);
