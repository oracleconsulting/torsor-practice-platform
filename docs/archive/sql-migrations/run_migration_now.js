/**
 * EMERGENCY MIGRATION RUNNER
 * Applies the SIMPLE_FIX_NO_CONSTRAINTS.sql migration to production
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Need: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
console.log('   URL:', supabaseUrl);
console.log('   Key:', supabaseServiceKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the migration file
const migrationPath = join(__dirname, 'SIMPLE_FIX_NO_CONSTRAINTS.sql');
console.log('📄 Reading migration from:', migrationPath);
const sql = readFileSync(migrationPath, 'utf8');

console.log('🚀 Executing migration...\n');

// Split SQL into individual statements (very basic splitting)
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && s.length > 10);

console.log(`Found ${statements.length} SQL statements to execute\n`);

// Execute each statement
for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  if (!stmt) continue;
  
  console.log(`\n[${i + 1}/${statements.length}] Executing:`);
  console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
    
    if (error) {
      // Try direct query if RPC doesn't work
      const { error: directError } = await supabase.from('_migrations').select('*').limit(0);
      
      if (directError) {
        console.error('❌ Error:', error.message || error);
        console.error('   This might be a permissions issue. You may need to run this migration in the Supabase SQL Editor.');
      } else {
        console.log('⚠️  Warning:', error.message || error);
      }
    } else {
      console.log('✅ Success');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

console.log('\n\n🎉 Migration script completed!');
console.log('\n📋 NEXT STEPS:');
console.log('1. If you saw errors above, copy SIMPLE_FIX_NO_CONSTRAINTS.sql');
console.log('2. Go to https://supabase.com/dashboard/project/nwmzegonnmqzflamcxfd/sql');
console.log('3. Paste the SQL and click "Run"');
console.log('4. Redeploy your app on Railway');
console.log('5. Hard refresh browser (Cmd+Shift+R)');

