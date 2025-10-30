// ============================================================================
// FIX JIMMY'S PASSWORD & ADD ASSESSMENT DATA
// ============================================================================
// This script:
// 1. Resets Jimmy's password to TorsorTeam2025!
// 2. Populates his invitations table with full assessment data
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://nwmzegonnmqzflamcxfd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STANDARD_PASSWORD = 'TorsorTeam2025!';

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

async function fixJimmy() {
  try {
    console.log('🔧 Fixing Jimmy\'s account...\n');

    // Step 1: Get Jimmy's details
    console.log('📋 Step 1: Finding Jimmy...');
    const { data: jimmy, error: findError } = await supabase
      .from('practice_members')
      .select('*')
      .eq('email', 'jameshowardivc@gmail.com')
      .single();

    if (findError || !jimmy) {
      throw new Error('Jimmy not found in practice_members');
    }

    console.log(`✅ Found Jimmy: ${jimmy.id}`);
    console.log(`   Auth User ID: ${jimmy.user_id}\n`);

    // Step 2: Reset password
    if (jimmy.user_id) {
      console.log('🔐 Step 2: Resetting password...');
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        jimmy.user_id,
        { password: STANDARD_PASSWORD }
      );

      if (passwordError) {
        console.error('⚠️  Password reset failed:', passwordError.message);
      } else {
        console.log('✅ Password reset successfully\n');
      }
    }

    // Step 3: Get all skills for assessment data
    console.log('📋 Step 3: Loading all skills...');
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, category')
      .order('name');

    if (skillsError) {
      throw skillsError;
    }

    console.log(`✅ Loaded ${skills.length} skills\n`);

    // Step 4: Generate realistic assessment data (levels 2-4 for a team member)
    console.log('📋 Step 4: Generating assessment data...');
    const assessmentData = {};
    
    skills.forEach(skill => {
      // Random level between 2-4 (team member level)
      const level = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
      assessmentData[skill.id] = {
        skill_id: skill.id,
        skill_name: skill.name,
        category: skill.category,
        current_level: level,
        interest_level: Math.floor(Math.random() * 3) + 2, // 2-4 interest
        target_level: Math.min(level + 1, 5),
        assessed_at: new Date().toISOString()
      };
    });

    console.log(`✅ Generated ${Object.keys(assessmentData).length} skill assessments\n`);

    // Step 5: Check if invitation exists
    console.log('📋 Step 5: Checking for existing invitation...');
    const { data: existingInvite, error: inviteCheckError } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', 'jameshowardivc@gmail.com')
      .single();

    if (existingInvite) {
      // Update existing
      console.log('💾 Updating existing invitation...');
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          name: 'Jimmy Test',
          status: 'accepted',
          assessment_data: assessmentData,
          updated_at: new Date().toISOString()
        })
        .eq('email', 'jameshowardivc@gmail.com');

      if (updateError) {
        throw updateError;
      }
      console.log('✅ Updated existing invitation\n');
    } else {
      // Create new
      console.log('💾 Creating new invitation...');
      const { error: createError } = await supabase
        .from('invitations')
        .insert({
          email: 'jameshowardivc@gmail.com',
          name: 'Jimmy Test',
          practice_id: jimmy.practice_id,
          status: 'accepted',
          assessment_data: assessmentData
        });

      if (createError) {
        throw createError;
      }
      console.log('✅ Created new invitation\n');
    }

    // Step 6: Verify
    console.log('📋 Step 6: Verifying setup...');
    const { data: finalInvite, error: verifyError } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', 'jameshowardivc@gmail.com')
      .single();

    if (verifyError) {
      throw verifyError;
    }

    const assessmentCount = Object.keys(finalInvite.assessment_data || {}).length;

    console.log('');
    console.log('='.repeat(60));
    console.log('🎉 SUCCESS! Jimmy is Ready for Testing');
    console.log('='.repeat(60));
    console.log('Name:', jimmy.name);
    console.log('Email:', jimmy.email);
    console.log('Password:', STANDARD_PASSWORD);
    console.log('Login URL: https://torsor.co.uk/auth');
    console.log('Skills Assessed:', assessmentCount);
    console.log('Invitation Status:', finalInvite.status);
    console.log('='.repeat(60));
    console.log('');
    console.log('✅ Jimmy can now login and test:');
    console.log('   - Skills Heatmap (with real data)');
    console.log('   - CPD Tracking');
    console.log('   - Assessments');
    console.log('   - Portal invitations');
    console.log('   - All dashboard features');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    process.exit(1);
  }
}

fixJimmy();

