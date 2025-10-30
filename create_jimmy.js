// ============================================================================
// CREATE JIMMY TEST USER (Complete)
// ============================================================================
// This script creates Jimmy as a test user with full auth setup
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

async function createJimmy() {
  try {
    console.log('🚀 Creating Jimmy test user...\n');

    // Step 1: Get RPGCC practice ID
    console.log('📋 Step 1: Getting RPGCC practice ID...');
    const { data: practice, error: practiceError } = await supabase
      .from('practices')
      .select('id')
      .eq('name', 'RPGCC')
      .single();

    if (practiceError || !practice) {
      throw new Error('Could not find RPGCC practice');
    }
    console.log(`✅ Found RPGCC practice: ${practice.id}\n`);

    // Step 2: Check if Jimmy already exists in practice_members
    console.log('📋 Step 2: Checking if Jimmy already exists...');
    const { data: existingMember } = await supabase
      .from('practice_members')
      .select('*')
      .eq('email', 'jameshowardivc@gmail.com')
      .single();

    let memberId;

    if (existingMember) {
      console.log(`⚠️  Jimmy already exists: ${existingMember.id}`);
      memberId = existingMember.id;
      
      // Update to ensure active
      const { error: updateError } = await supabase
        .from('practice_members')
        .update({
          is_active: true,
          password_change_required: true,
          name: 'Jimmy Test',
          role: 'Team Member',
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (updateError) {
        console.error('⚠️  Could not update existing member:', updateError.message);
      } else {
        console.log('✅ Updated existing member\n');
      }
    } else {
      console.log('💾 Creating new practice_members record...');
      const { data: newMember, error: createError } = await supabase
        .from('practice_members')
        .insert({
          practice_id: practice.id,
          name: 'Jimmy Test',
          email: 'jameshowardivc@gmail.com',
          role: 'Team Member',
          is_active: true,
          joined_at: new Date().toISOString(),
          password_change_required: true
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      memberId = newMember.id;
      console.log(`✅ Created practice member: ${memberId}\n`);
    }

    // Step 3: Check if auth user already exists
    console.log('📋 Step 3: Checking for existing auth user...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingAuthUser = users.find(u => u.email === 'jameshowardivc@gmail.com');

    let authUserId;

    if (existingAuthUser) {
      console.log(`⚠️  Auth user already exists: ${existingAuthUser.id}`);
      authUserId = existingAuthUser.id;
      console.log('✅ Using existing auth user\n');
    } else {
      console.log('🔐 Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'jameshowardivc@gmail.com',
        password: STANDARD_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: 'Jimmy Test'
        }
      });

      if (authError) {
        throw authError;
      }

      authUserId = authData.user.id;
      console.log(`✅ Created auth user: ${authUserId}\n`);
    }

    // Step 4: Link auth user to practice member
    console.log('📋 Step 4: Linking auth user to practice member...');
    const { error: linkError } = await supabase
      .from('practice_members')
      .update({
        user_id: authUserId,
        password_change_required: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId);

    if (linkError) {
      throw linkError;
    }
    console.log('✅ Linked auth user to practice member\n');

    // Step 5: Verify final setup
    console.log('📋 Step 5: Verifying setup...');
    const { data: finalMember, error: verifyError } = await supabase
      .from('practice_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (verifyError) {
      throw verifyError;
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('🎉 SUCCESS! Jimmy Test User Created');
    console.log('='.repeat(60));
    console.log('Name:', finalMember.name);
    console.log('Email:', finalMember.email);
    console.log('Role:', finalMember.role);
    console.log('Member ID:', finalMember.id);
    console.log('Auth User ID:', finalMember.user_id);
    console.log('Password:', STANDARD_PASSWORD);
    console.log('Login URL: https://torsor.co.uk/auth');
    console.log('Password Change Required:', finalMember.password_change_required);
    console.log('='.repeat(60));
    console.log('');
    console.log('✅ Jimmy is ready for testing!');
    console.log('📧 You can now test the portal invitation email system.');

  } catch (error) {
    console.error('');
    console.error('❌ Error creating Jimmy:', error.message);
    console.error('');
    process.exit(1);
  }
}

createJimmy();

