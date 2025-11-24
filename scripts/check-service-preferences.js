import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mvdejlkiqslwrbarwxkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTg0NDEsImV4cCI6MjA3OTQ3NDQ0MX0.NaiSmZOPExJiBBksL4R1swW4jrJg9JtNK8ktB17rXiM'
);

async function checkPreferences() {
  console.log('=== CHECKING SERVICE LINE PREFERENCES ===\n');
  
  // Check service_line_interests table
  const { data: interests, error } = await supabase
    .from('service_line_interests')
    .select('*')
    .limit(5);
  
  if (error) {
    console.error('Error:', error.message);
    console.log('\nChecking if table exists...');
    
    // Try to check table existence
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%service%');
    
    console.log('Service-related tables:', tables);
  } else {
    console.log('Service line interests found:', interests?.length || 0);
    if (interests && interests.length > 0) {
      console.log('\nSample record:');
      console.log(JSON.stringify(interests[0], null, 2));
    }
  }
  
  // Check practice_members for service preferences
  const { data: members } = await supabase
    .from('practice_members')
    .select('id, name, service_line_preferences')
    .limit(5);
  
  console.log('\n\n=== CHECKING PRACTICE MEMBERS ===');
  console.log('Members with service preferences:', members?.length || 0);
  if (members && members.length > 0) {
    members.forEach(m => {
      console.log(`\n${m.name}:`);
      console.log(JSON.stringify(m.service_line_preferences, null, 2));
    });
  }
}

checkPreferences();
