// ============================================================================
// DELETE USER SCRIPT
// ============================================================================
// This script safely deletes a user and all their data
// It handles both auth account and database records
//
// USAGE:
// node delete_user.js EMAIL_ADDRESS
// Example: node delete_user.js jameshowardivc@gmail.com
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://nwmzegonnmqzflamcxfd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteUser(email) {
  try {
    console.log(`🗑️  Starting deletion for: ${email}`);
    console.log('');

    // Step 1: Find the user in practice_members
    console.log('📋 Step 1: Finding user in practice_members...');
    const { data: member, error: findError } = await supabase
      .from('practice_members')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !member) {
      console.error('❌ User not found in practice_members:', findError?.message);
      return;
    }

    console.log(`✅ Found: ${member.name} (ID: ${member.id})`);
    console.log(`   User ID: ${member.user_id || 'None'}`);
    console.log('');

    // Step 2: Delete auth user FIRST (if exists)
    // This prevents foreign key constraint issues
    if (member.user_id) {
      console.log('📋 Step 2: Deleting auth user...');
      const { error: authError } = await supabase.auth.admin.deleteUser(member.user_id);
      
      if (authError) {
        console.error(`❌ Failed to delete auth user: ${authError.message}`);
        console.log('   Will try to continue with database cleanup...');
      } else {
        console.log('✅ Auth user deleted');
      }
      console.log('');
    } else {
      console.log('⏭️  Step 2: No auth user to delete');
      console.log('');
    }

    // Step 3: Delete related data
    console.log('📋 Step 3: Deleting related data...');
    
    // Delete skill assessments
    const { error: assessmentsError } = await supabase
      .from('skill_assessments')
      .delete()
      .eq('team_member_id', member.id);
    console.log(assessmentsError ? `   ⚠️  Skill assessments: ${assessmentsError.message}` : '   ✅ Skill assessments deleted');

    // Delete CPD activities
    const { error: cpdError } = await supabase
      .from('cpd_activities')
      .delete()
      .eq('practice_member_id', member.id);
    console.log(cpdError ? `   ⚠️  CPD activities: ${cpdError.message}` : '   ✅ CPD activities deleted');

    // Delete learning preferences
    const { error: varkError } = await supabase
      .from('learning_preferences')
      .delete()
      .eq('team_member_id', member.id);
    console.log(varkError ? `   ⚠️  Learning preferences: ${varkError.message}` : '   ✅ Learning preferences deleted');

    // Delete personality assessments
    const { error: personalityError } = await supabase
      .from('personality_assessments')
      .delete()
      .eq('team_member_id', member.id);
    console.log(personalityError ? `   ⚠️  Personality assessments: ${personalityError.message}` : '   ✅ Personality assessments deleted');

    // Delete invitations
    const { error: invitationsError } = await supabase
      .from('invitations')
      .delete()
      .eq('email', email);
    console.log(invitationsError ? `   ⚠️  Invitations: ${invitationsError.message}` : '   ✅ Invitations deleted');

    console.log('');

    // Step 4: Delete practice member
    console.log('📋 Step 4: Deleting practice member...');
    const { error: memberError } = await supabase
      .from('practice_members')
      .delete()
      .eq('id', member.id);

    if (memberError) {
      console.error(`❌ Failed to delete practice member: ${memberError.message}`);
      return;
    }

    console.log('✅ Practice member deleted');
    console.log('');
    console.log(`🎉 Successfully deleted ${member.name} (${email})`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ ERROR: Please provide an email address');
  console.log('');
  console.log('Usage: node delete_user.js EMAIL_ADDRESS');
  console.log('Example: node delete_user.js jameshowardivc@gmail.com');
  process.exit(1);
}

deleteUser(email);

