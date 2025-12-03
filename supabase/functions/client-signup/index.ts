// ============================================================================
// EDGE FUNCTION: client-signup
// ============================================================================
// Secure client signup - validates practice code and creates user + member
// No client-side database queries needed - all server-side
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Practice codes mapped to IDs - add your practices here
const PRACTICE_CODES: Record<string, { name: string; practiceId?: string }> = {
  'rpgcc': { name: 'RP Griffiths Chartered Certified Accountants' },
  'torsor': { name: 'Torsor' },
  // Add more practice codes as needed
};

interface SignupRequest {
  practiceCode: string;
  email: string;
  password: string;
  name: string;
  company?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SignupRequest = await req.json();
    const { practiceCode, email, password, name, company } = body;

    // Validate practice code
    const practiceConfig = PRACTICE_CODES[practiceCode.toLowerCase()];
    if (!practiceConfig) {
      return new Response(
        JSON.stringify({ error: 'Invalid practice code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find practice in database (by code or name pattern)
    let practiceId = practiceConfig.practiceId;
    
    if (!practiceId) {
      const { data: practices } = await supabase
        .from('practices')
        .select('id, name')
        .or(`name.ilike.%${practiceCode}%,name.ilike.%${practiceConfig.name.split(' ')[0]}%`)
        .limit(1);
      
      if (practices && practices.length > 0) {
        practiceId = practices[0].id;
      } else {
        // Fallback: get first practice (for single-tenant setups)
        const { data: firstPractice } = await supabase
          .from('practices')
          .select('id')
          .limit(1)
          .single();
        
        if (firstPractice) {
          practiceId = firstPractice.id;
        }
      }
    }

    if (!practiceId) {
      return new Response(
        JSON.stringify({ error: 'Practice not configured. Please contact support.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists
    const { data: existingMember } = await supabase
      .from('practice_members')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: 'An account with this email already exists. Please log in.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for smoother experience
      user_metadata: { name, company }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create practice member as discovery client
    const { data: member, error: memberError } = await supabase
      .from('practice_members')
      .insert({
        practice_id: practiceId,
        user_id: authData.user.id,
        name,
        email: email.toLowerCase(),
        member_type: 'client',
        program_status: 'discovery',
        client_company: company || null,
      })
      .select()
      .single();

    if (memberError) {
      console.error('Member error:', memberError);
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create client profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enroll in discovery service line (if exists)
    const { data: discoveryService } = await supabase
      .from('service_lines')
      .select('id')
      .eq('code', 'discovery')
      .maybeSingle();

    if (discoveryService && member) {
      await supabase
        .from('client_service_lines')
        .insert({
          client_id: member.id,
          service_line_id: discoveryService.id,
          status: 'pending_discovery'
        });
    }

    // Log the signup
    console.log(`New client signup: ${email} for practice ${practiceId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Account created successfully',
        redirectTo: '/login'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

