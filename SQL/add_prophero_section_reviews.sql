-- Migration: Add prophero_section_reviews field to properties table
-- Date: 2026-02-02
-- Description: Adds JSONB field to store review state for Prophero phase sections

-- Add the column if it doesn't exist
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS prophero_section_reviews JSONB DEFAULT NULL;

-- Add a comment to document the field structure
COMMENT ON COLUMN properties.prophero_section_reviews IS 
'Stores review state for Prophero phase sections. Structure: {
  "section-id": {
    "reviewed": boolean,
    "isCorrect": boolean | null,
    "comments": string | null,
    "hasIssue": boolean
  }
}
hasIssue is a historical flag: once set to true (when isCorrect === false), it never reverts to false, even if the section is later marked as correct.';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'prophero_section_reviews';
