import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Import Supabase client for server-side operations
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Debug logging
console.log('🔧 Supabase Config:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  hasAnonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
  usingKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON',
  keyPrefix: supabaseServiceKey?.substring(0, 20) + '...',
});

// Cache control middleware
app.use((req, res, next) => {
  // Disable caching for HTML files and auth routes
  if (req.url.endsWith('.html') || req.url.includes('/auth') || req.url === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else {
    // Cache static assets for 1 year
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  console.log('📧 [Email API] Request received');
  try {
    const { to, subject, html, text, from } = req.body;
    
    // Get Resend API key from environment
    const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
    
    console.log('🔑 [Email API] API Key status:', {
      hasVITE_KEY: !!process.env.VITE_RESEND_API_KEY,
      hasRESEND_KEY: !!process.env.RESEND_API_KEY,
      keyPrefix: RESEND_API_KEY?.substring(0, 8) + '...',
      keyLength: RESEND_API_KEY?.length,
    });
    
    if (!RESEND_API_KEY || RESEND_API_KEY === 'your-resend-api-key-here') {
      console.error('❌ Resend API key not configured on server');
      return res.status(500).json({ 
        success: false, 
        error: 'Email service not configured' 
      });
    }
    
    // Call Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Email sent successfully:', data.id);
      return res.json({
        success: true,
        messageId: data.id,
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Resend API error:', response.status, errorData);
      return res.status(response.status).json({
        success: false,
        error: errorData.message || 'Failed to send email',
      });
    }
  } catch (error) {
    console.error('❌ Email endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Invitation fetching endpoint (bypasses RLS)
app.get('/api/invitations/:inviteCode', async (req, res) => {
  try {
    const { inviteCode } = req.params;
    
    console.log('🔍 Fetching invitation with code:', inviteCode);
    
    if (!supabase) {
      console.error('❌ Supabase not configured on server');
      return res.status(500).json({
        error: 'Database not configured',
      });
    }
    
    // Fetch invitation using server-side client (bypasses RLS)
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();
    
    if (error) {
      console.error('❌ Supabase error fetching invitation:', error);
      return res.status(404).json({
        error: 'Invitation not found',
        details: error.message,
      });
    }
    
    if (!data) {
      console.error('❌ No invitation found with code:', inviteCode);
      return res.status(404).json({
        error: 'Invitation not found',
      });
    }
    
    console.log('✅ Invitation found:', data.email);
    return res.json(data);
  } catch (error) {
    console.error('❌ Invitation endpoint error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

// Skills fetching endpoint (bypasses RLS)
app.get('/api/skills', async (req, res) => {
  try {
    console.log('🔍 Fetching all skills...');
    
    if (!supabase) {
      console.error('❌ Supabase not configured on server');
      return res.status(500).json({
        error: 'Database not configured',
      });
    }
    
    // Fetch all skills using server-side client (bypasses RLS)
    console.log('📊 Querying skills table...');
    const { data, error, count } = await supabase
      .from('skills')
      .select('*', { count: 'exact' })
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    console.log('📊 Query result:', { 
      dataLength: data?.length, 
      error: error?.message,
      count,
      sampleSkill: data?.[0]?.name 
    });
    
    if (error) {
      console.error('❌ Supabase error fetching skills:', error);
      return res.status(500).json({
        error: 'Failed to fetch skills',
        details: error.message,
      });
    }
    
    console.log('✅ Fetched', data?.length || 0, 'skills');
    return res.json(data || []);
  } catch (error) {
    console.error('❌ Skills endpoint error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

// Submit assessment endpoint (bypasses RLS)
app.post('/api/invitations/:inviteCode/submit', async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const { assessmentData } = req.body;
    
    console.log('📝 Submitting assessment for:', inviteCode);
    
    if (!supabase) {
      console.error('❌ Supabase not configured on server');
      return res.status(500).json({
        error: 'Database not configured',
      });
    }
    
    // Step 1: Get invitation details
    console.log('📋 Fetching invitation details...');
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();
    
    if (inviteError || !invitation) {
      console.error('❌ Invitation not found:', inviteError);
      return res.status(404).json({
        error: 'Invitation not found',
        details: inviteError?.message,
      });
    }
    
    console.log('✅ Invitation found:', invitation.email, 'Practice ID:', invitation.practice_id);
    
    // Step 2: Create or find practice_member record
    console.log('👤 Creating/finding practice member...');
    const { data: existingMember } = await supabase
      .from('practice_members')
      .select('*')
      .eq('email', invitation.email)
      .eq('practice_id', invitation.practice_id)
      .single();
    
    let practiceMemberId;
    
    if (existingMember) {
      console.log('✅ Practice member already exists:', existingMember.id);
      practiceMemberId = existingMember.id;
    } else {
      console.log('➕ Creating new practice member...');
      const { data: newMember, error: memberError } = await supabase
        .from('practice_members')
        .insert({
          practice_id: invitation.practice_id,
          name: invitation.name || 'Team Member',
          email: invitation.email,
          role: invitation.role || 'team_member',
          is_active: true,
          joined_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (memberError) {
        console.error('❌ Failed to create practice member:', memberError);
        return res.status(500).json({
          error: 'Failed to create practice member',
          details: memberError.message,
        });
      }
      
      console.log('✅ Practice member created:', newMember.id);
      practiceMemberId = newMember.id;
    }
    
    // Step 3: Create skill_assessments records
    console.log('📊 Creating skill assessments...');
    const skillAssessments = assessmentData.map(assessment => ({
      team_member_id: practiceMemberId,
      skill_id: assessment.skill_id,
      current_level: assessment.current_level,
      interest_level: assessment.interest_level,
      notes: assessment.notes || null,
      assessed_at: new Date().toISOString(),
    }));
    
    // Delete existing assessments for this member (to avoid duplicates)
    console.log('🗑️ Clearing existing assessments...');
    await supabase
      .from('skill_assessments')
      .delete()
      .eq('team_member_id', practiceMemberId);
    
    // Insert new assessments
    console.log(`➕ Inserting ${skillAssessments.length} skill assessments...`);
    const { error: assessmentError } = await supabase
      .from('skill_assessments')
      .insert(skillAssessments);
    
    if (assessmentError) {
      console.error('❌ Failed to create skill assessments:', assessmentError);
      return res.status(500).json({
        error: 'Failed to create skill assessments',
        details: assessmentError.message,
      });
    }
    
    console.log('✅ Skill assessments created successfully');
    
    // Step 4: Update invitation status
    console.log('📝 Updating invitation status...');
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        assessment_data: assessmentData,
      })
      .eq('invite_code', inviteCode)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Failed to update invitation:', updateError);
      // Non-critical, continue anyway
    }
    
    console.log('🎉 Assessment submission complete for:', invitation.email);
    console.log('   - Practice Member ID:', practiceMemberId);
    console.log('   - Skill Assessments:', skillAssessments.length);
    
    return res.json({ 
      success: true, 
      data: updatedInvitation,
      practiceMemberId,
      assessmentCount: skillAssessments.length,
    });
  } catch (error) {
    console.error('❌ Submit assessment endpoint error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
  etag: true,
  lastModified: true,
  maxAge: '1y'
}));

// API proxy middleware
app.use('/api', (req, res, next) => {
  // Proxy API calls to the backend
  const apiUrl = process.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
  req.url = req.url.replace('/api', '');
  // For now, just pass through - you might want to add actual proxy logic here
  next();
});

// Handle all routes by serving the index.html file
// This is crucial for client-side routing to work
app.get('*', (req, res) => {
  console.log(`[Server] Request for: ${req.url}`);
  
  // Don't serve index.html for static files
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return res.status(404).send('Not found');
  }
  
  // Set no-cache headers for all HTML routes
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving files from: ${path.join(__dirname, 'dist')}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 