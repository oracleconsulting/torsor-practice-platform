import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mvdejlkiqslwrbarwxkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTg0NDEsImV4cCI6MjA3OTQ3NDQ0MX0.NaiSmZOPExJiBBksL4R1swW4jrJg9JtNK8ktB17rXiM'
);

async function checkData() {
  console.log('=== CHECKING DATABASE ===\n');
  
  // Check skills
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('id, name, category')
    .eq('is_active', true)
    .order('category, name');
  
  if (skillsError) {
    console.error('Skills error:', skillsError);
    return;
  }
  
  console.log(`Total skills in database: ${skills.length}\n`);
  console.log('Skills by category:');
  const byCategory = {};
  skills.forEach(s => {
    if (!byCategory[s.category]) byCategory[s.category] = [];
    byCategory[s.category].push(s.name);
  });
  
  Object.entries(byCategory).forEach(([cat, names]) => {
    console.log(`\n${cat} (${names.length}):`);
    names.forEach(n => console.log(`  - ${n}`));
  });
  
  // Check team members
  const { data: members } = await supabase
    .from('practice_members')
    .select('id, name, role');
  
  console.log(`\n\nTotal team members: ${members?.length || 0}`);
  
  // Check skill assessments
  const { data: assessments } = await supabase
    .from('skill_assessments')
    .select('id, member_id, skill_id, current_level');
  
  console.log(`Total skill assessments: ${assessments?.length || 0}\n`);
  
  // Show sample assessment with skill name
  if (assessments?.length > 0) {
    const sample = assessments[0];
    const skill = skills.find(s => s.id === sample.skill_id);
    console.log('Sample assessment:');
    console.log(`  Member ID: ${sample.member_id}`);
    console.log(`  Skill: ${skill?.name || 'Unknown'}`);
    console.log(`  Level: ${sample.current_level}`);
  }
}

checkData();

