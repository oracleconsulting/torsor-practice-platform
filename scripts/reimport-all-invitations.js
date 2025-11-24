import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mvdejlkiqslwrbarwxkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5ODQ0MSwiZXhwIjoyMDc5NDc0NDQxfQ.VlXOJcHM87VPENwBP8XA2C-oYx-zyBXrx3DXL4OBHS8'
);

async function reimportAllFromInvitations() {
  console.log('🔄 Re-importing ALL skill assessments from invitations.assessment_data...\n');

  // Get all invitations with assessment data
  const { data: invitations, error: invError } = await supabase
    .from('invitations')
    .select('id, email, name, assessment_data')
    .eq('status', 'accepted')
    .not('assessment_data', 'is', null);

  if (invError) {
    console.log('❌ Error fetching invitations:', invError);
    return;
  }

  console.log(`Found ${invitations.length} accepted invitations with assessment data\n`);

  // Get all practice members to map emails
  const { data: members, error: membersError } = await supabase
    .from('practice_members')
    .select('id, email');

  if (membersError) {
    console.log('❌ Error fetching members:', membersError);
    return;
  }

  // Create email to member_id map (case insensitive)
  const emailMap = new Map();
  members.forEach(m => {
    emailMap.set(m.email.toLowerCase(), m.id);
  });

  console.log(`Found ${members.length} practice members\n`);

  let totalImported = 0;
  let totalSkipped = 0;

  // Process each invitation
  for (const invitation of invitations) {
    const memberEmail = invitation.email.toLowerCase();
    const memberId = emailMap.get(memberEmail);

    if (!memberId) {
      console.log(`⚠️  No member found for ${invitation.email}`);
      totalSkipped++;
      continue;
    }

    if (!invitation.assessment_data || invitation.assessment_data.length === 0) {
      console.log(`⚠️  No assessment data for ${invitation.name}`);
      totalSkipped++;
      continue;
    }

    console.log(`Processing ${invitation.name} (${invitation.email})...`);
    console.log(`  Found ${invitation.assessment_data.length} skills in assessment_data`);

    // Delete existing assessments for this member
    const { error: deleteError } = await supabase
      .from('skill_assessments')
      .delete()
      .eq('member_id', memberId);

    if (deleteError) {
      console.log(`  ❌ Error deleting old assessments: ${deleteError.message}`);
      continue;
    }

    // Transform and import
    const assessmentsToImport = invitation.assessment_data.map(skill => ({
      member_id: memberId,
      skill_id: skill.skill_id,
      current_level: skill.current_level,
      interest_level: skill.interest_level,
      notes: skill.notes || null,
      assessment_type: 'self-assessment',
      created_at: new Date().toISOString()
    }));

    // Import in batches
    const batchSize = 50;
    let imported = 0;

    for (let i = 0; i < assessmentsToImport.length; i += batchSize) {
      const batch = assessmentsToImport.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('skill_assessments')
        .insert(batch);

      if (insertError) {
        console.log(`  ❌ Batch error: ${insertError.message}`);
        break;
      } else {
        imported += batch.length;
      }
    }

    console.log(`  ✅ Imported ${imported} skills\n`);
    totalImported += imported;
  }

  console.log(`\n✅ COMPLETE:`);
  console.log(`   - Total imported: ${totalImported} assessments`);
  console.log(`   - Skipped: ${totalSkipped}`);
}

reimportAllFromInvitations().catch(console.error);

