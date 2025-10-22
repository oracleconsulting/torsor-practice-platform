#!/usr/bin/env node
const RESEND_API_KEY = 're_Q8YzQoRW_5SqpnBD4Y377NVJdvS1e1dwZ';

async function testKey() {
  console.log('Testing Resend API key from Railway...\n');
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: ['jhoward@rpgcc.co.uk'],
        subject: 'Test',
        html: '<p>Test</p>',
      }),
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('\n❌ API KEY IS INVALID!');
      console.log('\n🔧 TO FIX:');
      console.log('1. Go to https://resend.com/api-keys');
      console.log('2. Create a NEW API key');
      console.log('3. Update Railway RESEND_API_KEY variable');
      console.log('4. Railway will auto-redeploy');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testKey();

