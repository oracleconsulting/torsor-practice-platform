import { createClient } from '@supabase/supabase-js';

const oldSupabase = createClient(
  'https://nwmzegonnmqzflamcxfd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bXplZ29ubm1xemZsYW1jeGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzUxOTM2NiwiZXhwIjoyMDYzMDk1MzY2fQ.-_76IaJIyQ4adMujFxweDO9GnDOJj7TGcb5gyxTQygM'
);

const newSupabase = createClient(
  'https://mvdejlkiqslwrbarwxkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5ODQ0MSwiZXhwIjoyMDc5NDc0NDQxfQ.VlXOJcHM87VPENwBP8XA2C-oYx-zyBXrx3DXL4OBHS8'
);

async function migrate() {
  console.log('=== FINDING JIMMY TEST DATA ===\n');
  
  // Find jimmy test member in old database
  const { data: oldMembers } = await oldSupabase
    .from('practice_members')
    .select('id, name, email')
    .or('name.ilike.%jimmy%,email.ilike.%jimmy%,name.ilike.%test%');
  
  console.log('Found members matching "jimmy" or "test":');
  oldMembers?.forEach(m => console.log(`  - ${m.name} (${m.email}) [${m.id}]`));
  
  if (!oldMembers || oldMembers.length === 0) {
    console.log('\nNo jimmy/test members found. Checking all members...');
    const { data: allMembers } = await oldSupabase
      .from('practice_members')
      .select('id, name, email')
      .limit(20);
    console.log('\nFirst 20 members:');
    allMembers?.forEach(m => console.log(`  - ${m.name} (${m.email})`));
    return;
  }
  
  const jimmyMemberId = oldMembers[0].id;
  console.log(`\nUsing member: ${oldMembers[0].name} [${jimmyMemberId}]`);
  
  // Get service line interests for jimmy test
  const { data: oldInterests } = await oldSupabase
    .from('service_line_interests')
    .select('*')
    .eq('practice_member_id', jimmyMemberId);
  
  console.log(`\nFound ${oldInterests?.length || 0} service line interests\n`);
  
  if (!oldInterests || oldInterests.length === 0) {
    console.log('No service line interests found for this member.');
    return;
  }
  
  oldInterests.forEach(i => {
    console.log(`  - ${i.service_line}: Rank ${i.interest_rank}, Experience ${i.current_experience_level}, ${i.desired_involvement_pct}% involvement`);
  });
  
  // Find James Howard in new database
  const { data: jamesData } = await newSupabase
    .from('practice_members')
    .select('id, name, email')
    .eq('email', 'jhoward@rpgcc.co.uk')
    .single();
  
  if (!jamesData) {
    console.log('\n❌ ERROR: Could not find jhoward@rpgcc.co.uk in new database');
    return;
  }
  
  console.log(`\n=== MIGRATING TO JAMES HOWARD ===`);
  console.log(`Target: ${jamesData.name} [${jamesData.id}]\n`);
  
  // Delete existing preferences for James
  const { error: deleteError } = await newSupabase
    .from('service_line_interests')
    .delete()
    .eq('practice_member_id', jamesData.id);
  
  if (deleteError) {
    console.log('Error deleting existing preferences:', deleteError.message);
  } else {
    console.log('✓ Cleared existing preferences');
  }
  
  // Insert new preferences
  const newPreferences = oldInterests.map(pref => ({
    practice_member_id: jamesData.id,
    service_line: pref.service_line,
    interest_rank: pref.interest_rank,
    current_experience_level: pref.current_experience_level,
    desired_involvement_pct: pref.desired_involvement_pct,
    notes: pref.notes
  }));
  
  const { data: inserted, error: insertError } = await newSupabase
    .from('service_line_interests')
    .insert(newPreferences)
    .select();
  
  if (insertError) {
    console.log('❌ Error inserting preferences:', insertError.message);
  } else {
    console.log(`✓ Migrated ${inserted.length} service line preferences\n`);
    console.log('Summary:');
    inserted.forEach(i => {
      console.log(`  ✓ ${i.service_line}: Rank ${i.interest_rank}, Exp ${i.current_experience_level}, ${i.desired_involvement_pct}% involvement`);
    });
  }
}

migrate().catch(console.error);
