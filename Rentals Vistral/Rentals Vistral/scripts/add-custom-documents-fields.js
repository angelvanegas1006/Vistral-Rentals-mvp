/**
 * Script to add custom documents JSONB fields to properties table
 * Run with: node scripts/add-custom-documents-fields.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function addCustomDocumentsFields() {
  console.log('Adding custom documents fields to properties table...\n');

  const sql = `
    -- Add custom documents JSONB fields to properties table
    ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS custom_legal_documents JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS custom_insurance_documents JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS custom_supplies_documents JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS custom_investor_documents JSONB DEFAULT '[]'::jsonb;

    -- Add comments to document the structure
    COMMENT ON COLUMN properties.custom_legal_documents IS 'Array of custom legal documents: [{title: string, url: string, createdAt: string}]';
    COMMENT ON COLUMN properties.custom_insurance_documents IS 'Array of custom insurance documents: [{title: string, url: string, createdAt: string}]';
    COMMENT ON COLUMN properties.custom_supplies_documents IS 'Array of custom supplies documents: [{title: string, url: string, createdAt: string}]';
    COMMENT ON COLUMN properties.custom_investor_documents IS 'Array of custom investor documents: [{title: string, url: string, createdAt: string}]';
  `;

  try {
    // Execute SQL using Supabase RPC or direct query
    // Note: Supabase JS client doesn't support direct SQL execution
    // We need to use the REST API or create a function
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If RPC doesn't exist, try using the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql_query: sql }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return { data: await response.json(), error: null };
    });

    if (error) {
      throw error;
    }

    console.log('✅ Successfully added custom documents fields!');
    console.log('\nFields added:');
    console.log('  - custom_legal_documents');
    console.log('  - custom_insurance_documents');
    console.log('  - custom_supplies_documents');
    console.log('  - custom_investor_documents');
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    console.error('\nNote: Supabase JS client doesn\'t support direct SQL execution.');
    console.error('Please execute the SQL script manually in Supabase Dashboard:');
    console.error('\n1. Go to Supabase Dashboard > SQL Editor');
    console.error('2. Copy and paste the contents of SQL/ADD_CUSTOM_DOCUMENTS_FIELDS.sql');
    console.error('3. Click "Run"');
    process.exit(1);
  }
}

addCustomDocumentsFields();
