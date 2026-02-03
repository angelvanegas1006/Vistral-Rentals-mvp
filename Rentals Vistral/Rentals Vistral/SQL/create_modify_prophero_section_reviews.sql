-- Migration: Create/Modify prophero_section_reviews field structure
-- Date: 2026-02-03
-- Description: Creates or modifies the prophero_section_reviews JSONB column
--              with the specified structure for Prophero phase section reviews

-- Add the column if it doesn't exist
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS prophero_section_reviews JSONB DEFAULT NULL;

-- Update the comment to document the field structure
COMMENT ON COLUMN properties.prophero_section_reviews IS 
'Stores review state for Prophero phase sections. Structure: {
  "_meta": {
    "commentsSubmitted": boolean,  // Flag: true when comments were submitted
    "commentsSubmittedAt": string,  // ISO timestamp of when comments were first submitted
    "commentSubmissionHistory": [  // Complete history of all comment submissions
      {
        "sectionId": string,  // ID of the section
        "sectionTitle": string,  // Title of the section for reference
        "comments": string,  // Comments submitted
        "submittedAt": string,  // ISO timestamp of when submitted
        "fieldValues": object  // Snapshot of field values at submission time
      }
    ]
  },
  "section-id": {
    "reviewed": boolean,  // Whether the section has been reviewed
    "isCorrect": boolean | null,  // true = Sí, false = No, null = Pendiente
    "comments": string | null,  // Editable comments for the section
    "submittedComments": string | null,  // Snapshot of submitted comments (read-only after submission)
    "snapshot": object | null,  // Field values snapshot when marked as "No"
    "hasIssue": boolean  // Historical flag: true when isCorrect === false, never reverts to false
  }
}

Field descriptions:
- _meta.commentsSubmitted: Global flag indicating if comments were submitted at least once
- _meta.commentsSubmittedAt: ISO timestamp of when comments were first submitted
- _meta.commentSubmissionHistory: Array with complete history of all comment submissions
- section-id.reviewed: Boolean indicating if the section has been reviewed
- section-id.isCorrect: true = Sí, false = No, null = Pendiente
- section-id.comments: Editable comments (always exists, can be null)
- section-id.submittedComments: Snapshot of submitted comments (read-only after submission)
- section-id.snapshot: Values of section fields when isCorrect was set to false
- section-id.hasIssue: Historical flag that becomes true when isCorrect === false

Example structure:
{
  "_meta": {
    "commentsSubmitted": true,
    "commentsSubmittedAt": "2026-02-03T10:30:00Z",
    "commentSubmissionHistory": [
      {
        "sectionId": "property-management-info",
        "sectionTitle": "Información de Gestión",
        "comments": "Falta documentación adicional",
        "submittedAt": "2026-02-03T10:30:00Z",
        "fieldValues": { "field1": "value1", "field2": "value2" }
      }
    ]
  },
  "property-management-info": {
    "reviewed": true,
    "isCorrect": false,
    "comments": "Falta documentación adicional",
    "submittedComments": "Falta documentación adicional",
    "snapshot": { "field1": "value1", "field2": "value2" },
    "hasIssue": true
  },
  "technical-documents": {
    "reviewed": true,
    "isCorrect": true,
    "comments": null,
    "submittedComments": null,
    "snapshot": null,
    "hasIssue": false
  }
}';

-- Optional: Create an index on the JSONB column for better query performance
-- Uncomment if you need to query specific sections frequently
-- CREATE INDEX IF NOT EXISTS idx_prophero_section_reviews_gin 
-- ON properties USING GIN (prophero_section_reviews);

-- Optional: Create a function to validate the JSON structure
-- Uncomment if you want to add validation constraints
/*
CREATE OR REPLACE FUNCTION validate_prophero_section_reviews(data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if _meta exists and has required fields
  IF data ? '_meta' THEN
    IF NOT (data->'_meta' ? 'commentsSubmitted') THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Additional validation can be added here
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint if validation is needed
-- ALTER TABLE properties 
-- ADD CONSTRAINT prophero_section_reviews_valid 
-- CHECK (prophero_section_reviews IS NULL OR validate_prophero_section_reviews(prophero_section_reviews));
*/

-- Verify the column was created/modified
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'prophero_section_reviews';

-- Show the comment
SELECT 
  col_description('properties'::regclass, 
    (SELECT ordinal_position 
     FROM information_schema.columns 
     WHERE table_name = 'properties' 
     AND column_name = 'prophero_section_reviews')
  ) AS column_comment;
