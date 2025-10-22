#!/usr/bin/env node
const RESEND_API_KEY = 're_Q8YzQoRW_5SqpnBD4Y377NVJdvS1e1dwZ';

async function testWithTorsorDomain() {
  console.log('🧪 Testing with torsor.co.uk domain (verified)...\n');
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@torsor.co.uk',
        to: ['SBairdCaesar@rpgcc.co.uk'],
        subject: 'You\'re Invited to Join Our Skills Portal',
        html: '<h1>Test Email</h1><p>This is a test from the verified domain.</p>',
      }),
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Email should be sent.');
      console.log('📧 Check SBairdCaesar@rpgcc.co.uk for the test email');
    } else {
      console.log('\n❌ FAILED');
      if (response.status === 403) {
        console.log('Domain verification issue');
      } else if (response.status === 422) {
        console.log('Invalid email format or domain');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWithTorsorDomain();

