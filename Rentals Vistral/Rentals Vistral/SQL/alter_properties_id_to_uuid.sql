-- Alter properties.id from varchar to UUID
-- Run this if the table was created with varchar id
-- If id is already UUID, this script does nothing.

BEGIN;

DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'id';

  IF col_type IS NULL THEN
    RAISE NOTICE 'Table properties or column id does not exist.';
    RETURN;
  END IF;

  IF col_type IN ('character varying', 'varchar', 'text', 'bpchar') THEN
    -- 1. Add UUID column to properties
    ALTER TABLE properties ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();
    ALTER TABLE properties ALTER COLUMN id_uuid SET NOT NULL;

    -- 2. Update property_inspections if it exists (preserve FK relationship)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_inspections') THEN
      ALTER TABLE property_inspections ADD COLUMN IF NOT EXISTS property_id_uuid UUID;
      UPDATE property_inspections pi SET property_id_uuid = p.id_uuid
        FROM properties p WHERE p.id = pi.property_id;
      DELETE FROM property_inspections WHERE property_id_uuid IS NULL;
      ALTER TABLE property_inspections DROP CONSTRAINT IF EXISTS property_inspections_property_id_fkey;
      ALTER TABLE property_inspections DROP COLUMN property_id;
      ALTER TABLE property_inspections RENAME COLUMN property_id_uuid TO property_id;
      ALTER TABLE property_inspections ALTER COLUMN property_id SET NOT NULL;
    END IF;

    -- 3. Drop primary key (CASCADE drops any remaining dependent FKs)
    ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_pkey CASCADE;
    ALTER TABLE properties DROP COLUMN id;

    -- 4. Rename id_uuid to id and re-add primary key
    ALTER TABLE properties RENAME COLUMN id_uuid TO id;
    ALTER TABLE properties ADD PRIMARY KEY (id);

    -- 5. Re-add FK from property_inspections if it was updated
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_inspections') THEN
      ALTER TABLE property_inspections ADD CONSTRAINT property_inspections_property_id_fkey
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
    END IF;

    RAISE NOTICE 'properties.id migrated from % to UUID', col_type;
  ELSE
    RAISE NOTICE 'properties.id is already % - no migration needed', col_type;
  END IF;
END $$;

COMMIT;
