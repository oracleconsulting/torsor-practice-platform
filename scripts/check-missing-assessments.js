import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mvdejlkiqslwrbarwxkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5ODQ0MSwiZXhwIjoyMDc5NDc0NDQxfQ.VlXOJcHM87VPENwBP8XA2C-oYx-zyBXrx3DXL4OBHS8'
);

async function checkAssessments() {
  console.log('=== CHECKING SKILL ASSESSMENT COVERAGE ===\n');
  
  // Get all active skills
  const { data: skills } = await supabase
    .from('skills')
    .select('id, name, category')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  
  console.log(`Total active skills: ${skills?.length}\n`);
  
  // Get all team members
  const { data: members } = await supabase
    .from('practice_members')
    .select('id, name, role')
    .order('name', { ascending: true });
  
  console.log(`Total team members: ${members?.length}\n`);
  
  // Get all skill assessments
  const { data: assessments } = await supabase
    .from('skill_assessments')
    .select('member_id, skill_id, current_level');
  
  console.log(`Total skill assessments: ${assessments?.length}\n`);
  
  // Calculate expected vs actual
  const expectedTotal = skills.length * members.length;
  const actualTotal = assessments.length;
  const coveragePercent = ((actualTotal / expectedTotal) * 100).toFixed(1);
  
  console.log(`Expected assessments (full coverage): ${expectedTotal}`);
  console.log(`Actual assessments: ${actualTotal}`);
  console.log(`Coverage: ${coveragePercent}%\n`);
  
  // Check per member
  console.log('=== PER MEMBER COVERAGE ===\n');
  for (const member of members) {
    const memberAssessments = assessments.filter(a => a.member_id === member.id);
    const coverage = ((memberAssessments.length / skills.length) * 100).toFixed(0);
    console.log(`${member.name.padEnd(25)} ${memberAssessments.length.toString().padStart(3)} / ${skills.length} skills (${coverage}%)`);
  }
  
  // Check which skills have low coverage
  console.log('\n=== SKILLS WITH LOW COVERAGE ===\n');
  const skillCoverage = skills.map(skill => {
    const count = assessments.filter(a => a.skill_id === skill.id).length;
    const percent = ((count / members.length) * 100).toFixed(0);
    return { name: skill.name, category: skill.category, count, percent };
  }).filter(s => s.count < members.length * 0.5); // Less than 50% of team
  
  skillCoverage.forEach(s => {
    console.log(`${s.name.padEnd(40)} ${s.count}/${members.length} members (${s.percent}%)`);
  });
}

checkAssessments().catch(console.error);
