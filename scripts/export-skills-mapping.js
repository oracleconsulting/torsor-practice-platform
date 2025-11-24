import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function exportSkillsMapping() {
  const { data: skills, error } = await supabase
    .from('skills')
    .select('id, name, category')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching skills:', error);
    return;
  }

  console.log('| Skill ID | Skill Name | Category |');
  console.log('|----------|------------|----------|');
  
  skills.forEach(skill => {
    console.log(`| ${skill.id} | ${skill.name} | ${skill.category} |`);
  });
}

exportSkillsMapping();

