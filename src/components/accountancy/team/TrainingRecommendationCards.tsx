/**
 * Training Recommendation Cards
 * Displays AI-generated training recommendations with learning paths
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Zap,
  Target,
  Users,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  BookOpen,
  Hand,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { TrainingRecommendation, GroupTrainingOpportunity } from '@/services/ai/trainingRecommendations';

interface TrainingRecommendationCardsProps {
  topRecommendations: TrainingRecommendation[];
  quickWins: TrainingRecommendation[];
  strategicInvestments: TrainingRecommendation[];
  groupOpportunities: GroupTrainingOpportunity[];
  onGenerateLearningPath?: () => void;
  isGenerating?: boolean;
}

const TrainingRecommendationCards: React.FC<TrainingRecommendationCardsProps> = ({
  topRecommendations,
  quickWins,
  strategicInvestments,
  groupOpportunities,
  onGenerateLearningPath,
  isGenerating = false
}) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'quick-win': return 'bg-green-500/20 text-green-400 border-green-500/40';
      case 'strategic': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'group-opportunity': return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      default: return 'bg-gray-500/20 text-white font-medium border-gray-500/40';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Critical';
      case 'quick-win': return 'Quick Win';
      case 'strategic': return 'Strategic';
      case 'group-opportunity': return 'Group Training';
      default: return priority;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'video': return <Eye className="w-4 h-4" />;
      case 'course': return <BookOpen className="w-4 h-4" />;
      case 'practice': return <Hand className="w-4 h-4" />;
      case 'mentoring': return <Users className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const RecommendationCard = ({ rec, showDetails = false }: { rec: TrainingRecommendation; showDetails?: boolean }) => {
    const isExpanded = expandedCard === rec.id;

    return (
      <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getPriorityColor(rec.priority)} border`}>
                  {getPriorityLabel(rec.priority)}
                </Badge>
                <Badge variant="outline" className="text-xs text-white border-gray-500">
                  {rec.provider === 'internal' ? 'Internal' : 'External'}
                </Badge>
                <Badge variant="outline" className="text-xs text-white border-gray-500 flex items-center gap-1">
                  {getFormatIcon(rec.format)}
                  {rec.format}
                </Badge>
              </div>
              <CardTitle className="text-lg text-white font-bold">{rec.title}</CardTitle>
              <CardDescription className="mt-1 text-gray-100">{rec.description}</CardDescription>
            </div>
            <div className="ml-4 text-right">
              <div className="text-2xl font-bold text-white">{rec.matchScore}%</div>
              <div className="text-xs text-white font-medium">Match</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-400" />
              <div>
                <div className="font-bold text-white text-base">{rec.estimatedHours}h</div>
                <div className="text-xs text-white font-medium">Duration</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-400" />
              <div>
                <div className="font-bold text-white text-base">
                  {rec.estimatedCost === 0 ? 'Free' : `£${rec.estimatedCost}`}
                </div>
                <div className="text-xs text-white font-medium">Cost</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <div>
                <div className="font-bold text-white text-base">{rec.successProbability}%</div>
                <div className="text-xs text-white font-medium">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Success Probability Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white font-medium">Success Probability</span>
              <span className="text-white font-bold">{rec.successProbability}%</span>
            </div>
            <Progress 
              value={rec.successProbability} 
              className="h-2"
            />
          </div>

          {/* Learning Formats */}
          {rec.learningFormats && rec.learningFormats.length > 0 && (
            <div>
              <div className="text-sm font-bold text-white mb-2">Best for your learning style:</div>
              <div className="space-y-1">
                {rec.learningFormats.slice(0, isExpanded ? undefined : 2).map((format, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-white">
                    <CheckCircle className="w-3 h-3 text-green-400 mt-1 flex-shrink-0" />
                    <span>{format}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expanded Details */}
          {isExpanded && showDetails && (
            <div className="space-y-3 pt-3 border-t border-gray-700">
              <div>
                <div className="text-sm font-bold text-white mb-1">Why this recommendation:</div>
                <p className="text-sm text-white">{rec.rationale}</p>
              </div>
              <div>
                <div className="text-sm font-bold text-white mb-1">Expected outcome:</div>
                <p className="text-sm text-white">{rec.expectedOutcome}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">Provider:</span>
                <span className="text-sm text-white font-bold">{rec.providerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">Difficulty:</span>
                <Badge variant="outline" className="capitalize text-white border-gray-500">{rec.difficulty}</Badge>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleCard(rec.id)}
            className="bg-white text-gray-900 hover:bg-gray-100 hover:text-gray-900 font-semibold"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show Details
              </>
            )}
          </Button>
          {rec.url && (
            <Button variant="outline" size="sm" asChild className="bg-white text-gray-900 border-gray-300 hover:bg-blue-600 hover:text-white font-semibold">
              <a href={rec.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Course
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  const GroupOpportunityCard = ({ opportunity }: { opportunity: GroupTrainingOpportunity }) => {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white font-bold">
                <Users className="w-5 h-5" />
                {opportunity.skillName} - Team Workshop
              </CardTitle>
              <CardDescription className="mt-1 text-white font-medium">
                {opportunity.memberCount} team members need training
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                £{opportunity.costSavings}
              </div>
              <div className="text-xs text-white font-medium">Savings</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RecommendationCard rec={opportunity.recommendation} />
          <div className="mt-4 p-3 bg-green-900/20 rounded-lg border border-green-700">
            <div className="flex items-center gap-2 text-green-400 font-bold">
              <Zap className="w-4 h-4" />
              Cost-effective group training opportunity!
            </div>
            <div className="text-sm text-white font-medium mt-1">
              Save £{opportunity.costSavings} by training {opportunity.memberCount} members together
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Generate Learning Path Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            AI-Powered Training Recommendations
          </h3>
          <p className="text-white font-medium mt-1">
            Personalized recommendations based on skill gaps, learning style, and business priorities
          </p>
        </div>
        {onGenerateLearningPath && (
          <Button 
            onClick={onGenerateLearningPath}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Generate 6-Month Learning Path
              </>
            )}
          </Button>
        )}
      </div>

      {/* Quick Wins Section */}
      {quickWins.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h4 className="text-xl font-bold text-white">Quick Wins</h4>
            <Badge variant="outline" className="text-green-300 border-green-400 bg-green-950/50">
              High interest + Small gap
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickWins.map(rec => (
              <RecommendationCard key={rec.id} rec={rec} showDetails />
            ))}
          </div>
        </div>
      )}

      {/* Strategic Investments Section */}
      {strategicInvestments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-400" />
            <h4 className="text-xl font-bold text-white">Strategic Investments</h4>
            <Badge variant="outline" className="text-blue-300 border-blue-400 bg-blue-950/50">
              Critical skills
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategicInvestments.map(rec => (
              <RecommendationCard key={rec.id} rec={rec} showDetails />
            ))}
          </div>
        </div>
      )}

      {/* Top Recommendations Section */}
      {topRecommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h4 className="text-xl font-bold text-white">Top Recommendations</h4>
            <Badge variant="outline" className="text-gray-200 border-gray-400 bg-gray-800">{topRecommendations.length} suggestions</Badge>
          </div>
          <div className="space-y-4">
            {topRecommendations.map(rec => (
              <RecommendationCard key={rec.id} rec={rec} showDetails />
            ))}
          </div>
        </div>
      )}

      {/* Group Training Opportunities */}
      {groupOpportunities.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-400" />
            <h4 className="text-xl font-bold text-white">Group Training Opportunities</h4>
            <Badge variant="outline" className="text-purple-300 border-purple-400 bg-purple-950/50">
              Cost savings available
            </Badge>
          </div>
          <div className="space-y-4">
            {groupOpportunities.map((opp, idx) => (
              <GroupOpportunityCard key={idx} opportunity={opp} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {topRecommendations.length === 0 && quickWins.length === 0 && 
       strategicInvestments.length === 0 && groupOpportunities.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-100 font-medium mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Recommendations Available</h3>
            <p className="text-white font-medium">
              Complete skill assessments to generate personalized training recommendations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrainingRecommendationCards;

