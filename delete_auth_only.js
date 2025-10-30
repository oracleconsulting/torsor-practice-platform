// ============================================================================
// DELETE AUTH USER ONLY (no database records)
// ============================================================================
// For cleaning up orphaned auth accounts that don't have practice_members records
//
// USAGE: node delete_auth_only.js EMAIL1 EMAIL2 EMAIL3 ...
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

async function deleteAuthUser(email) {
  try {
    console.log(`\n🔍 Looking for auth user: ${email}`);
    
    // Find the auth user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error(`❌ Error listing users: ${listError.message}`);
      return false;
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log(`⚠️  No auth user found with email: ${email}`);
      return false;
    }

    console.log(`✅ Found auth user: ${user.id}`);
    
    // Delete the auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error(`❌ Failed to delete: ${deleteError.message}`);
      return false;
    }

    console.log(`✅ Successfully deleted auth user: ${email}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    return false;
  }
}

// Get emails from command line arguments
const emails = process.argv.slice(2);

if (emails.length === 0) {
  console.error('❌ ERROR: Please provide at least one email address');
  console.log('\nUsage: node delete_auth_only.js EMAIL1 EMAIL2 EMAIL3 ...');
  console.log('Example: node delete_auth_only.js test@example.com another@example.com');
  process.exit(1);
}

console.log(`🚀 Starting deletion of ${emails.length} auth user(s)...`);

// Delete all emails sequentially
let successCount = 0;
let failCount = 0;

for (const email of emails) {
  const success = await deleteAuthUser(email);
  if (success) {
    successCount++;
  } else {
    failCount++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Successfully deleted: ${successCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log('='.repeat(60));

