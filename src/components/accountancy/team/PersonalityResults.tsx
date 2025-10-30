/**
 * Personality Assessment Results Display
 * Shows OCEAN scores with radar chart, trait interpretations, and recommendations
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, Users, Target, Lightbulb, TrendingUp, 
  MessageSquare, Briefcase, Star, Download, Share2
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BigFiveProfile, getTraitInterpretation } from '@/lib/assessments/big-five-questions';

interface PersonalityResultsProps {
  profile: BigFiveProfile;
  varkData?: { primary_style: string; scores: Record<string, number> };
  teamMemberId: string;
  memberName?: string;
}

export const PersonalityResults: React.FC<PersonalityResultsProps> = ({ 
  profile, 
  varkData, 
  teamMemberId,
  memberName 
}) => {
  // Prepare radar chart data
  const radarData = [
    { 
      trait: 'Openness', 
      score: profile.traits.openness, 
      fullMark: 100,
      color: '#3b82f6' 
    },
    { 
      trait: 'Conscientiousness', 
      score: profile.traits.conscientiousness, 
      fullMark: 100,
      color: '#22c55e' 
    },
    { 
      trait: 'Extraversion', 
      score: profile.traits.extraversion, 
      fullMark: 100,
      color: '#a855f7' 
    },
    { 
      trait: 'Agreeableness', 
      score: profile.traits.agreeableness, 
      fullMark: 100,
      color: '#f97316' 
    },
    { 
      trait: 'Emotional\nStability', 
      score: profile.emotionalStability, 
      fullMark: 100,
      color: '#14b8a6' 
    }
  ];

  const getWorkStyleInsights = () => {
    const insights = [];
    
    if (profile.traits.openness > 70 && profile.traits.conscientiousness > 70) {
      insights.push({
        icon: <Lightbulb className="w-5 h-5 text-yellow-600" />,
        title: "Innovative Executor",
        description: "You combine creativity with strong execution - ideal for leading new initiatives and bringing fresh ideas to life."
      });
    }
    
    if (profile.traits.extraversion > 70 && profile.traits.agreeableness > 70) {
      insights.push({
        icon: <Users className="w-5 h-5 text-blue-600" />,
        title: "Natural Collaborator",
        description: "You excel at building relationships and fostering team cohesion. People enjoy working with you."
      });
    }
    
    if (profile.traits.conscientiousness > 70 && profile.emotionalStability > 70) {
      insights.push({
        icon: <Target className="w-5 h-5 text-green-600" />,
        title: "Reliable Performer",
        description: "You deliver consistent, high-quality results even under pressure. Teams depend on you."
      });
    }
    
    if (profile.traits.openness > 70 && profile.traits.extraversion < 40) {
      insights.push({
        icon: <Brain className="w-5 h-5 text-purple-600" />,
        title: "Thoughtful Innovator",
        description: "You bring deep, creative thinking to problems. You excel at developing sophisticated solutions."
      });
    }

    if (profile.traits.agreeableness < 40 && profile.traits.conscientiousness > 70) {
      insights.push({
        icon: <Star className="w-5 h-5 text-orange-600" />,
        title: "Quality Guardian",
        description: "You maintain high standards and aren't afraid to challenge subpar work. Essential for quality control."
      });
    }
    
    return insights.slice(0, 3); // Show top 3 insights
  };

  const getRecommendedRoles = () => {
    const roles = [];
    
    if (profile.traits.extraversion > 70 && profile.traits.agreeableness > 60) {
      roles.push({ role: "Client Relationship Manager", score: 90, icon: "👥" });
    }
    if (profile.traits.conscientiousness > 70) {
      roles.push({ role: "Project Manager", score: 85, icon: "📋" });
    }
    if (profile.traits.openness > 70) {
      roles.push({ role: "Innovation Lead", score: 88, icon: "💡" });
    }
    if (profile.traits.conscientiousness > 70 && profile.traits.agreeableness > 60) {
      roles.push({ role: "Team Coordinator", score: 82, icon: "🤝" });
    }
    if (profile.emotionalStability > 70 && profile.traits.conscientiousness > 60) {
      roles.push({ role: "Crisis Manager", score: 87, icon: "🚨" });
    }
    if (profile.traits.openness > 70 && profile.traits.conscientiousness > 60) {
      roles.push({ role: "Strategic Advisor", score: 84, icon: "🎯" });
    }
    
    return roles.sort((a, b) => b.score - a.score).slice(0, 4);
  };

  const getCombinedInsights = () => {
    if (!varkData) return null;

    const insights = [];

    if (profile.traits.extraversion > 60 && varkData.primary_style === 'auditory') {
      insights.push("💬 You learn best through discussion and verbal exchange - ideal for collaborative problem-solving.");
    }
    if (profile.traits.conscientiousness > 70 && varkData.primary_style === 'reading_writing') {
      insights.push("📝 You excel with detailed written procedures and comprehensive documentation.");
    }
    if (profile.traits.openness > 70 && varkData.primary_style === 'visual') {
      insights.push("🎨 You thrive with visual brainstorming tools like mind maps and diagrams.");
    }
    if (varkData.primary_style === 'kinesthetic') {
      insights.push("🛠️ You need hands-on experience and practical application to master new concepts.");
    }

    return insights;
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 border-2">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {memberName ? `${memberName}'s` : 'Your'} Personality Profile
              </h2>
              <p className="text-gray-700 font-medium mb-4">
                {profile.profile}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-600 text-white">
                  Work Style: {profile.work_style.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
                <Badge className="bg-purple-600 text-white">
                  Communication: {profile.communication_style.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
                {varkData && (
                  <Badge className="bg-green-600 text-white">
                    Learning: {varkData.primary_style.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                )}
              </div>
            </div>
            <Brain className="w-16 h-16 text-blue-600 flex-shrink-0 ml-4" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Personality Overview
            </CardTitle>
            <CardDescription>
              Your Big Five personality profile scores (0-100 scale)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="trait" 
                  tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
                />
                <PolarRadiusAxis 
                  domain={[0, 100]} 
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                />
                <Radar 
                  name="Your Profile" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6} 
                />
                <Tooltip 
                  content={({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border">
                        <p className="font-semibold">{payload[0].payload.trait}</p>
                        <p className="text-blue-600 font-bold">{payload[0].value}/100</p>
                      </div>
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Work Style Insights */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Your Work Style Strengths
            </CardTitle>
            <CardDescription className="text-gray-700">
              Based on your personality profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {getWorkStyleInsights().length > 0 ? (
              getWorkStyleInsights().map((insight, index) => (
                <div key={index} className="flex gap-3 p-4 rounded-lg bg-gray-50 border">
                  <div className="flex-shrink-0">{insight.icon}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-700">{insight.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-lg border">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Unique Profile</h4>
                <p className="text-sm text-gray-700">
                  Your personality profile is distinctive! Check the "Detailed Trait Analysis" section below for personalized insights about your work style strengths.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Trait Breakdown */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-gray-900">Detailed Trait Analysis</CardTitle>
          <CardDescription className="text-gray-700">
            Understanding your scores and their workplace implications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(profile.traits).map(([trait, score]) => {
              const interpretation = getTraitInterpretation(trait, score);
              const traitColors = {
                openness: 'bg-blue-100 text-blue-700 border-blue-300',
                conscientiousness: 'bg-green-100 text-green-700 border-green-300',
                extraversion: 'bg-purple-100 text-purple-700 border-purple-300',
                agreeableness: 'bg-orange-100 text-orange-700 border-orange-300',
                neuroticism: 'bg-teal-100 text-teal-700 border-teal-300'
              };

              return (
                <div key={trait} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-900 capitalize flex items-center gap-2">
                      {trait === 'neuroticism' ? 'Emotional Stability' : trait}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={traitColors[trait as keyof typeof traitColors]}
                    >
                      {trait === 'neuroticism' ? profile.emotionalStability : score}/100
                    </Badge>
                  </div>
                  <Progress 
                    value={trait === 'neuroticism' ? profile.emotionalStability : score} 
                    className="h-2" 
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      {interpretation.description}
                    </p>
                    <div className="bg-gray-50 rounded-md p-3 border-l-4 border-blue-500">
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        💼 Workplace Implications:
                      </p>
                      <p className="text-xs text-gray-600">
                        {interpretation.workplace_implications}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Roles */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Recommended Team Roles
          </CardTitle>
          <CardDescription className="text-gray-700">
            Roles where your personality profile naturally excels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getRecommendedRoles().map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-semibold text-gray-900">{item.role}</span>
                </div>
                <Badge className="bg-blue-600 text-white">
                  {item.score}% match
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Combined VARK + OCEAN Insights */}
      {varkData && getCombinedInsights() && (
        <Card className="border-2 bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Brain className="w-5 h-5 text-blue-600" />
              Combined Profile Insights
            </CardTitle>
            <CardDescription className="text-gray-700">
              How your learning style and personality work together
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getCombinedInsights()?.map((insight, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg bg-white border"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 flex-1">{insight}</p>
                </div>
              ))}

              <div className="bg-blue-100 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Optimal Working Conditions:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  {profile.traits.extraversion > 60 ? (
                    <li>• <strong>Environment:</strong> Collaborative spaces with regular team interaction</li>
                  ) : (
                    <li>• <strong>Environment:</strong> Quiet, focused workspace with minimal interruptions</li>
                  )}
                  {profile.traits.conscientiousness > 70 ? (
                    <li>• <strong>Structure:</strong> Clear processes, detailed planning, and organized workflows</li>
                  ) : (
                    <li>• <strong>Structure:</strong> Flexible approach with room for spontaneity</li>
                  )}
                  {profile.traits.agreeableness > 60 ? (
                    <li>• <strong>Feedback:</strong> Supportive, constructive, and relationship-focused</li>
                  ) : (
                    <li>• <strong>Feedback:</strong> Direct, objective, and results-oriented</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      <Card className="border-2 bg-gradient-to-r from-green-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="text-gray-900">Next Steps</CardTitle>
          <CardDescription className="text-gray-700">
            Making the most of your personality insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-900">Share with your manager</p>
                <p className="text-sm text-gray-600">
                  Discuss how your profile can inform project assignments and professional development
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-900">Explore your team composition</p>
                <p className="text-sm text-gray-600">
                  See how your profile complements your teammates and where you add unique value
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-900">Access personalized development resources</p>
                <p className="text-sm text-gray-600">
                  Get CPD recommendations tailored to your personality and learning style
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
              <Button variant="outline" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share Results
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalityResults;


