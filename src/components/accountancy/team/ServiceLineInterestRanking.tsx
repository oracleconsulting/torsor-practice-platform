/**
 * Service Line Interest Ranking Component
 * Drag-and-drop interface for team members to rank their service line preferences
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  GripVertical, 
  Sparkles,
  TrendingUp,
  Award,
  Info
} from 'lucide-react';
import { 
  BSG_SERVICE_LINES,
  getServiceLineInterests,
  saveServiceLineInterests,
  type ServiceLineInterest
} from '@/lib/api/service-line-interests';
import { toast } from 'sonner';

interface ServiceLineRanking {
  serviceLine: string;
  rank: number;
  experienceLevel: number;
  desiredInvolvement: number;
  notes: string;
}

interface ServiceLineInterestRankingProps {
  memberId: string;
  memberName?: string;
}

const ServiceLineInterestRanking: React.FC<ServiceLineInterestRankingProps> = ({ 
  memberId, 
  memberName 
}) => {
  const [rankings, setRankings] = useState<ServiceLineRanking[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInterests();
  }, [memberId]);

  const loadInterests = async () => {
    setLoading(true);
    try {
      const interests = await getServiceLineInterests(memberId);
      
      if (interests.length > 0) {
        // Load existing rankings
        const loadedRankings = interests.map(interest => ({
          serviceLine: interest.service_line,
          rank: interest.interest_rank,
          experienceLevel: interest.current_experience_level,
          desiredInvolvement: interest.desired_involvement_pct,
          notes: interest.notes || ''
        }));
        
        // Add any missing service lines
        BSG_SERVICE_LINES.forEach((serviceLine, index) => {
          if (!loadedRankings.find(r => r.serviceLine === serviceLine)) {
            loadedRankings.push({
              serviceLine,
              rank: loadedRankings.length + 1,
              experienceLevel: 0,
              desiredInvolvement: 0,
              notes: ''
            });
          }
        });
        
        setRankings(loadedRankings.sort((a, b) => a.rank - b.rank));
      } else {
        // Initialize with default rankings
        const defaultRankings = BSG_SERVICE_LINES.map((serviceLine, index) => ({
          serviceLine,
          rank: index + 1,
          experienceLevel: 0,
          desiredInvolvement: 0,
          notes: ''
        }));
        setRankings(defaultRankings);
      }
    } catch (error) {
      console.error('Error loading service line interests:', error);
      toast.error('Failed to load your service line preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newRankings = [...rankings];
    const draggedItem = newRankings[draggedIndex];
    
    // Remove from old position
    newRankings.splice(draggedIndex, 1);
    // Insert at new position
    newRankings.splice(index, 0, draggedItem);
    
    // Update ranks
    newRankings.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    
    setRankings(newRankings);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleExperienceChange = (index: number, value: number) => {
    const newRankings = [...rankings];
    newRankings[index].experienceLevel = Math.max(0, Math.min(5, value));
    setRankings(newRankings);
  };

  const handleInvolvementChange = (index: number, value: number) => {
    const newRankings = [...rankings];
    newRankings[index].desiredInvolvement = Math.max(0, Math.min(100, value));
    setRankings(newRankings);
  };

  const handleNotesChange = (index: number, value: string) => {
    const newRankings = [...rankings];
    newRankings[index].notes = value;
    setRankings(newRankings);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const interests = rankings.map(ranking => ({
        service_line: ranking.serviceLine,
        interest_rank: ranking.rank,
        current_experience_level: ranking.experienceLevel,
        desired_involvement_pct: ranking.desiredInvolvement,
        notes: ranking.notes
      }));

      const success = await saveServiceLineInterests(memberId, interests);
      
      if (success) {
        toast.success('Service line preferences saved!');
      } else {
        toast.error('Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving service line interests:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const getServiceLineIcon = (serviceLine: string) => {
    const icons: Record<string, string> = {
      'Automation': '🔄',
      'Management Accounts': '📊',
      'Future Financial Information / Advisory Accelerator': '💼',
      'Benchmarking - External and Internal': '⚖️',
      'Profit Extraction / Remuneration Strategies': '💰',
      '365 Alignment Programme': '🎯'
    };
    return icons[serviceLine] || '📌';
  };

  const getServiceLineDescription = (serviceLine: string) => {
    const descriptions: Record<string, { short: string; features: string[] }> = {
      'Automation': {
        short: 'Data capture, system integration, and finance automation',
        features: [
          'Scan invoices & receipts to electronic format',
          'Auto-upload to data entry software',
          'Bank feed setup and troubleshooting'
        ]
      },
      'Management Accounts': {
        short: 'Regular financial reporting with KPI analysis and insights',
        features: [
          'Completed on suitable software package',
          'Data check for year-end compatibility',
          'Monthly, quarterly, or adhoc frequency'
        ]
      },
      'Future Financial Information / Advisory Accelerator': {
        short: 'Budgets, forecasts, valuations, and ongoing advisory support',
        features: [
          'Budgets, forecasts, and cashflow projections',
          'Business valuations',
          'Historic financial information analysis'
        ]
      },
      'Benchmarking - External and Internal': {
        short: 'Comparative financial analysis across industry',
        features: [
          'Comparative financial data across industry/country',
          'KPI measurement vs same-industry companies',
          'Follow-up consultation to interpret data'
        ]
      },
      'Profit Extraction / Remuneration Strategies': {
        short: 'Tax-efficient director remuneration planning',
        features: [
          'Optimal profit extraction tool',
          'Company vs personal tax optimization',
          'Salary vs dividend analysis'
        ]
      },
      '365 Alignment Programme': {
        short: 'Structured personal-business planning with AI-generated execution plans',
        features: [
          'Tiered diagnostics (Lite/Growth/Partner)',
          'AI-generated plan: outcomes, constraints, resources, risks',
          'Quarterly accountability reviews'
        ]
      }
    };
    return descriptions[serviceLine] || { short: 'Business growth service', features: [] };
  };

  const getServiceLineColor = (rank: number) => {
    if (rank <= 2) return 'bg-green-100 border-green-300 text-green-800';
    if (rank <= 5) return 'bg-blue-100 border-blue-300 text-blue-800';
    return 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getExperienceLabel = (level: number) => {
    const labels = ['None', 'Beginner', 'Basic', 'Intermediate', 'Proficient', 'Expert'];
    return labels[level] || 'None';
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                Service Line Preferences
              </CardTitle>
              <CardDescription className="text-gray-300 font-medium mt-2">
                {memberName ? `Manage ${memberName}'s service line interests` : 'Rank your interest in each service line to help with strategic planning'}
              </CardDescription>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instructions */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300 space-y-2">
                <p className="font-semibold text-blue-300">How to rank your preferences:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Drag to reorder</strong> - Your top interests should be at the top</li>
                  <li><strong>Experience level</strong> - Rate your current experience (0-5)</li>
                  <li><strong>Desired involvement</strong> - What % of your time would you like to spend?</li>
                  <li><strong>Notes</strong> - Add context about your interest or experience</li>
                </ul>
                <p className="text-xs text-gray-400 mt-3">
                  💡 This helps us match you to work you'll enjoy and excel at!
                </p>
              </div>
            </div>
          </div>

          {/* Rankings List */}
          <div className="space-y-3">
            {rankings.map((ranking, index) => (
              <div
                key={ranking.serviceLine}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  ${getServiceLineColor(ranking.rank)}
                  border-2 rounded-lg p-5 cursor-move transition-all
                  hover:shadow-lg hover:scale-[1.01]
                  ${draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <div className="flex-shrink-0 pt-1">
                    <GripVertical className="w-5 h-5 opacity-50" />
                  </div>

                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    <Badge 
                      variant="outline" 
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                        ${ranking.rank <= 2 ? 'bg-green-600 text-white border-green-700' : 
                          ranking.rank <= 5 ? 'bg-blue-600 text-white border-blue-700' : 
                          'bg-gray-600 text-white border-gray-700'}
                      `}
                    >
                      {ranking.rank}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-4">
                    {/* Service Line Title & Description */}
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getServiceLineIcon(ranking.serviceLine)}</span>
                        {ranking.serviceLine}
                      </h3>
                      <p className="text-sm opacity-80 mb-2">
                        {getServiceLineDescription(ranking.serviceLine).short}
                      </p>
                      <ul className="text-xs opacity-70 space-y-1 ml-4">
                        {getServiceLineDescription(ranking.serviceLine).features.map((feature, idx) => (
                          <li key={idx} className="list-disc">{feature}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Experience & Involvement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Experience Level */}
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">
                          Current Experience: {getExperienceLabel(ranking.experienceLevel)}
                        </Label>
                        <div className="flex items-center gap-3">
                          <Input
                            type="range"
                            min="0"
                            max="5"
                            value={ranking.experienceLevel}
                            onChange={(e) => handleExperienceChange(index, parseInt(e.target.value))}
                            className="flex-1 cursor-pointer"
                          />
                          <span className="text-sm font-bold w-8 text-center">
                            {ranking.experienceLevel}/5
                          </span>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {[0, 1, 2, 3, 4, 5].map(level => (
                            <div
                              key={level}
                              className={`
                                h-2 flex-1 rounded-full
                                ${level <= ranking.experienceLevel ? 'bg-green-500' : 'bg-gray-600'}
                              `}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Desired Involvement */}
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">
                          Desired Involvement: {ranking.desiredInvolvement}%
                        </Label>
                        <div className="flex items-center gap-3">
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={ranking.desiredInvolvement}
                            onChange={(e) => handleInvolvementChange(index, parseInt(e.target.value))}
                            className="flex-1 cursor-pointer"
                          />
                          <span className="text-sm font-bold w-12 text-center">
                            {ranking.desiredInvolvement}%
                          </span>
                        </div>
                        <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full transition-all"
                            style={{ width: `${ranking.desiredInvolvement}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">
                        Notes (optional)
                      </Label>
                      <Textarea
                        value={ranking.notes}
                        onChange={(e) => handleNotesChange(index, e.target.value)}
                        placeholder="Why are you interested? What experience do you have?"
                        className="bg-white/10 border-gray-600 text-gray-100 placeholder:text-gray-500 min-h-[60px]"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 bg-purple-900/30 border border-purple-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-300 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Your Top Preferences</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {rankings.slice(0, 3).map(ranking => (
                <Badge 
                  key={ranking.serviceLine}
                  variant="outline" 
                  className="bg-purple-600/20 border-purple-500 text-purple-200 py-1 px-3"
                >
                  {ranking.rank}. {ranking.serviceLine}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Total desired involvement: {rankings.reduce((sum, r) => sum + r.desiredInvolvement, 0)}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceLineInterestRanking;

