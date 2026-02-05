-- Migration: Create prophero_section_reviews field with new structure
-- Date: 2026-02-03
-- Description: Creates JSONB field to store review state for Prophero phase sections
--              with new fields: submittedComments, snapshot, and _meta

-- Add the column if it doesn't exist
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS prophero_section_reviews JSONB DEFAULT NULL;

-- Add a comment to document the new field structure
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
    "reviewed": boolean,
    "isCorrect": boolean | null,  // true = Sí, false = No, null = no revisado/reseteado
    "comments": string | null,  // Editable comments (always exists)
    "submittedComments": string | null,  // Snapshot of submitted comments (read-only after submission)
    "snapshot": object | null,  // Field values when marked as "No"
    "hasIssue": boolean  // Historical flag: true when isCorrect === false, never reverts to false
  }
}

Fields explanation:
- comments: Always exists, editable when section is updated after comments were submitted
- submittedComments: Only exists after comments are submitted, preserves snapshot of sent comments
- snapshot: Values of section fields when isCorrect was set to false, used to detect changes
- _meta.commentsSubmitted: Global flag indicating if comments were submitted at least once
- _meta.commentsSubmittedAt: Timestamp of when comments were first submitted
- _meta.commentSubmissionHistory: Array with complete history of all comment submissions with section info

Lógica de Estados (Card Status):
1. Estado inicial: "Pendiente de revisión" (prophero_section_reviews es Null)
2. Mientras se responde por primera vez: "Pendiente de revisión"
3. Si todas las secciones están en "Sí": null (puede avanzar a siguiente fase)
4. Si hay algún "No" y se enviaron comentarios: "Pendiente de información"
5. Si se actualiza un campo de sección con "No": esa sección vuelve a blanco y card a "Pendiente de revisión"

Sections included:
- property-management-info
- technical-documents
- legal-documents
- client-financial-info
- supplies-contracts
- supplies-bills
- home-insurance
- property-management';

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'prophero_section_reviews';
