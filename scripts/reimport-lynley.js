import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mvdejlkiqslwrbarwxkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5ODQ0MSwiZXhwIjoyMDc5NDc0NDQxfQ.VlXOJcHM87VPENwBP8XA2C-oYx-zyBXrx3DXL4OBHS8'
);

// Invitations data from the file
const invitationsData = [
  {
    email: 'LAllagapen@rpgcc.co.uk',
    name: 'Lynley Allagapen',
    assessment_data: '[{"skill_id":"6fb7e5b4-e84e-46af-8e43-a6358258644a","current_level":1,"interest_level":2},{"skill_id":"cfae6f47-a39f-424c-81b8-8bbf2e0a1f30","current_level":1,"interest_level":2},...'
  },
  {
    email: 'jameshowardivc@gmail.com',
    name: 'Jimmy Test', 
    assessment_data: '[{"skill_id":"6fb7e5b4-e84e-46af-8e43-a6358258644a","current_level":1,"interest_level":2},...'
  }
];

async function reimportFromInvitations() {
  console.log('🔄 Re-importing Lynley and Jimmy Test assessments from invitations data...\n');

  // First, check current state
  const { data: lynley } = await supabase
    .from('practice_members')
    .select('id, full_name, email')
    .or('email.ilike.%allagapen%,full_name.ilike.%lynley%')
    .single();

  if (!lynley) {
    console.log('❌ Lynley not found in practice_members');
    return;
  }

  console.log(`Found Lynley: ${lynley.full_name} (${lynley.id})`);

  // Check current assessment count
  const { data: currentAssessments, count } = await supabase
    .from('skill_assessments')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', lynley.id);

  console.log(`Lynley currently has ${count || 0} skill assessments\n`);

  // Get the invitation data directly from DB
  const { data: invitation } = await supabase
    .from('invitations')
    .select('assessment_data, email')
    .ilike('email', '%allagapen%')
    .single();

  if (!invitation || !invitation.assessment_data) {
    console.log('❌ No invitation data found for Lynley');
    return;
  }

  console.log(`Found ${invitation.assessment_data.length} skills in invitations.assessment_data`);

  // Delete existing assessments for Lynley
  const { error: deleteError } = await supabase
    .from('skill_assessments')
    .delete()
    .eq('member_id', lynley.id);

  if (deleteError) {
    console.log('⚠️  Error deleting old assessments:', deleteError.message);
  } else {
    console.log('✅ Deleted old assessments');
  }

  // Re-import from assessment_data
  const assessmentsToImport = invitation.assessment_data.map(skill => ({
    member_id: lynley.id,
    skill_id: skill.skill_id,
    current_level: skill.current_level,
    interest_level: skill.interest_level,
    assessment_type: 'self-assessment',
    created_at: new Date().toISOString()
  }));

  console.log(`\n📥 Importing ${assessmentsToImport.length} assessments...`);

  // Import in batches
  const batchSize = 100;
  let imported = 0;

  for (let i = 0; i < assessmentsToImport.length; i += batchSize) {
    const batch = assessmentsToImport.slice(i, i + batchSize);
    
    const { error: insertError } = await supabase
      .from('skill_assessments')
      .insert(batch);

    if (insertError) {
      console.log(`❌ Batch ${Math.floor(i / batchSize) + 1} error:`, insertError.message);
    } else {
      imported += batch.length;
      console.log(`✅ Imported batch ${Math.floor(i / batchSize) + 1}: ${imported}/${assessmentsToImport.length}`);
    }
  }

  // Verify
  const { count: finalCount } = await supabase
    .from('skill_assessments')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', lynley.id);

  console.log(`\n✅ COMPLETE: Lynley now has ${finalCount} assessments`);
}

reimportFromInvitations().catch(console.error);

