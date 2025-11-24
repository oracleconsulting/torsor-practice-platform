import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mvdejlkiqslwrbarwxkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5ODQ0MSwiZXhwIjoyMDc5NDc0NDQxfQ.VlXOJcHM87VPENwBP8XA2C-oYx-zyBXrx3DXL4OBHS8'
);

async function listSkills() {
  const { data } = await supabase
    .from('skills')
    .select('name, category')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  
  console.log('=== ALL 111 ACTIVE SKILLS ===\n');
  
  let currentCategory = '';
  data.forEach(skill => {
    if (skill.category !== currentCategory) {
      currentCategory = skill.category;
      console.log(`\n${currentCategory}:`);
    }
    console.log(`  "${skill.name}",`);
  });
}

listSkills().catch(console.error);
