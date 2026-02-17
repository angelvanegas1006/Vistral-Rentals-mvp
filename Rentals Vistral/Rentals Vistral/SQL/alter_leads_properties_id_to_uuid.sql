-- Alter leads_properties.id from bigint (int8) to UUID
-- Run this if the table was created with int8/bigint id (e.g. via Supabase dashboard default)
-- If id is already UUID, this script does nothing.

BEGIN;

DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'leads_properties' AND column_name = 'id';

  IF col_type IS NULL THEN
    RAISE NOTICE 'Table leads_properties or column id does not exist. Run create_leads_properties_table.sql first.';
    RETURN;
  END IF;

  IF col_type IN ('bigint', 'integer', 'smallint') THEN
    -- Add UUID column (identity columns cannot be altered in place)
    ALTER TABLE leads_properties ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();
    ALTER TABLE leads_properties ALTER COLUMN id_uuid SET NOT NULL;

    -- Drop primary key and old identity column
    ALTER TABLE leads_properties DROP CONSTRAINT IF EXISTS leads_properties_pkey;
    ALTER TABLE leads_properties DROP COLUMN id;

    -- Rename id_uuid to id
    ALTER TABLE leads_properties RENAME COLUMN id_uuid TO id;

    -- Re-add primary key
    ALTER TABLE leads_properties ADD PRIMARY KEY (id);

    RAISE NOTICE 'leads_properties.id migrated from % to UUID', col_type;
  ELSE
    RAISE NOTICE 'leads_properties.id is already % - no migration needed', col_type;
  END IF;
END $$;

COMMIT;
