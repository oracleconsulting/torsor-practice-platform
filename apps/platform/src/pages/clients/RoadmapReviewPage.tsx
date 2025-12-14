import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StageReview } from '@/components/roadmap/StageReview';
import { supabase } from '@/lib/supabase';
import { Send, Eye, ArrowLeft } from 'lucide-react';

export function RoadmapReviewPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [stages, setStages] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      loadStages();
      loadClient();
    }
  }, [clientId]);

  async function loadClient() {
    const { data } = await supabase
      .from('practice_members')
      .select('name, client_company')
      .eq('id', clientId)
      .single();
    
    setClient(data);
  }

  async function loadStages() {
    const { data } = await supabase
      .from('roadmap_stages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });
    
    setStages(data || []);
    setLoading(false);
  }

  async function handleApprove(stageId: string, editedContent?: any, reason?: string) {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;
    
    // Update stage
    const { error } = await supabase
      .from('roadmap_stages')
      .update({
        status: 'approved',
        approved_content: editedContent || stage.generated_content,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', stageId);

    if (error) {
      console.error('Error approving stage:', error);
      alert('Failed to approve stage');
      return;
    }

    // Log feedback if edited
    if (editedContent && reason) {
      await supabase.from('generation_feedback').insert({
        practice_id: stage.practice_id,
        client_id: clientId,
        feedback_source: 'practice_edit',
        stage_type: stage.stage_type,
        stage_id: stageId,
        original_content: stage.generated_content,
        edited_content: editedContent,
        edit_type: 'rewrite', // Could be more specific
        feedback_text: reason
      });
    }

    loadStages();
  }

  async function handleRegenerate(stageId: string) {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;
    
    // Confirm if there are dependent stages
    const dependentStages = stages.filter(s => 
      (s.stage_type === 'six_month_shift' && stage.stage_type === 'five_year_vision') ||
      (s.stage_type === 'sprint_plan' && ['five_year_vision', 'six_month_shift'].includes(stage.stage_type))
    );

    if (dependentStages.length > 0) {
      const confirmed = confirm(
        `Regenerating this will also regenerate: ${dependentStages.map(s => s.stage_type).join(', ')}. Continue?`
      );
      if (!confirmed) return;
    }

    // Queue regeneration
    await supabase.from('generation_queue').insert({
      practice_id: stage.practice_id,
      client_id: clientId,
      stage_type: stage.stage_type
    });

    loadStages();
  }

  async function publishToClient() {
    // Check all stages are approved
    const unapproved = stages.filter(s => s.status !== 'approved' && s.status !== 'published');
    if (unapproved.length > 0) {
      alert(`Please approve all stages first. Unapproved: ${unapproved.map(s => s.stage_type).join(', ')}`);
      return;
    }

    // Update all to published
    const { error } = await supabase
      .from('roadmap_stages')
      .update({ 
        status: 'published', 
        published_at: new Date().toISOString() 
      })
      .eq('client_id', clientId)
      .in('id', stages.map(s => s.id));

    if (error) {
      console.error('Error publishing:', error);
      alert('Failed to publish');
      return;
    }

    // Notify client (email, in-app notification, etc.)
    // ...

    loadStages();
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const allApproved = stages.length > 0 && stages.every(s => s.status === 'approved' || s.status === 'published');
  const allPublished = stages.length > 0 && stages.every(s => s.status === 'published');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Roadmap Review</h1>
          <p className="text-gray-600">{client?.name} - {client?.client_company}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" disabled={!allApproved}>
            <Eye size={16} className="mr-1" />
            Preview as Client
          </Button>
          <Button 
            onClick={publishToClient}
            disabled={!allApproved || allPublished}
          >
            <Send size={16} className="mr-1" />
            Publish to Client
          </Button>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex gap-2 mb-6">
        {['five_year_vision', 'six_month_shift', 'sprint_plan'].map(stageType => {
          const stage = stages.find(s => s.stage_type === stageType);
          const status = stage?.status || 'not_started';
          const colors: Record<string, string> = {
            'not_started': 'bg-gray-200',
            'generating': 'bg-blue-500 animate-pulse',
            'generated': 'bg-yellow-500',
            'approved': 'bg-green-500',
            'published': 'bg-purple-500'
          };
          return (
            <div key={stageType} className="flex-1">
              <div className={`h-2 rounded ${colors[status] || 'bg-gray-200'}`} />
              <p className="text-xs text-center mt-1">{stageType.replace(/_/g, ' ')}</p>
            </div>
          );
        })}
      </div>

      {/* Stage reviews */}
      {stages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No stages generated yet. Start the generation process to begin.
        </div>
      ) : (
        stages.map(stage => (
          <StageReview
            key={stage.id}
            stage={stage}
            onApprove={handleApprove}
            onRegenerate={handleRegenerate}
          />
        ))
      )}
    </div>
  );
}


