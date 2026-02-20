/**
 * SERVICE CREATION MODAL
 * 
 * Allows admins to review, edit, and approve AI-generated service proposals
 * created from identified opportunities.
 */

import { useState, useEffect } from 'react';
import { 
  X, Loader2, CheckCircle, AlertTriangle, Star, 
  Zap, Target, DollarSign, Clock, Users, Brain,
  ChevronDown, ChevronUp, Edit2, Save, Trash2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ServiceProposal {
  name: string;
  code: string;
  headline: string;
  description: string;
  short_description: string;
  category: string;
  deliverables: string[];
  typical_duration: string;
  time_to_first_value: string;
  delivery_complexity: string;
  pricing_suggestion: {
    model: string;
    price_from: number;
    price_to: number;
    unit: string;
    rationale: string;
  };
  best_for: string;
  typical_roi: string;
}

interface SkillMapping {
  skill_id: string;
  skill_name: string;
  importance: string;
  minimum_level: number;
  ideal_level: number;
  recommended_seniority: string[];
  rationale: string;
}

interface TriggerDefinition {
  trigger_code: string;
  trigger_name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  weight: number;
  severity_when_triggered: string;
  talking_point: string;
}

interface ServiceCreationRequest {
  id: string;
  source_type: string;
  proposed_service: ServiceProposal;
  proposed_skills: SkillMapping[];
  proposed_triggers: TriggerDefinition[];
  ai_reasoning: string;
  llm_model: string;
  status: string;
  requested_at: string;
}

interface ServiceCreationModalProps {
  requestId: string;
  onClose: () => void;
  onApproved: () => void;
}

const IMPORTANCE_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  required: 'bg-orange-100 text-orange-800',
  beneficial: 'bg-blue-100 text-blue-800',
  nice_to_have: 'bg-gray-100 text-gray-700',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

export function ServiceCreationModal({ requestId, onClose, onApproved }: ServiceCreationModalProps) {
  const [request, setRequest] = useState<ServiceCreationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Editing states
  const [editingService, setEditingService] = useState(false);
  const [editedService, setEditedService] = useState<ServiceProposal | null>(null);
  const [editedPricing, setEditedPricing] = useState({ from: 0, to: 0 });
  
  // Expansion states
  const [expandedSections, setExpandedSections] = useState({
    service: true,
    skills: true,
    triggers: true,
    reasoning: false,
  });

  useEffect(() => {
    loadRequest();
  }, [requestId]);

  const loadRequest = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('service_creation_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;
      setRequest(data);
      setEditedService(data.proposed_service);
      setEditedPricing({
        from: data.proposed_service.pricing_suggestion.price_from,
        to: data.proposed_service.pricing_suggestion.price_to,
      });
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleApprove = async () => {
    if (!request || !editedService) return;
    
    setApproving(true);
    setError(null);
    
    try {
      // 1. Create the service
      const { data: newService, error: serviceError } = await supabase
        .from('services')
        .insert({
          code: editedService.code,
          name: editedService.name,
          category: editedService.category,
          headline: editedService.headline,
          description: editedService.description,
          short_description: editedService.short_description,
          deliverables: editedService.deliverables,
          typical_duration: editedService.typical_duration,
          time_to_first_value: editedService.time_to_first_value,
          delivery_complexity: editedService.delivery_complexity,
          pricing_model: editedService.pricing_suggestion.model,
          price_from: editedPricing.from,
          price_to: editedPricing.to,
          price_unit: editedService.pricing_suggestion.unit,
          best_for: editedService.best_for,
          typical_roi: editedService.typical_roi,
          workflow_status: 'active',
          originated_from: 'opportunity',
          source_opportunity_id: request.source_type === 'opportunity' ? request.id : null,
          source_concept_id: request.source_type === 'service_concept' ? request.id : null,
          status: 'active',
        })
        .select()
        .single();

      if (serviceError) throw serviceError;

      // 2. Create skill requirements
      if (request.proposed_skills.length > 0) {
        const skillReqs = request.proposed_skills.map(skill => ({
          service_id: newService.id,
          skill_id: skill.skill_id,
          importance: skill.importance,
          minimum_level: skill.minimum_level,
          ideal_level: skill.ideal_level,
          recommended_seniority: skill.recommended_seniority,
          rationale: skill.rationale,
        }));

        const { error: skillsError } = await supabase
          .from('service_skill_requirements')
          .insert(skillReqs);

        if (skillsError) {
          console.error('Failed to insert skills:', skillsError);
          // Don't fail the whole operation
        }
      }

      // 3. Create triggers
      if (request.proposed_triggers.length > 0) {
        const triggers = request.proposed_triggers.map(trigger => ({
          service_id: newService.id,
          trigger_code: trigger.trigger_code,
          trigger_name: trigger.trigger_name,
          description: trigger.description,
          trigger_type: trigger.trigger_type,
          trigger_config: trigger.trigger_config,
          weight: trigger.weight,
          severity_when_triggered: trigger.severity_when_triggered,
          talking_point: trigger.talking_point,
          is_active: true,
          created_by_llm_model: request.llm_model,
        }));

        const { error: triggersError } = await supabase
          .from('service_opportunity_triggers')
          .insert(triggers);

        if (triggersError) {
          console.error('Failed to insert triggers:', triggersError);
          // Don't fail the whole operation
        }
      }

      // 4. Update the request status
      await supabase
        .from('service_creation_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          created_service_id: newService.id,
        })
        .eq('id', requestId);

      onApproved();
    } catch (err: any) {
      console.error('Approval failed:', err);
      setError(err.message);
    }
    
    setApproving(false);
  };

  const handleReject = async () => {
    if (!confirm('Reject this service proposal? It will be marked as rejected.')) return;
    
    try {
      await supabase
        .from('service_creation_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading proposal...</span>
        </div>
      </div>
    );
  }

  if (!request || !editedService) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-red-600">
          Failed to load service proposal
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Review Service Proposal</h2>
            <p className="text-sm text-gray-600">
              AI-generated from {request.source_type} • {request.llm_model}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* SERVICE DETAILS */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('service')}
              className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span className="font-semibold">Service Definition</span>
              </div>
              {expandedSections.service ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.service && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">NAME</label>
                    {editingService ? (
                      <input
                        type="text"
                        value={editedService.name}
                        onChange={e => setEditedService({ ...editedService, name: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      />
                    ) : (
                      <p className="font-semibold text-lg">{editedService.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">CODE</label>
                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{editedService.code}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500">HEADLINE</label>
                  {editingService ? (
                    <input
                      type="text"
                      value={editedService.headline}
                      onChange={e => setEditedService({ ...editedService, headline: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-700">{editedService.headline}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500">DESCRIPTION</label>
                  {editingService ? (
                    <textarea
                      value={editedService.description}
                      onChange={e => setEditedService({ ...editedService, description: e.target.value })}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-700">{editedService.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-medium">{editedService.typical_duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-xs text-gray-500">Time to Value</p>
                      <p className="font-medium">{editedService.time_to_first_value}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Complexity</p>
                      <p className="font-medium capitalize">{editedService.delivery_complexity}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500">DELIVERABLES</label>
                  <ul className="mt-1 space-y-1">
                    {editedService.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pricing - Always editable */}
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-amber-800">Pricing (Edit Before Approval)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-amber-700">From</label>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">£</span>
                        <input
                          type="number"
                          value={editedPricing.from}
                          onChange={e => setEditedPricing({ ...editedPricing, from: Number(e.target.value) })}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-amber-700">To</label>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">£</span>
                        <input
                          type="number"
                          value={editedPricing.to}
                          onChange={e => setEditedPricing({ ...editedPricing, to: Number(e.target.value) })}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-amber-700">Model</label>
                      <p className="font-medium">{editedService.pricing_suggestion.model} {editedService.pricing_suggestion.unit}</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 mt-2">
                    <strong>AI Rationale:</strong> {editedService.pricing_suggestion.rationale}
                  </p>
                </div>

                <button
                  onClick={() => setEditingService(!editingService)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  {editingService ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  {editingService ? 'Done Editing' : 'Edit Details'}
                </button>
              </div>
            )}
          </div>

          {/* SKILLS */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('skills')}
              className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">Required Skills ({request.proposed_skills.length})</span>
              </div>
              {expandedSections.skills ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.skills && (
              <div className="p-4">
                <div className="space-y-3">
                  {request.proposed_skills.map((skill, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{skill.skill_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${IMPORTANCE_COLORS[skill.importance]}`}>
                            {skill.importance}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Level {skill.minimum_level}-{skill.ideal_level}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{skill.rationale}</p>
                      <div className="flex gap-1 mt-2">
                        {skill.recommended_seniority.map((s, j) => (
                          <span key={j} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TRIGGERS */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('triggers')}
              className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="font-semibold">Detection Triggers ({request.proposed_triggers.length})</span>
              </div>
              {expandedSections.triggers ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.triggers && (
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  These triggers will automatically detect when future clients need this service
                </p>
                <div className="space-y-3">
                  {request.proposed_triggers.map((trigger, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{trigger.trigger_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_COLORS[trigger.severity_when_triggered]}`}>
                            {trigger.severity_when_triggered}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">Weight: {(trigger.weight * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{trigger.description}</p>
                      <div className="mt-2 p-2 bg-white rounded border text-xs font-mono">
                        {JSON.stringify(trigger.trigger_config, null, 2)}
                      </div>
                      {trigger.talking_point && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                          <strong>Say:</strong> "{trigger.talking_point}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI REASONING */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('reasoning')}
              className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <span className="font-semibold">AI Reasoning</span>
              </div>
              {expandedSections.reasoning ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.reasoning && (
              <div className="p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{request.ai_reasoning}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleReject}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            Reject
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
            >
              {approving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Approve & Create Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

