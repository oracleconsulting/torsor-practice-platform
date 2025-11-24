import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mvdejlkiqslwrbarwxkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5ODQ0MSwiZXhwIjoyMDc5NDc0NDQxfQ.VlXOJcHM87VPENwBP8XA2C-oYx-zyBXrx3DXL4OBHS8'
);

async function checkData() {
  // List all members
  const { data: members, error: membersError } = await supabase
    .from('practice_members')
    .select('id, full_name, email')
    .order('full_name');

  if (membersError) {
    console.log('Error fetching members:', membersError);
  } else {
    console.log(`All practice members (${members?.length || 0}):`);
    members?.forEach(m => console.log(`- ${m.full_name} (${m.email})`));
  }

  // Check invitations
  const { data: invitations, error: invError } = await supabase
    .from('invitations')
    .select('email, name, status')
    .order('name');

  if (invError) {
    console.log('Error fetching invitations:', invError);
  } else {
    console.log(`\nAll invitations (${invitations?.length || 0}):`);
    invitations?.forEach(i => console.log(`- ${i.name} (${i.email}) - ${i.status}`));
  }
}

checkData().catch(console.error);

