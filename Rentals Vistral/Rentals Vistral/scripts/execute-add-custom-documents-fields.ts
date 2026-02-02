/**
 * Script to execute ADD_CUSTOM_DOCUMENTS_FIELDS.sql
 * Run with: npx tsx scripts/execute-add-custom-documents-fields.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function executeSQL() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Read SQL file
  const sqlPath = path.join(process.cwd(), 'SQL', 'ADD_CUSTOM_DOCUMENTS_FIELDS.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('📝 Executing SQL script...\n');
  console.log('SQL Content:');
  console.log('─'.repeat(50));
  console.log(sql);
  console.log('─'.repeat(50));
  console.log('');

  try {
    // Supabase JS client doesn't support direct SQL execution
    // We need to use the REST API or execute via SQL Editor
    // For now, we'll use the REST API with a custom RPC function if available
    
    // Try to execute via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SQL executed successfully!');
      console.log('Result:', data);
      return;
    }

    // If RPC doesn't exist, we need to execute manually
    throw new Error('RPC function not available');
  } catch (error: any) {
    console.log('⚠️  Cannot execute SQL directly via API');
    console.log('\n📋 Please execute the SQL manually:');
    console.log('\n1. Go to Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the SQL above');
    console.log('5. Click "Run"\n');
    
    // Also try to execute each statement individually using the client
    console.log('🔄 Attempting alternative method...\n');
    
    try {
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          // Note: Supabase JS client doesn't support ALTER TABLE directly
          // This will likely fail, but we try anyway
          try {
            // For ALTER TABLE, we can't use the JS client
            // We need to use the management API or SQL editor
            console.log('   ⚠️  ALTER TABLE statements must be executed in SQL Editor');
          } catch (err) {
            console.log(`   ❌ Failed: ${err}`);
          }
        }
      }
    } catch (err) {
      console.error('Alternative method also failed');
    }
  }
}

executeSQL();
