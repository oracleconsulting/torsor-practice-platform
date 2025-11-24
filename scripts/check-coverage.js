import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mvdejlkiqslwrbarwxkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5ODQ0MSwiZXhwIjoyMDc5NDc0NDQxfQ.VlXOJcHM87VPENwBP8XA2C-oYx-zyBXrx3DXL4OBHS8'
);

async function diagnostics() {
  console.log('🔍 Database Diagnostics\n');

  // Check active skills
  const { data: skills, count: skillCount } = await supabase
    .from('skills')
    .select('id, name', { count: 'exact' })
    .eq('is_active', true);

  console.log(`✅ Active Skills: ${skillCount}`);

  // Check total assessments
  const { count: totalAssessments } = await supabase
    .from('skill_assessments')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Total Skill Assessments: ${totalAssessments}\n`);

  // Check per member
  const { data: members } = await supabase
    .from('practice_members')
    .select('id, name')
    .order('name');

  console.log(`Team Member Assessment Coverage:`);
  console.log(`────────────────────────────────────────`);

  let perfectCount = 0;
  for (const member of members) {
    const { count } = await supabase
      .from('skill_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', member.id);
    
    const percentage = Math.round((count / skillCount) * 100);
    const status = count === skillCount ? '✅' : count > 90 ? '🟡' : '🔴';
    
    console.log(`${status} ${member.name.padEnd(25)} ${count}/${skillCount} (${percentage}%)`);
    
    if (count === skillCount) perfectCount++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - ${perfectCount}/${members.length} members at 100%`);
  console.log(`   - Expected: ${members.length * skillCount} assessments`);
  console.log(`   - Actual: ${totalAssessments} assessments`);
  console.log(`   - Missing: ${(members.length * skillCount) - totalAssessments} assessments`);
}

diagnostics().catch(console.error);

