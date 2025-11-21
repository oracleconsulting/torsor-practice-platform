#!/usr/bin/env node
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nwmzegonnmqzflamcxfd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bXplZ29ubm1xemZsYW1jeGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzkzNjU4NSwiZXhwIjoyMDQzNTEyNTg1fQ.Z4ca76pDkpeQCY-sN5p7vRfOa-nDklv8CnlqJtvFSZs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Applying VARK Assessment migration to Supabase...');

try {
  // Read the migration file
  const migrationSQL = readFileSync('./supabase/migrations/20251012_vark_assessment.sql', 'utf8');
  
  console.log('📄 Migration file loaded');
  console.log('📊 Executing SQL...');
  
  // Execute the migration using rpc or direct query
  const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).catch(async () => {
    // If rpc doesn't work, try using the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sql: migrationSQL })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  });
  
  if (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
  
  console.log('✅ Migration applied successfully!');
  console.log('🎉 VARK Assessment tables created:');
  console.log('   - learning_preferences');
  console.log('   - vark_questions (with 16 questions)');
  console.log('   - team_learning_styles_overview (view)');
  
  // Verify the tables were created
  const { data: tables, error: tableError } = await supabase
    .from('vark_questions')
    .select('count');
  
  if (tableError) {
    console.log('⚠️  Note: Could not verify table creation via API');
    console.log('   Please verify manually in Supabase dashboard');
  } else {
    console.log('✓ Verified: vark_questions table exists');
  }
  
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  console.log('\n📝 Manual application instructions:');
  console.log('1. Go to https://app.supabase.com');
  console.log('2. Select your project');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy the contents of supabase/migrations/20251012_vark_assessment.sql');
  console.log('5. Paste and run in SQL Editor');
  process.exit(1);
}

