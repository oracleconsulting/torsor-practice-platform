// ============================================================================
// BULK CREATE AUTH ACCOUNTS FOR TEAM MEMBERS
// ============================================================================
// This Node.js script creates Supabase auth accounts for all team members
// who don't already have user_id set in practice_members table
//
// SETUP:
// 1. npm install @supabase/supabase-js
// 2. Set your SUPABASE_SERVICE_ROLE_KEY in .env
// 3. Run: node bulk_create_auth_accounts.js
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// CONFIGURATION
// ============================================================================
const SUPABASE_URL = 'https://nwmzegonrmqzflamcxfd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // ⚠️ KEEP SECRET!
const STANDARD_PASSWORD = 'TorsorTeam2025!'; // All users get this password initially
const PRACTICE_ID = 'a1b2c3d4-5678-90ab-cdef-123456789abc'; // RPGCC practice ID

// Create Supabase admin client (can manage auth users)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================================================
// MAIN FUNCTION
// ============================================================================
async function bulkCreateAuthAccounts() {
  console.log('🚀 Starting bulk auth account creation...\n');

  try {
    // Step 1: Get all team members without auth accounts
    console.log('📋 Step 1: Finding team members without auth accounts...');
    const { data: membersWithoutAuth, error: fetchError } = await supabase
      .from('practice_members')
      .select('id, email, name, role')
      .eq('practice_id', PRACTICE_ID)
      .is('user_id', null)
      .eq('is_active', true);

    if (fetchError) {
      console.error('❌ Error fetching members:', fetchError);
      return;
    }

    if (!membersWithoutAuth || membersWithoutAuth.length === 0) {
      console.log('✅ All team members already have auth accounts!');
      return;
    }

    console.log(`✅ Found ${membersWithoutAuth.length} members without auth accounts:\n`);
    membersWithoutAuth.forEach((member, i) => {
      console.log(`   ${i + 1}. ${member.name} (${member.email}) - ${member.role}`);
    });
    console.log('');

    // Step 2: Create auth accounts for each member
    console.log('🔐 Step 2: Creating auth accounts...\n');
    const results = {
      success: [],
      failed: []
    };

    for (const member of membersWithoutAuth) {
      try {
        console.log(`   Creating account for ${member.name} (${member.email})...`);

        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: member.email,
          password: STANDARD_PASSWORD,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: member.name,
            role: member.role
          }
        });

        if (authError) {
          console.error(`   ❌ Failed: ${authError.message}`);
          results.failed.push({ member, error: authError.message });
          continue;
        }

        console.log(`   ✅ Auth account created! user_id: ${authUser.user.id}`);

        // Step 3: Link auth account to practice_members
        const { error: updateError } = await supabase
          .from('practice_members')
          .update({
            user_id: authUser.user.id,
            password_change_required: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', member.id);

        if (updateError) {
          console.error(`   ⚠️ Warning: Auth account created but failed to link: ${updateError.message}`);
          results.failed.push({ member, error: `Link failed: ${updateError.message}` });
        } else {
          console.log(`   ✅ Linked to practice_members\n`);
          results.success.push({ member, userId: authUser.user.id });
        }

      } catch (error) {
        console.error(`   ❌ Unexpected error: ${error.message}`);
        results.failed.push({ member, error: error.message });
      }
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log('');

    if (results.success.length > 0) {
      console.log('✅ Successful accounts:');
      results.success.forEach(({ member, userId }) => {
        console.log(`   • ${member.name} (${member.email})`);
        console.log(`     user_id: ${userId}`);
      });
      console.log('');
    }

    if (results.failed.length > 0) {
      console.log('❌ Failed accounts:');
      results.failed.forEach(({ member, error }) => {
        console.log(`   • ${member.name} (${member.email})`);
        console.log(`     Error: ${error}`);
      });
      console.log('');
    }

    console.log('🎉 Bulk creation complete!');
    console.log(`📧 Standard password for all users: ${STANDARD_PASSWORD}`);
    console.log('⚠️  All users are marked as password_change_required = true');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// ============================================================================
// RUN IT
// ============================================================================
bulkCreateAuthAccounts();

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================
/*

1. SETUP:
   npm install @supabase/supabase-js dotenv

2. CREATE .env FILE:
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

3. FIND SERVICE ROLE KEY:
   - Go to Supabase Dashboard
   - Settings → API
   - Copy "service_role" key (NOT anon key!)
   - ⚠️ NEVER commit this key to git!

4. UPDATE CONFIGURATION (lines 14-17):
   - Set your SUPABASE_URL
   - Set PRACTICE_ID to your RPGCC practice ID
   - Set STANDARD_PASSWORD if different

5. RUN:
   node bulk_create_auth_accounts.js

6. RESULT:
   - Creates auth accounts for all members without user_id
   - Links user_id to practice_members
   - Sets password_change_required = true
   - Shows success/failure summary

7. SEND CREDENTIALS:
   - Use "Invite to Portal" button in User Management
   - Or send email with standard password

*/

