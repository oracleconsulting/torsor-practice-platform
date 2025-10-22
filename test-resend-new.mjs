#!/usr/bin/env node
/**
 * Test with the API key that should be in Railway now
 */

// Try to check what Railway has deployed
console.log('🔍 Checking Railway deployment...\n');
console.log('If you just updated the RESEND_API_KEY in Railway:');
console.log('1. Check Railway logs to see if the new key is being used');
console.log('2. The logs should show the key prefix when the server starts\n');
console.log('💡 To verify, check Railway logs for this line:');
console.log('   "🔧 Supabase Config: { ... keyPrefix: \'re_...\' }"\n');
console.log('The server.js logs the first 20 characters of the key on startup.');
console.log('\n📋 Expected to see in Railway logs:');
console.log('   - Has the new API key prefix');
console.log('   - Server restarted after variable change');
console.log('\n❓ Did you add the new RESEND_API_KEY to Railway variables?');
console.log('   If yes → Check Railway logs to confirm it\'s using the new key');
console.log('   If no → Add it now, Railway will auto-redeploy');
