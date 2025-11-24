import { createClient } from '@supabase/supabase-js';

const oldSupabase = createClient(
  'https://nwmzegonnmqzflamcxfd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bXplZ29ubm1xemZsYW1jeGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzUxOTM2NiwiZXhwIjoyMDYzMDk1MzY2fQ.-_76IaJIyQ4adMujFxweDO9GnDOJj7TGcb5gyxTQygM'
);

const newSupabase = createClient(
  'https://mvdejlkiqslwrbarwxkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5ODQ0MSwiZXhwIjoyMDc5NDc0NDQxfQ.VlXOJcHM87VPENwBP8XA2C-oYx-zyBXrx3DXL4OBHS8'
);

async function compare() {
  console.log('=== COMPARING OLD vs NEW ===\n');
  
  // Check OLD database
  const { data: oldSkills, count: oldSkillsCount } = await oldSupabase
    .from('skills')
    .select('*', { count: 'exact', head: true });
  
  const { data: oldAssessments } = await oldSupabase
    .from('skill_assessments')
    .select('id');
  
  console.log(`OLD Database:`);
  console.log(`  Skills: ${oldSkillsCount}`);
  console.log(`  Skill Assessments: ${oldAssessments?.length || 0}`);
  
  // Check NEW database
  const { data: newSkills, count: newSkillsCount } = await newSupabase
    .from('skills')
    .select('*', { count: 'exact', head: true });
  
  const { data: newAssessments } = await newSupabase
    .from('skill_assessments')
    .select('id');
  
  console.log(`\nNEW Database:`);
  console.log(`  Skills: ${newSkillsCount}`);
  console.log(`  Skill Assessments: ${newAssessments?.length || 0}`);
  
  console.log(`\n=== DIFFERENCE ===`);
  console.log(`  Missing Skills: ${oldSkillsCount - newSkillsCount}`);
  console.log(`  Missing Assessments: ${oldAssessments.length - newAssessments.length}`);
  
  // Check if there are assessments in invitations we haven't migrated
  const { data: oldInvitations } = await oldSupabase
    .from('invitations')
    .select('email, assessment_data')
    .not('assessment_data', 'is', null);
  
  let invitationAssessmentCount = 0;
  oldInvitations?.forEach(inv => {
    if (inv.assessment_data && Array.isArray(inv.assessment_data)) {
      invitationAssessmentCount += inv.assessment_data.length;
    }
  });
  
  console.log(`\nInvitations table assessments: ${invitationAssessmentCount}`);
  console.log(`Total in OLD (skill_assessments + invitations): ${oldAssessments.length + invitationAssessmentCount}`);
}

compare().catch(console.error);
