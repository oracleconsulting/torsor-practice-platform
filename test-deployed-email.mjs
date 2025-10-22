#!/usr/bin/env node
/**
 * Test email sending through the deployed Railway server
 */

const RAILWAY_URL = 'https://torsor.co.uk';

async function testDeployedEmail() {
  console.log('🧪 Testing email through deployed server...\n');
  console.log('URL:', RAILWAY_URL);
  
  try {
    const response = await fetch(`${RAILWAY_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'jhoward@rpgcc.co.uk',
        subject: 'Test from Railway Server',
        html: '<h1>Test Email via Railway</h1><p>This tests the server deployment.</p>',
        text: 'Test Email via Railway',
      }),
    });
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Email sent successfully!');
      console.log('📧 Check your email at jhoward@rpgcc.co.uk');
    } else {
      console.log('\n❌ Email failed');
      
      if (response.status === 500) {
        console.log('\n💡 Server error - possible causes:');
        console.log('   1. RESEND_API_KEY not set or invalid');
        console.log('   2. Server not using the new environment variable');
        console.log('   3. Resend API is down');
        console.log('\n🔧 Next steps:');
        console.log('   1. Check Railway logs for server errors');
        console.log('   2. Verify RESEND_API_KEY is set in Railway');
        console.log('   3. Try redeploying the service');
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDeployedEmail();

