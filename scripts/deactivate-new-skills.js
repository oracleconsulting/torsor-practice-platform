import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mvdejlkiqslwrbarwxkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5ODQ0MSwiZXhwIjoyMDc5NDc0NDQxfQ.VlXOJcHM87VPENwBP8XA2C-oYx-zyBXrx3DXL4OBHS8'
);

const skillsToDeactivate = [
  'Business Development',
  'Project Management',
  'Regulatory Compliance',
  'Risk Management',
  'Leadership & Mentoring',
  'Client Relationship Management',
  'Communication & Presentation',
  'Problem Solving',
  'Financial Modelling & Forecasting',
  'Strategic Financial Planning',
  'Tax Planning & Advisory',
  'Management Accounting'
];

async function deactivate() {
  console.log('=== DEACTIVATING 12 NEW SKILLS ===\n');
  
  const { data, error } = await supabase
    .from('skills')
    .update({ is_active: false })
    .in('name', skillsToDeactivate)
    .select();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`✅ Deactivated ${data.length} skills:\n`);
  data.forEach(s => console.log(`  - ${s.name} (${s.category})`));
  
  // Check new active skill count
  const { count } = await supabase
    .from('skills')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  console.log(`\n✅ Active skills now: ${count} (was 123)`);
  console.log(`\nThis will improve your heatmap and service readiness calculations!`);
}

deactivate().catch(console.error);
