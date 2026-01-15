// ============================================================================
// EDGE FUNCTION: Chat Completion
// ============================================================================
// Contextual AI chat for clients - uses client data to provide relevant answers
// Uses Claude Haiku for fast responses, escalates to Sonnet for complex queries

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// CLEANUP UTILITIES (inlined to avoid _shared import issues)
// ============================================================================

function cleanMechanical(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  return text
    // British English spellings
    .replace(/\boptimize/gi, 'optimise')
    .replace(/\boptimizing/gi, 'optimising')
    .replace(/\boptimized/gi, 'optimised')
    .replace(/\boptimization/gi, 'optimisation')
    .replace(/\banalyze/gi, 'analyse')
    .replace(/\banalyzing/gi, 'analysing')
    .replace(/\banalyzed/gi, 'analysed')
    .replace(/\brealize/gi, 'realise')
    .replace(/\brealizing/gi, 'realising')
    .replace(/\brealized/gi, 'realised')
    .replace(/\bbehavior/gi, 'behaviour')
    .replace(/\bbehaviors/gi, 'behaviours')
    .replace(/\bbehavioral/gi, 'behavioural')
    .replace(/\bcenter\b/gi, 'centre')
    .replace(/\bcenters\b/gi, 'centres')
    .replace(/\bcentered/gi, 'centred')
    .replace(/\bprogram\b/gi, 'programme')
    .replace(/\bprograms\b/gi, 'programmes')
    .replace(/\borganize/gi, 'organise')
    .replace(/\borganizing/gi, 'organising')
    .replace(/\borganized/gi, 'organised')
    .replace(/\borganization/gi, 'organisation')
    .replace(/\bfavor\b/gi, 'favour')
    .replace(/\bfavors\b/gi, 'favours')
    .replace(/\bfavorite/gi, 'favourite')
    .replace(/\bcolor/gi, 'colour')
    .replace(/\bcolors/gi, 'colours')
    .replace(/\bhonor/gi, 'honour')
    .replace(/\bhonors/gi, 'honours')
    .replace(/\brecognize/gi, 'recognise')
    .replace(/\brecognizing/gi, 'recognising')
    .replace(/\brecognized/gi, 'recognised')
    .replace(/\bspecialize/gi, 'specialise')
    .replace(/\bspecializing/gi, 'specialising')
    .replace(/\bspecialized/gi, 'specialised')
    .replace(/\bcatalog/gi, 'catalogue')
    .replace(/\bdialog\b/gi, 'dialogue')
    .replace(/\blabor/gi, 'labour')
    .replace(/\bneighbor/gi, 'neighbour')
    .replace(/\bpracticing/gi, 'practising')
    .replace(/\bfulfill/gi, 'fulfil')
    .replace(/\bfulfillment/gi, 'fulfilment')
    // Remove AI patterns
    .replace(/Here's the thing[:\s]*/gi, '')
    .replace(/Here's the truth[:\s]*/gi, '')
    .replace(/Here's what I see[:\s]*/gi, '')
    .replace(/Here's what we see[:\s]*/gi, '')
    .replace(/Here's what I also see[:\s]*/gi, '')
    .replace(/But here's what I also see[:\s]*/gi, '')
    .replace(/Here's another[^.]+\.\s*/gi, '')
    .replace(/Let me be direct[:\s]*/gi, '')
    .replace(/Let me be honest[:\s]*/gi, '')
    .replace(/I want to be direct with you[:\s]*/gi, '')
    .replace(/I want to be honest[:\s]*/gi, '')
    .replace(/You've done the hard work of [^.]+\.\s*/gi, '')
    .replace(/It doesn't mean [^.]+\. It means /gi, 'It means ')
    .replace(/That's not a fantasy\.\s*/gi, '')
    .replace(/That's not a dream\.\s*/gi, '')
    .replace(/At the end of the day,?\s*/gi, '')
    .replace(/To be honest,?\s*/gi, '')
    .replace(/Quite frankly,?\s*/gi, '')
    .replace(/The reality is,?\s*/gi, '')
    .replace(/Moving forward,?\s*/gi, '')
    .replace(/Going forward,?\s*/gi, '')
    .replace(/In a world where[^,]+,\s*/gi, '')
    // Clean up corporate jargon
    .replace(/\blow-hanging fruit\b/gi, 'quick wins')
    .replace(/\bmove the needle\b/gi, 'make progress')
    .replace(/\bboil the ocean\b/gi, 'try to do everything')
    .replace(/\bcircle back\b/gi, 'return to')
    .replace(/\btouch base\b/gi, 'check in')
    // Clean up spacing
    .replace(/  +/g, ' ')
    .replace(/\n\n\n+/g, '\n\n')
    .trim();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  clientId: string;
  practiceId: string;
  threadId?: string;
  message: string;
  context?: {
    currentWeek?: number;
    currentTasks?: string[];
    recentCompletions?: string[];
  };
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function detectComplexity(message: string, historyLength: number): 'simple' | 'complex' {
  const complexIndicators = [
    message.length > 500,
    message.includes('explain'),
    message.includes('why'),
    message.includes('compare'),
    message.includes('strategy'),
    message.includes('financial'),
    historyLength > 10,
    /\d{4,}/.test(message), // Numbers suggest financial discussion
  ];
  
  const complexCount = complexIndicators.filter(Boolean).length;
  return complexCount >= 2 ? 'complex' : 'simple';
}

function buildSystemPrompt(clientContext: any): string {
  return `
You are a knowledgeable business advisor assistant for the Goal Alignment Programme. You're helping ${clientContext.clientName || 'the client'} navigate their business transformation journey.

CRITICAL LANGUAGE QUALITY RULES - NEVER USE THESE PATTERNS:
- "Here's the truth:", "Here's what I see:", "Here's what I also see:"
- "In a world where...", "The reality is...", "Let's be clear..."
- "I want to be direct with you" (just be direct, don't announce it)
- "Let me be honest...", "To be frank..."
- "You've done the hard work of [X]" (patronising)
- "It's not about X. It's about Y."
- "That's not a fantasy.", "That's not a dream."
- "At the end of the day", "To be honest", "Moving forward"

Use British English: "organise" not "organize", "analyse" not "analyze", "programme" not "program", "behaviour" not "behavior", "colour" not "color", "favour" not "favor", "centre" not "center", "specialise" not "specialize", "£" not "$".

## Your Role
- Provide helpful, actionable guidance based on their specific situation
- Reference their roadmap and assessment data when relevant
- Be encouraging but realistic
- Know when to escalate to their human advisor

## Client Context
- Company: ${clientContext.companyName || 'Not specified'}
- Industry: ${clientContext.industry || 'Not specified'}
- Current Sprint Week: ${clientContext.currentWeek || 1} of 13
- Tasks This Week: ${clientContext.currentTasks?.join(', ') || 'None assigned'}
- Recent Completions: ${clientContext.recentCompletions?.join(', ') || 'None yet'}

## Conversation Guidelines
1. Keep responses concise and actionable (2-4 paragraphs max for most questions)
2. When they ask about tasks, reference their specific roadmap
3. If they seem stuck, offer to break down the task into smaller steps
4. If they express frustration, acknowledge it and offer perspective
5. For complex strategic questions, suggest they discuss with their advisor
6. Celebrate wins and progress

## Things You Can Help With
- Explaining tasks and why they matter
- Breaking down complex tasks into steps
- Providing templates or frameworks
- Answering business questions related to their industry
- Motivation and accountability
- Scheduling suggestions

## Things to Escalate to Human Advisor
- Major strategic pivots
- Financial decisions over £10k
- Legal or compliance concerns
- Emotional distress or crisis
- Requests to change the roadmap significantly
- Anything you're uncertain about

Respond naturally and conversationally. Include specific references to their situation when helpful.
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { clientId, practiceId, threadId, message, context } = 
      await req.json() as ChatRequest;

    if (!clientId || !practiceId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client context
    const { data: clientData } = await supabase
      .from('practice_members')
      .select('name, client_company, client_industry')
      .eq('id', clientId)
      .single();

    // Get conversation history if threadId provided
    let conversationHistory: Message[] = [];
    let currentThreadId = threadId;

    if (threadId) {
      const { data: messages } = await supabase
        .from('client_chat_messages')
        .select('role, content')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .limit(20); // Keep context manageable

      if (messages) {
        conversationHistory = messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));
      }
    } else {
      // Create new thread
      const { data: newThread } = await supabase
        .from('client_chat_threads')
        .insert({
          practice_id: practiceId,
          client_id: clientId,
          thread_type: 'general',
          status: 'active',
          context_snapshot: context
        })
        .select()
        .single();
      
      currentThreadId = newThread?.id;
    }

    // Determine model based on complexity
    const complexity = detectComplexity(message, conversationHistory.length);
    const model = complexity === 'complex' 
      ? 'anthropic/claude-sonnet-4-20250514'
      : 'anthropic/claude-3-haiku-20240307';

    // Build messages array
    const clientContext = {
      clientName: clientData?.name,
      companyName: clientData?.client_company,
      industry: clientData?.client_industry,
      currentWeek: context?.currentWeek || 1,
      currentTasks: context?.currentTasks || [],
      recentCompletions: context?.recentCompletions || []
    };

    const messages: Message[] = [
      { role: 'system', content: buildSystemPrompt(clientContext) },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const startTime = Date.now();
    
    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co',
        'X-Title': 'Torsor 365 Client Portal'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        temperature: complexity === 'complex' ? 0.4 : 0.3, // Reduced for consistency
        messages
      })
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      throw new Error(`OpenRouter API error: ${errorText}`);
    }

    const llmData = await llmResponse.json();
    const duration = Date.now() - startTime;
    
    const rawAssistantMessage = llmData.choices[0].message.content;
    // Apply cleanup to remove AI patterns and enforce British English
    const assistantMessage = cleanMechanical(rawAssistantMessage);
    const usage = llmData.usage;
    
    // Calculate cost based on model
    const costPerMillion = model.includes('haiku') 
      ? { input: 0.25, output: 1.25 }
      : { input: 3, output: 15 };
    
    const cost = ((usage?.prompt_tokens || 0) * costPerMillion.input / 1000000) + 
                 ((usage?.completion_tokens || 0) * costPerMillion.output / 1000000);

    // Save messages to database
    if (currentThreadId) {
      // Save user message
      await supabase.from('client_chat_messages').insert({
        thread_id: currentThreadId,
        role: 'user',
        content: message
      });

      // Save assistant message
      await supabase.from('client_chat_messages').insert({
        thread_id: currentThreadId,
        role: 'assistant',
        content: assistantMessage,
        llm_model: model,
        tokens_used: (usage?.prompt_tokens || 0) + (usage?.completion_tokens || 0),
        generation_cost: cost
      });

      // Update thread
      await supabase
        .from('client_chat_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentThreadId);
    }

    // Log LLM usage
    await supabase.from('llm_usage_log').insert({
      practice_id: practiceId,
      client_id: clientId,
      task_type: complexity === 'complex' ? 'chat_complex' : 'chat_simple',
      model_used: model,
      tokens_input: usage?.prompt_tokens || 0,
      tokens_output: usage?.completion_tokens || 0,
      cost_usd: cost,
      duration_ms: duration,
      success: true
    });

    return new Response(
      JSON.stringify({
        success: true,
        threadId: currentThreadId,
        message: assistantMessage,
        usage: {
          model,
          complexity,
          tokensInput: usage?.prompt_tokens,
          tokensOutput: usage?.completion_tokens,
          cost,
          durationMs: duration
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat completion:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

