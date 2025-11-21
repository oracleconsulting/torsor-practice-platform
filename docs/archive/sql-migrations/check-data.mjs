import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Checking database for assessment data...\n');

// Check survey_sessions
const { data: sessions, error: sessionsError } = await supabase
  .from('survey_sessions')
  .select('*');

console.log('📋 Survey Sessions:', sessions?.length || 0);
if (sessions?.length > 0) {
  console.log('Sample:', JSON.stringify(sessions[0], null, 2));
}
if (sessionsError) console.error('Error:', sessionsError);

// Check practice_members
const { data: members, error: membersError } = await supabase
  .from('practice_members')
  .select('id, name, email, role');

console.log('\n👥 Practice Members:', members?.length || 0);
members?.forEach(m => console.log(`  - ${m.name} (${m.email})`));
if (membersError) console.error('Error:', membersError);

// Check skill_assessments
const { data: assessments, error: assessmentsError } = await supabase
  .from('skill_assessments')
  .select('team_member_id, count', { count: 'exact', head: false });

console.log('\n📊 Skill Assessments:', assessments?.length || 0);
if (assessmentsError) console.error('Error:', assessmentsError);

// Check invitations
const { data: invitations, error: invitationsError } = await supabase
  .from('invitations')
  .select('email, name, status, accepted_at, assessment_submitted_at')
  .in('status', ['accepted', 'completed']);

console.log('\n✉️ Invitations (accepted/completed):', invitations?.length || 0);
invitations?.forEach(i => console.log(`  - ${i.email} (${i.status})`));
if (invitationsError) console.error('Error:', invitationsError);

process.exit(0);

