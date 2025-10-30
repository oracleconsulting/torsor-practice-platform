// ============================================================================
// BULK DELETE AUTH ACCOUNTS (USE WITH CAUTION!)
// ============================================================================
// This script deletes auth accounts for specified email addresses
// Useful for cleaning up test accounts or removing old users
//
// SETUP:
// 1. npm install @supabase/supabase-js
// 2. Set your SUPABASE_SERVICE_ROLE_KEY in .env
// 3. Add emails to DELETE_EMAILS array below
// 4. Run: node bulk_delete_auth_accounts.js
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// CONFIGURATION
// ============================================================================
const SUPABASE_URL = 'https://nwmzegonrmqzflamcxfd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // ⚠️ KEEP SECRET!

// ⚠️ LIST EMAILS TO DELETE HERE
const DELETE_EMAILS = [
  'james@ivcaccounting.co.uk',  // Example - replace with actual emails
  // Add more emails here as needed
];

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================================================
// MAIN FUNCTION
// ============================================================================
async function bulkDeleteAuthAccounts() {
  console.log('🗑️  Starting bulk auth account deletion...\n');
  console.log('⚠️  WARNING: This will permanently delete auth accounts!\n');

  if (DELETE_EMAILS.length === 0) {
    console.log('❌ No emails specified in DELETE_EMAILS array');
    console.log('   Edit the script and add emails to delete');
    return;
  }

  console.log('📋 Emails to delete:');
  DELETE_EMAILS.forEach((email, i) => {
    console.log(`   ${i + 1}. ${email}`);
  });
  console.log('');

  const results = {
    success: [],
    failed: [],
    notFound: []
  };

  // Delete each auth account
  for (const email of DELETE_EMAILS) {
    try {
      console.log(`🔍 Looking up user: ${email}`);

      // Find user by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error(`   ❌ Error listing users: ${listError.message}`);
        results.failed.push({ email, error: listError.message });
        continue;
      }

      const user = users.users.find(u => u.email === email);

      if (!user) {
        console.log(`   ⚠️  User not found in auth\n`);
        results.notFound.push(email);
        continue;
      }

      console.log(`   Found user_id: ${user.id}`);

      // Delete auth account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.error(`   ❌ Failed to delete: ${deleteError.message}\n`);
        results.failed.push({ email, error: deleteError.message });
      } else {
        console.log(`   ✅ Auth account deleted\n`);
        results.success.push(email);

        // Also unlink from practice_members (set user_id to null)
        const { error: unlinkError } = await supabase
          .from('practice_members')
          .update({ user_id: null })
          .eq('email', email);

        if (unlinkError) {
          console.log(`   ⚠️  Warning: Could not unlink from practice_members`);
        } else {
          console.log(`   ✅ Unlinked from practice_members\n`);
        }
      }

    } catch (error) {
      console.error(`   ❌ Unexpected error: ${error.message}\n`);
      results.failed.push({ email, error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully deleted: ${results.success.length}`);
  console.log(`⚠️  Not found: ${results.notFound.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('');

  if (results.success.length > 0) {
    console.log('✅ Deleted accounts:');
    results.success.forEach(email => console.log(`   • ${email}`));
    console.log('');
  }

  if (results.notFound.length > 0) {
    console.log('⚠️  Not found in auth:');
    results.notFound.forEach(email => console.log(`   • ${email}`));
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('❌ Failed to delete:');
    results.failed.forEach(({ email, error }) => {
      console.log(`   • ${email}`);
      console.log(`     Error: ${error}`);
    });
    console.log('');
  }

  console.log('🎉 Bulk deletion complete!');
}

// ============================================================================
// RUN IT
// ============================================================================
bulkDeleteAuthAccounts();

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================
/*

1. SETUP:
   npm install @supabase/supabase-js dotenv

2. CREATE .env FILE:
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

3. EDIT DELETE_EMAILS ARRAY (line 20-23):
   const DELETE_EMAILS = [
     'olduser1@example.com',
     'olduser2@example.com',
   ];

4. RUN:
   node bulk_delete_auth_accounts.js

5. RESULT:
   - Deletes auth accounts for specified emails
   - Unlinks user_id from practice_members (sets to null)
   - Shows summary of success/failures

⚠️ WARNING:
- This is permanent and cannot be undone!
- Users will not be able to login after deletion
- Only deletes auth accounts, not practice_members records
- Use with caution!

*/

