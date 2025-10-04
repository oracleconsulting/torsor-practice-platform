import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  SparklesIcon,
  DocumentTextIcon,
  PhoneIcon,
  CheckCircleIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface VisionWorkflowPanelProps {
  practiceId: string;
  oracleGroupId: string;
  onVisionUpdated?: () => void;
}

type WorkflowStatus = 'assessment_complete' | 'vision_draft' | 'vision_finalized' | 'roadmap_generated';

export function VisionWorkflowPanel({ practiceId, oracleGroupId, onVisionUpdated }: VisionWorkflowPanelProps) {
  const [status, setStatus] = useState<WorkflowStatus>('assessment_complete');
  const [loading, setLoading] = useState(false);
  const [vision, setVision] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');

  useEffect(() => {
    loadVisionStatus();
  }, [oracleGroupId]);

  const loadVisionStatus = async () => {
    try {
      // Check if vision exists in client_config
      const { supabase } = await import('../../lib/supabase/client');
      const { data, error } = await supabase
        .from('client_config')
        .select('roadmap')
        .eq('group_id', oracleGroupId)
        .single();

      if (!error && data) {
        const roadmapData = (data as any).roadmap;
        if (roadmapData.five_year_vision) {
          setVision(roadmapData.five_year_vision);
          if (roadmapData.three_month_sprint) {
            setStatus('roadmap_generated');
          } else {
            setStatus('vision_finalized');
          }
        }
      }
    } catch (error) {
      console.error('Error loading vision status:', error);
    }
  };

  const handleGenerateVision = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
      
      // Call the Oracle API generate-roadmap endpoint (vision only)
      const response = await fetch(`${apiUrl}/generate-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: oracleGroupId,
          user_id: 'default',
          generate_vision_only: true // We'll need to add this flag to the API
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate vision');
      }

      const result = await response.json();
      setVision(result.five_year_vision);
      setStatus('vision_draft');
      setIsEditing(true);
      
      if (onVisionUpdated) onVisionUpdated();
    } catch (error) {
      console.error('Error generating vision:', error);
      alert('Failed to generate vision. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVision = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../../lib/supabase/client');
      
      // Update the vision in client_config.roadmap
      const { data: currentData } = await supabase
        .from('client_config')
        .select('roadmap')
        .eq('group_id', oracleGroupId)
        .single();

      const currentRoadmap = (currentData as any)?.roadmap || {};
      const updatedRoadmap = {
        ...currentRoadmap,
        five_year_vision: vision
      };

      const { error } = await (supabase as any)
        .from('client_config')
        .update({ roadmap: updatedRoadmap })
        .eq('group_id', oracleGroupId);

      if (error) throw error;

      setIsEditing(false);
      alert('Vision saved successfully!');
      
      if (onVisionUpdated) onVisionUpdated();
    } catch (error) {
      console.error('Error saving vision:', error);
      alert('Failed to save vision. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeVision = async () => {
    await handleSaveVision();
    setStatus('vision_finalized');
  };

  const handleUploadTranscript = async (file: File) => {
    const text = await file.text();
    setTranscript(text);
    
    // Store transcript in alignment_call_transcripts
    try {
      const { supabase } = await import('../../lib/supabase/client');
      await (supabase as any)
        .from('alignment_call_transcripts')
        .insert({
          practice_id: practiceId,
          oracle_group_id: oracleGroupId,
          transcript_title: `Vision Feedback Call - ${new Date().toLocaleDateString()}`,
          call_date: new Date().toISOString(),
          transcript_text: text,
          summary: 'Vision refinement call',
          topics: ['vision', 'feedback', 'refinement']
        });
      
      alert('Transcript uploaded successfully!');
    } catch (error) {
      console.error('Error uploading transcript:', error);
    }
  };

  const handleAnalyzeTranscript = async () => {
    setLoading(true);
    try {
      // TODO: Call LLM to analyze transcript and suggest vision updates
      // For now, just show a placeholder
      alert('Transcript analysis coming soon! This will extract insights and suggest vision refinements.');
    } catch (error) {
      console.error('Error analyzing transcript:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
      
      // Call the Oracle API to generate full roadmap (shifts + sprints)
      const response = await fetch(`${apiUrl}/generate-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: oracleGroupId,
          user_id: 'default'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate roadmap');
      }

      setStatus('roadmap_generated');
      alert('Roadmap generated successfully! It is now visible in the Oracle Method Portal.');
      
      if (onVisionUpdated) onVisionUpdated();
    } catch (error) {
      console.error('Error generating roadmap:', error);
      alert('Failed to generate roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'assessment_complete':
        return {
          label: 'Assessment Complete',
          color: 'bg-blue-100 text-blue-800',
          icon: CheckCircleIcon,
          message: 'Client has completed their assessment. Generate their initial vision.'
        };
      case 'vision_draft':
        return {
          label: 'Vision Draft',
          color: 'bg-yellow-100 text-yellow-800',
          icon: PencilIcon,
          message: 'Vision generated. Review, refine, and schedule feedback call.'
        };
      case 'vision_finalized':
        return {
          label: 'Vision Finalized',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircleIcon,
          message: 'Vision is finalized. Generate the full roadmap.'
        };
      case 'roadmap_generated':
        return {
          label: 'Roadmap Live',
          color: 'bg-purple-100 text-purple-800',
          icon: SparklesIcon,
          message: 'Roadmap is live in the Oracle Method Portal!'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StatusIcon className="w-8 h-8 text-gray-600" />
              <div>
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                <p className="text-sm text-gray-600 mt-1">{statusInfo.message}</p>
              </div>
            </div>
            <Button
              onClick={loadVisionStatus}
              variant="outline"
              size="sm"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Generate Initial Vision */}
      {status === 'assessment_complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6" />
              Step 1: Generate Initial Vision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate a personalized 5-year vision based on the client's assessment responses.
              This uses AI to create an emotionally intelligent narrative that captures their goals.
            </p>
            <Button
              onClick={handleGenerateVision}
              disabled={loading}
              size="lg"
            >
              {loading ? 'Generating...' : 'Generate Vision'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Edit & Refine Vision */}
      {(status === 'vision_draft' || status === 'vision_finalized') && vision && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DocumentTextIcon className="w-6 h-6" />
                Vision Editor
              </span>
              {!isEditing && (status === 'vision_draft' || status === 'vision_finalized') && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Vision Narrative</label>
              {isEditing ? (
                <textarea
                  value={vision.vision_narrative || ''}
                  onChange={(e) => setVision({ ...vision, vision_narrative: e.target.value })}
                  className="w-full p-3 border rounded-lg min-h-[150px]"
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">{vision.vision_narrative}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">North Star</label>
              {isEditing ? (
                <input
                  type="text"
                  value={vision.north_star || ''}
                  onChange={(e) => setVision({ ...vision, north_star: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                />
              ) : (
                <p className="text-lg font-semibold text-blue-600">{vision.north_star}</p>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-3">
                <Button onClick={handleSaveVision} disabled={loading}>
                  Save Draft
                </Button>
                <Button onClick={handleFinalizeVision} disabled={loading} variant="default">
                  Finalize Vision
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Upload Call Transcript */}
      {status === 'vision_draft' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneIcon className="w-6 h-6" />
              Step 2: Feedback Call & Transcript
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              After discussing the vision with the client, upload the call transcript
              to extract insights and further refine the vision.
            </p>
            <div>
              <input
                type="file"
                accept=".txt,.docx,.pdf"
                onChange={(e) => e.target.files?.[0] && handleUploadTranscript(e.target.files[0])}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            {transcript && (
              <Button onClick={handleAnalyzeTranscript} disabled={loading}>
                <SparklesIcon className="w-4 h-4 mr-2" />
                Analyze Transcript & Enrich Data
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Generate Full Roadmap */}
      {status === 'vision_finalized' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6" />
              Step 3: Generate Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              With the vision finalized, generate the 6-month shifts and 3-month sprints.
              This will create the complete roadmap visible in the Oracle Method Portal.
            </p>
            <Button
              onClick={handleGenerateRoadmap}
              disabled={loading}
              size="lg"
            >
              {loading ? 'Generating...' : 'Generate Full Roadmap'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Roadmap Generated Success */}
      {status === 'roadmap_generated' && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Roadmap Live!</h3>
                <p className="text-sm text-green-700">
                  The complete roadmap is now available in the Oracle Method Portal for the client to view.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

