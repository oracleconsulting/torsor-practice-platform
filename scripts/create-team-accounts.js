#!/usr/bin/env node

/**
 * Create User Accounts for Team Members
 * 
 * This script creates Supabase auth accounts for all practice members
 * who don't already have user accounts.
 * 
 * Usage: node scripts/create-team-accounts.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PRACTICE_ID = 'a1b2c3d4-5678-90ab-cdef-123456789abc';
const TEMP_PASSWORD = 'Welcome2024!'; // Temporary password - users will be prompted to change

console.log('🔑 Environment Check:');
console.log(`   SUPABASE_URL: ${SUPABASE_URL ? '✅ Found' : '❌ Missing'}`);
console.log(`   SERVICE_KEY: ${SUPABASE_SERVICE_KEY ? `✅ Found (${SUPABASE_SERVICE_KEY.substring(0, 20)}...)` : '❌ Missing'}`);
console.log();

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('Required: VITE_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTeamAccounts() {
  console.log('\n🚀 Creating Team Member Accounts\n');
  console.log(`Practice ID: ${PRACTICE_ID}`);
  console.log(`Temporary Password: ${TEMP_PASSWORD}\n`);

  try {
    // Get all practice members
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id, name, email, role, user_id')
      .eq('practice_id', PRACTICE_ID)
      .order('name');

    if (membersError) {
      throw new Error(`Failed to fetch members: ${membersError.message}`);
    }

    console.log(`📋 Found ${members.length} team members\n`);

    const results = {
      created: [],
      existing: [],
      failed: []
    };

    // Process each member
    for (const member of members) {
      console.log(`\n👤 ${member.name} (${member.email})`);
      console.log(`   Role: ${member.role}`);

      // Skip if already has a user account
      if (member.user_id) {
        console.log(`   ✅ Already has account (user_id: ${member.user_id})`);
        results.existing.push(member);
        continue;
      }

      try {
        // Create auth user
        console.log(`   📧 Creating auth account...`);
        
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: member.email,
          password: TEMP_PASSWORD,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: member.name,
            role: member.role,
            practice_id: PRACTICE_ID,
            force_password_change: true // Custom flag
          }
        });

        if (authError) {
          throw new Error(`Auth creation failed: ${authError.message}`);
        }

        const userId = authData.user.id;
        console.log(`   ✅ Auth user created (${userId})`);

        // Update practice_members with user_id
        const { error: updateError } = await supabase
          .from('practice_members')
          .update({ user_id: userId })
          .eq('id', member.id);

        if (updateError) {
          console.log(`   ⚠️  WARNING: Failed to link user_id: ${updateError.message}`);
          console.log(`   Manual fix needed: UPDATE practice_members SET user_id='${userId}' WHERE id='${member.id}'`);
        } else {
          console.log(`   ✅ Linked to practice_member`);
        }

        results.created.push({
          ...member,
          user_id: userId
        });

      } catch (error) {
        console.log(`   ❌ FAILED: ${error.message}`);
        results.failed.push({
          ...member,
          error: error.message
        });
      }
    }

    // Print summary
    console.log('\n\n═══════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════\n');

    console.log(`✅ Accounts Created: ${results.created.length}`);
    if (results.created.length > 0) {
      console.log('\nNew Accounts:');
      results.created.forEach(m => {
        console.log(`   • ${m.name} (${m.email})`);
        console.log(`     Password: ${TEMP_PASSWORD}`);
        console.log(`     User ID: ${m.user_id}\n`);
      });
    }

    console.log(`📝 Already Existed: ${results.existing.length}`);
    if (results.existing.length > 0) {
      console.log('\nExisting Accounts:');
      results.existing.forEach(m => {
        console.log(`   • ${m.name} (${m.email}) - ${m.user_id}`);
      });
      console.log();
    }

    if (results.failed.length > 0) {
      console.log(`\n❌ Failed: ${results.failed.length}`);
      console.log('\nFailed Accounts:');
      results.failed.forEach(m => {
        console.log(`   • ${m.name} (${m.email})`);
        console.log(`     Error: ${m.error}\n`);
      });
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('\n💡 NEXT STEPS:\n');
    console.log(`1. Share credentials with team members:`);
    console.log(`   Email: [their email]`);
    console.log(`   Password: ${TEMP_PASSWORD}`);
    console.log(`   URL: https://torsor.co.uk/auth\n`);
    console.log(`2. Users will be prompted to change password on first login\n`);
    console.log(`3. You can now log in as any user to test their portal view\n`);

    return results;

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    throw error;
  }
}

// Run the script
createTeamAccounts()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

