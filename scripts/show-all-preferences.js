import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mvdejlkiqslwrbarwxkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTg0NDEsImV4cCI6MjA3OTQ3NDQ0MX0.NaiSmZOPExJiBBksL4R1swW4jrJg9JtNK8ktB17rXiM'
);

async function showAll() {
  const { data: interests } = await supabase
    .from('service_line_interests')
    .select(`
      *,
      member:practice_members(name, role)
    `);
  
  console.log(`Total service line interests: ${interests?.length || 0}\n`);
  
  // Group by service line
  const byService = {};
  interests?.forEach(i => {
    if (!byService[i.service_line]) byService[i.service_line] = [];
    byService[i.service_line].push({
      name: i.member?.name,
      role: i.member?.role,
      rank: i.interest_rank,
      experience: i.current_experience_level,
      involvement: i.desired_involvement_pct
    });
  });
  
  Object.entries(byService).forEach(([service, members]) => {
    console.log(`\n${service} (${members.length} interested):`);
    members.forEach(m => {
      console.log(`  - ${m.name} (${m.role}): Rank ${m.rank}, Experience Lvl ${m.experience}, Want ${m.involvement}% involvement`);
    });
  });
}

showAll();
