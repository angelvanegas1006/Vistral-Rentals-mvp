-- Migration: Add is_dev column to properties and leads tables
-- Purpose: Allow "developer" role to have isolated dev cards visible only via toggle
-- Run in Supabase SQL Editor

-- 1. Add is_dev column to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT false;

-- 2. Add is_dev column to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT false;

-- 3. Update developer profile role
UPDATE profiles SET role = 'developer' WHERE email = 'gustavo.garcia@prophero.com';
