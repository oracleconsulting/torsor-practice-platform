// ============================================================================
// EDGE FUNCTION: manage-assessment-questions
// ============================================================================
// CRUD operations for assessment questions
// Also provides questions to VP generation for AI context
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestionUpdate {
  id?: string;
  question_text?: string;
  options?: string[];
  placeholder?: string;
  char_limit?: number;
  max_selections?: number;
  is_required?: boolean;
  is_active?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

    // ================================================================
    // LIST: Get all questions for a service line
    // ================================================================
    if (action === 'list' || req.method === 'GET') {
      const serviceLineCode = url.searchParams.get('service_line_code');
      
      let query = supabase
        .from('assessment_questions')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (serviceLineCode) {
        query = query.eq('service_line_code', serviceLineCode);
      }

      const { data: questions, error } = await query;

      if (error) throw error;

      // Group by section for easier consumption
      const grouped = questions?.reduce((acc: Record<string, any[]>, q) => {
        if (!acc[q.section]) acc[q.section] = [];
        acc[q.section].push(q);
        return acc;
      }, {});

      return new Response(
        JSON.stringify({ 
          success: true, 
          questions,
          grouped,
          count: questions?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ================================================================
    // GET FOR AI: Get questions formatted for VP generation
    // ================================================================
    if (action === 'get-for-ai') {
      const serviceLineCode = url.searchParams.get('service_line_code');
      
      if (!serviceLineCode) {
        return new Response(
          JSON.stringify({ error: 'service_line_code required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: questions, error } = await supabase
        .from('assessment_questions')
        .select('question_id, section, question_text, question_type, options, emotional_anchor, technical_field')
        .eq('service_line_code', serviceLineCode)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      // Format for AI context
      const aiContext = {
        serviceLineCode,
        sections: [...new Set(questions?.map(q => q.section))],
        questions: questions?.map(q => ({
          id: q.question_id,
          section: q.section,
          question: q.question_text,
          type: q.question_type,
          options: q.options,
          emotionalAnchor: q.emotional_anchor,
          technicalField: q.technical_field
        })),
        emotionalAnchors: questions?.filter(q => q.emotional_anchor).map(q => q.emotional_anchor),
        technicalFields: questions?.filter(q => q.technical_field).map(q => q.technical_field)
      };

      return new Response(
        JSON.stringify({ success: true, aiContext }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For POST/PUT operations, parse the body
    const body = await req.json();

    // ================================================================
    // UPDATE: Update a single question
    // ================================================================
    if (action === 'update') {
      const { questionId, updates, updatedBy }: { 
        questionId: string; 
        updates: QuestionUpdate; 
        updatedBy?: string 
      } = body;

      if (!questionId) {
        return new Response(
          JSON.stringify({ error: 'questionId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get current question for history
      const { data: currentQuestion } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (!currentQuestion) {
        return new Response(
          JSON.stringify({ error: 'Question not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Track changes for history
      const changes: { field: string; oldValue: any; newValue: any }[] = [];
      
      if (updates.question_text && updates.question_text !== currentQuestion.question_text) {
        changes.push({
          field: 'question_text',
          oldValue: currentQuestion.question_text,
          newValue: updates.question_text
        });
      }

      if (updates.options && JSON.stringify(updates.options) !== JSON.stringify(currentQuestion.options)) {
        changes.push({
          field: 'options',
          oldValue: JSON.stringify(currentQuestion.options),
          newValue: JSON.stringify(updates.options)
        });
      }

      if (updates.placeholder !== undefined && updates.placeholder !== currentQuestion.placeholder) {
        changes.push({
          field: 'placeholder',
          oldValue: currentQuestion.placeholder,
          newValue: updates.placeholder
        });
      }

      // Update the question
      const { data: updatedQuestion, error: updateError } = await supabase
        .from('assessment_questions')
        .update({
          ...updates,
          options: updates.options ? updates.options : currentQuestion.options,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        })
        .eq('id', questionId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Record history
      for (const change of changes) {
        await supabase
          .from('assessment_question_history')
          .insert({
            question_id: questionId,
            field_changed: change.field,
            old_value: change.oldValue?.toString(),
            new_value: change.newValue?.toString(),
            changed_by: updatedBy
          });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          question: updatedQuestion,
          changesRecorded: changes.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ================================================================
    // BULK UPDATE: Update multiple questions at once
    // ================================================================
    if (action === 'bulk-update') {
      const { updates, updatedBy }: { 
        updates: Array<{ id: string } & QuestionUpdate>; 
        updatedBy?: string 
      } = body;

      const results = [];

      for (const update of updates) {
        const { id, ...fields } = update;
        
        const { data, error } = await supabase
          .from('assessment_questions')
          .update({
            ...fields,
            updated_at: new Date().toISOString(),
            updated_by: updatedBy
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          results.push({ id, success: false, error: error.message });
        } else {
          results.push({ id, success: true, question: data });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          results,
          updated: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ================================================================
    // REORDER: Update display order for questions
    // ================================================================
    if (action === 'reorder') {
      const { serviceLineCode, questionOrders }: { 
        serviceLineCode: string;
        questionOrders: Array<{ id: string; order: number }> 
      } = body;

      for (const { id, order } of questionOrders) {
        await supabase
          .from('assessment_questions')
          .update({ display_order: order })
          .eq('id', id);
      }

      return new Response(
        JSON.stringify({ success: true, reordered: questionOrders.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ================================================================
    // GET HISTORY: Get edit history for a question
    // ================================================================
    if (action === 'history') {
      const questionId = url.searchParams.get('question_id');

      const { data: history, error } = await supabase
        .from('assessment_question_history')
        .select('*')
        .eq('question_id', questionId)
        .order('changed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, history }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

