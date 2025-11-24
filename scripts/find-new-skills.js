import { createClient } from '@supabase/supabase-js';

const oldSupabase = createClient(
  'https://nwmzegonnmqzflamcxfd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bXplZ29ubm1xemZsYW1jeGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzUxOTM2NiwiZXhwIjoyMDYzMDk1MzY2fQ.-_76IaJIyQ4adMujFxweDO9GnDOJj7TGcb5gyxTQygM'
);

const newSupabase = createClient(
  'https://mvdejlkiqslwrbarwxkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5ODQ0MSwiZXhwIjoyMDc5NDc0NDQxfQ.VlXOJcHM87VPENwBP8XA2C-oYx-zyBXrx3DXL4OBHS8'
);

async function findNewSkills() {
  // Get old skills
  const { data: oldSkills } = await oldSupabase
    .from('skills')
    .select('name')
    .eq('is_active', true);
  
  const oldSkillNames = new Set(oldSkills.map(s => s.name.toLowerCase().trim()));
  
  // Get new skills
  const { data: newSkills } = await newSupabase
    .from('skills')
    .select('id, name, category')
    .eq('is_active', true)
    .order('category', { ascending: true });
  
  // Find skills that exist in NEW but not in OLD
  const newOnlySkills = newSkills.filter(s => !oldSkillNames.has(s.name.toLowerCase().trim()));
  
  console.log(`=== SKILLS THAT ONLY EXIST IN NEW DATABASE (${newOnlySkills.length}) ===\n`);
  
  let currentCategory = '';
  for (const skill of newOnlySkills) {
    if (skill.category !== currentCategory) {
      currentCategory = skill.category;
      console.log(`\n${currentCategory}:`);
    }
    console.log(`  - ${skill.name}`);
  }
  
  console.log(`\n=== RECOMMENDATION ===`);
  console.log(`These ${newOnlySkills.length} skills were added to the new schema but don't exist in your historical data.`);
  console.log(`\nOptions:`);
  console.log(`1. Mark these skills as inactive (they won't show in heatmaps)`);
  console.log(`2. Keep them and accept 0% coverage until team completes assessments`);
  console.log(`3. Remove them entirely from the database`);
}

findNewSkills().catch(console.error);
