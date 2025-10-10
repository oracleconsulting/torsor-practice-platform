#!/usr/bin/env node
/**
 * Supabase Direct Query Tool
 * 
 * Allows Cursor AI to execute SQL queries directly on Supabase.
 * 
 * Usage:
 *   node supabase-query.js "SELECT * FROM practice_members"
 *   node supabase-query.js --file DELETE_DUPLICATE_SAFE.sql
 */

require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Missing Supabase credentials');
  console.error('');
  console.error('Please create .env.supabase with:');
  console.error('  SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('');
  console.error('See CURSOR_SUPABASE_ACCESS_SETUP.md for details.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeQuery(sql) {
  console.log('🔍 Executing SQL query...\n');
  
  try {
    // Use Supabase's REST API to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      // If exec_sql doesn't exist, try direct table operations
      throw error;
    }
    
    console.log('✅ Query executed successfully!\n');
    console.log('📊 Results:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('\nThis tool requires the exec_sql PostgreSQL function.');
    console.error('Run this SQL in Supabase to enable it:\n');
    console.error(`
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE query;
  GET DIAGNOSTICS result = ROW_COUNT;
  RETURN jsonb_build_object('rows_affected', result);
END;
$$;
    `);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage:');
    console.error('  node supabase-query.js "SELECT * FROM table"');
    console.error('  node supabase-query.js --file query.sql');
    process.exit(1);
  }
  
  let sql;
  
  if (args[0] === '--file') {
    const filename = args[1];
    if (!filename) {
      console.error('❌ Please specify a file: --file query.sql');
      process.exit(1);
    }
    
    if (!fs.existsSync(filename)) {
      console.error(`❌ File not found: ${filename}`);
      process.exit(1);
    }
    
    sql = fs.readFileSync(filename, 'utf8');
    console.log(`📄 Reading SQL from: ${filename}\n`);
  } else {
    sql = args.join(' ');
  }
  
  await executeQuery(sql);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

