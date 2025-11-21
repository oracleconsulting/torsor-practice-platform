#!/usr/bin/env node
/**
 * Quick Resend API Test
 * Tests if the Resend API key is working
 */

const RESEND_API_KEY = 're_RtQ8fyKQ_PfDugWYodVDTgn1mGQqWPL2P';

async function testResend() {
  console.log('🧪 Testing Resend API...\n');
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: ['jhoward@rpgcc.co.uk'], // Your email
        subject: 'Test Email from Torsor Portal',
        html: '<h1>Test Email</h1><p>If you receive this, Resend is working correctly!</p>',
        text: 'Test Email - If you receive this, Resend is working correctly!',
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Email sent successfully!');
      console.log('   Message ID:', data.id);
      console.log('\n📧 Check your email at jhoward@rpgcc.co.uk');
    } else {
      console.error('❌ Resend API error:', response.status);
      console.error('   Response:', JSON.stringify(data, null, 2));
      
      if (response.status === 403) {
        console.error('\n💡 API Key is invalid or not authorized');
      } else if (response.status === 422) {
        console.error('\n💡 Email validation failed - check sender domain');
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testResend();

