-- Migration: Migrate existing prophero_section_reviews data to new structure
-- Date: 2026-02-03
-- Description: Updates existing JSONB data to ensure it follows the new structure
--              with _meta and proper section structure

-- Function to migrate existing data to new structure
CREATE OR REPLACE FUNCTION migrate_prophero_section_reviews(old_data JSONB)
RETURNS JSONB AS $$
DECLARE
  new_data JSONB;
  section_key TEXT;
  section_data JSONB;
BEGIN
  -- If data is null, return null
  IF old_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Initialize new_data with _meta if it doesn't exist
  new_data := old_data;
  
  -- Ensure _meta exists with default values
  IF NOT (new_data ? '_meta') THEN
    new_data := jsonb_set(
      new_data,
      '{_meta}',
      jsonb_build_object(
        'commentsSubmitted', COALESCE((old_data->'_meta'->>'commentsSubmitted')::boolean, false),
        'commentsSubmittedAt', COALESCE(old_data->'_meta'->>'commentsSubmittedAt', NULL),
        'commentSubmissionHistory', COALESCE(old_data->'_meta'->'commentSubmissionHistory', '[]'::jsonb)
      )
    );
  ELSE
    -- Ensure _meta has all required fields
    IF NOT (new_data->'_meta' ? 'commentsSubmitted') THEN
      new_data := jsonb_set(
        new_data,
        '{_meta,commentsSubmitted}',
        to_jsonb(false)
      );
    END IF;
    
    IF NOT (new_data->'_meta' ? 'commentsSubmittedAt') THEN
      new_data := jsonb_set(
        new_data,
        '{_meta,commentsSubmittedAt}',
        'null'::jsonb
      );
    END IF;
    
    IF NOT (new_data->'_meta' ? 'commentSubmissionHistory') THEN
      new_data := jsonb_set(
        new_data,
        '{_meta,commentSubmissionHistory}',
        '[]'::jsonb
      );
    END IF;
  END IF;
  
  -- Migrate each section (skip _meta)
  FOR section_key IN SELECT jsonb_object_keys(new_data) LOOP
    IF section_key != '_meta' THEN
      section_data := new_data->section_key;
      
      -- Ensure section has all required fields
      IF NOT (section_data ? 'reviewed') THEN
        section_data := jsonb_set(
          section_data,
          '{reviewed}',
          to_jsonb(COALESCE((section_data->>'reviewed')::boolean, false))
        );
      END IF;
      
      IF NOT (section_data ? 'isCorrect') THEN
        section_data := jsonb_set(
          section_data,
          '{isCorrect}',
          CASE 
            WHEN section_data->>'isCorrect' IS NOT NULL 
            THEN to_jsonb((section_data->>'isCorrect')::boolean)
            ELSE 'null'::jsonb
          END
        );
      END IF;
      
      IF NOT (section_data ? 'comments') THEN
        section_data := jsonb_set(
          section_data,
          '{comments}',
          CASE 
            WHEN section_data->>'comments' IS NOT NULL 
            THEN to_jsonb(section_data->>'comments')
            ELSE 'null'::jsonb
          END
        );
      END IF;
      
      IF NOT (section_data ? 'submittedComments') THEN
        section_data := jsonb_set(
          section_data,
          '{submittedComments}',
          CASE 
            WHEN section_data->>'submittedComments' IS NOT NULL 
            THEN to_jsonb(section_data->>'submittedComments')
            ELSE 'null'::jsonb
          END
        );
      END IF;
      
      IF NOT (section_data ? 'snapshot') THEN
        section_data := jsonb_set(
          section_data,
          '{snapshot}',
          CASE 
            WHEN section_data->'snapshot' IS NOT NULL 
            THEN section_data->'snapshot'
            ELSE 'null'::jsonb
          END
        );
      END IF;
      
      -- Set hasIssue based on isCorrect
      IF NOT (section_data ? 'hasIssue') THEN
        section_data := jsonb_set(
          section_data,
          '{hasIssue}',
          to_jsonb(COALESCE((section_data->>'isCorrect')::boolean = false, false))
        );
      END IF;
      
      -- Update the section in new_data
      new_data := jsonb_set(new_data, ARRAY[section_key], section_data);
    END IF;
  END LOOP;
  
  RETURN new_data;
END;
$$ LANGUAGE plpgsql;

-- Migrate existing data
-- WARNING: Review this UPDATE statement before running in production
-- Consider backing up your data first
/*
UPDATE properties
SET prophero_section_reviews = migrate_prophero_section_reviews(prophero_section_reviews)
WHERE prophero_section_reviews IS NOT NULL;
*/

-- Clean up the function after migration (optional)
-- DROP FUNCTION IF EXISTS migrate_prophero_section_reviews(JSONB);

-- Verify migration results (run after UPDATE)
/*
SELECT 
  id,
  prophero_section_reviews->'_meta' AS meta,
  jsonb_object_keys(prophero_section_reviews) AS section_keys
FROM properties
WHERE prophero_section_reviews IS NOT NULL
LIMIT 10;
*/
