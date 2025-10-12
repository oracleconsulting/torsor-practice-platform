/**
 * Skills Analysis Component
 * 
 * Identifies top performers and high-interest learners for:
 * - Internal mentoring programs
 * - CPD knowledge sharing
 * - Team expertise mapping
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  Award, 
  BookOpen, 
  Search,
  Star,
  Lightbulb,
  UserCheck
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Define types locally
interface Skill {
  id: string;
  name: string;
  requiredLevel?: number;
}

interface Assessment {
  skill: Skill;
  currentLevel: number;
  interestLevel?: number;
  notes?: string;
}

interface TeamMemberWithAssessments {
  id: string;
  name: string;
  email: string;
  role: string;
  assessments: Assessment[];
}

interface SkillCategory {
  id?: string;
  name: string;
  skills: Skill[];
}

interface SkillsAnalysisProps {
  teamMembers: TeamMemberWithAssessments[];
  skillCategories: SkillCategory[];
}

interface ExpertProfile {
  member: TeamMemberWithAssessments;
  expertiseAreas: {
    skillId: string;
    skillName: string;
    category: string;
    level: number;
  }[];
  averageLevel: number;
  expertSkillsCount: number;
}

interface LearnerProfile {
  member: TeamMemberWithAssessments;
  highInterestAreas: {
    skillId: string;
    skillName: string;
    category: string;
    currentLevel: number;
    interestLevel: number;
  }[];
  averageInterest: number;
}

interface MentoringMatch {
  expert: TeamMemberWithAssessments;
  learner: TeamMemberWithAssessments;
  matchedSkills: {
    skillName: string;
    category: string;
    expertLevel: number;
    learnerLevel: number;
    learnerInterest: number;
  }[];
  matchScore: number;
}

export default function SkillsAnalysis({ teamMembers, skillCategories }: SkillsAnalysisProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Create skill lookup map
  const skillsMap = useMemo(() => {
    const map = new Map<string, { name: string; category: string; requiredLevel?: number }>();
    if (!skillCategories || !Array.isArray(skillCategories)) return map;
    
    skillCategories.forEach(cat => {
      if (cat && cat.skills && Array.isArray(cat.skills)) {
        cat.skills.forEach(skill => {
          if (skill && skill.id) {
            map.set(skill.id, {
              name: skill.name,
              category: cat.name,
              requiredLevel: skill.requiredLevel
            });
          }
        });
      }
    });
    return map;
  }, [skillCategories]);

  // Identify Top Performers (Experts)
  const topPerformers = useMemo(() => {
    const experts: ExpertProfile[] = [];
    if (!teamMembers || !Array.isArray(teamMembers)) return experts;

    teamMembers.forEach(member => {
      // Defensive check: ensure assessments array exists
      if (!member || !member.assessments || !Array.isArray(member.assessments)) {
        return;
      }

      const expertiseAreas = member.assessments
        .filter(a => a && a.currentLevel >= 4) // Level 4-5 = Expert
        .map(a => ({
          skillId: a.skill.id,
          skillName: a.skill.name,
          category: skillsMap.get(a.skill.id)?.category || 'Unknown',
          level: a.currentLevel
        }));

      if (expertiseAreas.length > 0) {
        const avgLevel = expertiseAreas.reduce((sum, e) => sum + e.level, 0) / expertiseAreas.length;
        experts.push({
          member,
          expertiseAreas,
          averageLevel: avgLevel,
          expertSkillsCount: expertiseAreas.length
        });
      }
    });

    // Sort by number of expert skills, then by average level
    return experts.sort((a, b) => {
      if (b.expertSkillsCount !== a.expertSkillsCount) {
        return b.expertSkillsCount - a.expertSkillsCount;
      }
      return b.averageLevel - a.averageLevel;
    });
  }, [teamMembers, skillsMap]);

  // Identify High-Interest Learners
  const highInterestLearners = useMemo(() => {
    const learners: LearnerProfile[] = [];
    if (!teamMembers || !Array.isArray(teamMembers)) return learners;

    teamMembers.forEach(member => {
      // Defensive check: ensure assessments array exists
      if (!member || !member.assessments || !Array.isArray(member.assessments)) {
        return;
      }

      const highInterestAreas = member.assessments
        .filter(a => a && (a.interestLevel || 0) >= 4 && a.currentLevel < 4) // High interest + not expert yet
        .map(a => ({
          skillId: a.skill.id,
          skillName: a.skill.name,
          category: skillsMap.get(a.skill.id)?.category || 'Unknown',
          currentLevel: a.currentLevel,
          interestLevel: a.interestLevel || 0
        }));

      if (highInterestAreas.length > 0) {
        const avgInterest = highInterestAreas.reduce((sum, h) => sum + h.interestLevel, 0) / highInterestAreas.length;
        learners.push({
          member,
          highInterestAreas,
          averageInterest: avgInterest
        });
      }
    });

    // Sort by average interest, then by number of high-interest skills
    return learners.sort((a, b) => {
      if (b.averageInterest !== a.averageInterest) {
        return b.averageInterest - a.averageInterest;
      }
      return b.highInterestAreas.length - a.highInterestAreas.length;
    });
  }, [teamMembers, skillsMap]);

  // Generate Mentoring Matches
  const mentoringMatches = useMemo(() => {
    const matches: MentoringMatch[] = [];

    highInterestLearners.forEach(learner => {
      topPerformers.forEach(expert => {
        // Don't match someone with themselves
        if (learner.member.id === expert.member.id) return;

        // Find skills where expert is 4-5 and learner has high interest
        const matchedSkills = learner.highInterestAreas
          .map(learnerSkill => {
            const expertSkill = expert.expertiseAreas.find(e => e.skillId === learnerSkill.skillId);
            if (expertSkill && expertSkill.level >= 4) {
              return {
                skillName: learnerSkill.skillName,
                category: learnerSkill.category,
                expertLevel: expertSkill.level,
                learnerLevel: learnerSkill.currentLevel,
                learnerInterest: learnerSkill.interestLevel
              };
            }
            return null;
          })
          .filter(Boolean) as MentoringMatch['matchedSkills'];

        if (matchedSkills.length > 0) {
          // Calculate match score: number of matched skills × average interest × average expert level
          const avgInterest = matchedSkills.reduce((sum, s) => sum + s.learnerInterest, 0) / matchedSkills.length;
          const avgExpertLevel = matchedSkills.reduce((sum, s) => sum + s.expertLevel, 0) / matchedSkills.length;
          const matchScore = matchedSkills.length * avgInterest * avgExpertLevel;

          matches.push({
            expert: expert.member,
            learner: learner.member,
            matchedSkills,
            matchScore
          });
        }
      });
    });

    // Sort by match score
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }, [highInterestLearners, topPerformers]);

  // Category-based expertise mapping
  const categoryExperts = useMemo(() => {
    const categoryMap = new Map<string, ExpertProfile[]>();

    skillCategories.forEach(cat => {
      const expertsInCategory: ExpertProfile[] = [];

      topPerformers.forEach(expert => {
        const categorySkills = expert.expertiseAreas.filter(e => e.category === cat.name);
        if (categorySkills.length > 0) {
          expertsInCategory.push({
            ...expert,
            expertiseAreas: categorySkills,
            expertSkillsCount: categorySkills.length
          });
        }
      });

      if (expertsInCategory.length > 0) {
        categoryMap.set(cat.name, expertsInCategory.sort((a, b) => b.expertSkillsCount - a.expertSkillsCount));
      }
    });

    return categoryMap;
  }, [topPerformers, skillCategories]);

  // Filter functions
  const filteredExperts = useMemo(() => {
    if (!topPerformers || topPerformers.length === 0) return [];
    
    return topPerformers.filter(expert => {
      if (!expert || !expert.member || !expert.expertiseAreas) return false;
      
      const matchesSearch = expert.member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            expert.expertiseAreas.some(e => e?.skillName?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || 
                              expert.expertiseAreas.some(e => e?.category === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [topPerformers, searchTerm, selectedCategory]);

  const filteredLearners = useMemo(() => {
    if (!highInterestLearners || highInterestLearners.length === 0) return [];
    
    return highInterestLearners.filter(learner => {
      if (!learner || !learner.member || !learner.highInterestAreas) return false;
      
      const matchesSearch = learner.member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            learner.highInterestAreas.some(h => h?.skillName?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || 
                              learner.highInterestAreas.some(h => h?.category === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [highInterestLearners, searchTerm, selectedCategory]);

  const filteredMatches = useMemo(() => {
    if (!mentoringMatches || mentoringMatches.length === 0) return [];
    
    return mentoringMatches.filter(match => {
      if (!match || !match.expert || !match.learner || !match.matchedSkills) return false;
      
      const matchesSearch = match.expert.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            match.learner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            match.matchedSkills.some(s => s?.skillName?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || 
                              match.matchedSkills.some(s => s?.category === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [mentoringMatches, searchTerm, selectedCategory]);

  // Show message if no data
  if (!teamMembers || teamMembers.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#000000' }}>Skills Analysis</h2>
        <p className="text-lg text-gray-100 font-medium">No team members found. Please add team members and complete assessments first.</p>
      </div>
    );
  }

  if (!skillCategories || skillCategories.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#000000' }}>Skills Analysis</h2>
        <p className="text-lg text-gray-100 font-medium">No skill categories found. Please configure skills first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>Skills Analysis</h2>
        <p className="text-lg" style={{ color: '#000000' }}>
          Identify team experts, eager learners, and mentoring opportunities for internal CPD
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000' }}>Top Performers</p>
                <p className="text-3xl font-bold mt-1" style={{ color: '#000000' }}>{topPerformers.length}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#000000' }}>Team members with 4+ expert skills</p>
              </div>
              <Award className="w-12 h-12" style={{ color: '#000000', opacity: 0.2 }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000' }}>Eager Learners</p>
                <p className="text-3xl font-bold mt-1" style={{ color: '#000000' }}>{highInterestLearners.length}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#000000' }}>Team members with high-interest areas</p>
              </div>
              <Lightbulb className="w-12 h-12" style={{ color: '#000000', opacity: 0.2 }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000' }}>Mentoring Matches</p>
                <p className="text-3xl font-bold mt-1" style={{ color: '#000000' }}>{mentoringMatches.length}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#000000' }}>Potential mentor-learner pairs</p>
              </div>
              <UserCheck className="w-12 h-12" style={{ color: '#000000', opacity: 0.2 }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white font-medium w-4 h-4" />
                <Input
                  placeholder="Search by name or skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All Categories</option>
              {skillCategories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Accordion Sections */}
      <Accordion type="multiple" defaultValue={['experts', 'learners', 'mentoring']} className="space-y-4">
        {/* Top Performers / Experts */}
        <AccordionItem value="experts" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-green-600" />
              <div className="text-left">
                <h3 className="text-xl font-bold" style={{ color: '#000000' }}>
                  🏆 Top Performers - Team Experts
                </h3>
                <p className="text-sm text-gray-100 font-medium mt-1">
                  {filteredExperts.length} team members with advanced expertise (Level 4-5)
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-4 mt-4">
              {filteredExperts.length === 0 ? (
                <p className="text-gray-100 font-medium text-center py-8">No experts found matching your filters</p>
              ) : (
                filteredExperts.map(expert => (
                  <Card key={expert.member.id} className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#000000' }}>
                            {expert.member.name}
                            <Badge variant="default" className="bg-green-600">
                              {expert.expertSkillsCount} Expert Skills
                            </Badge>
                          </CardTitle>
                          <CardDescription style={{ color: '#000000' }}>
                            {expert.member.role} • Avg Level: {expert.averageLevel.toFixed(1)}/5
                          </CardDescription>
                        </div>
                        <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold mb-2" style={{ color: '#000000' }}>Areas of Expertise:</p>
                        <div className="flex flex-wrap gap-2">
                          {expert.expertiseAreas.map(skill => (
                            <Badge key={skill.skillId} variant="outline" className="bg-green-50">
                              {skill.skillName}
                              <span className="ml-1 font-bold text-green-700">{skill.level}/5</span>
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-semibold text-green-900 mb-1">💡 Recommendation:</p>
                          <p className="text-sm text-green-800">
                            Excellent candidate for internal mentoring, lunch-and-learns, or knowledge documentation
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* High-Interest Learners */}
        <AccordionItem value="learners" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-6 h-6 text-blue-600" />
              <div className="text-left">
                <h3 className="text-xl font-bold" style={{ color: '#000000' }}>
                  💡 Eager Learners - High-Interest Team Members
                </h3>
                <p className="text-sm text-gray-100 font-medium mt-1">
                  {filteredLearners.length} team members with strong interest in developing skills
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-4 mt-4">
              {filteredLearners.length === 0 ? (
                <p className="text-gray-100 font-medium text-center py-8">No learners found matching your filters</p>
              ) : (
                filteredLearners.map(learner => (
                  <Card key={learner.member.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#000000' }}>
                            {learner.member.name}
                            <Badge variant="default" className="bg-blue-600">
                              {learner.highInterestAreas.length} High-Interest Skills
                            </Badge>
                          </CardTitle>
                          <CardDescription style={{ color: '#000000' }}>
                            {learner.member.role} • Avg Interest: {learner.averageInterest.toFixed(1)}/5
                          </CardDescription>
                        </div>
                        <TrendingUp className="w-8 h-8 text-blue-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold mb-2" style={{ color: '#000000' }}>Wants to Develop:</p>
                        <div className="space-y-2">
                          {learner.highInterestAreas.map(skill => (
                            <div key={skill.skillId} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                              <span className="text-sm font-medium" style={{ color: '#000000' }}>{skill.skillName}</span>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="bg-white">
                                  Current: {skill.currentLevel}/5
                                </Badge>
                                <Badge variant="default" className="bg-blue-600">
                                  Interest: {skill.interestLevel}/5
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-semibold text-blue-900 mb-1">💡 Recommendation:</p>
                          <p className="text-sm text-blue-800">
                            High motivation = great ROI on training. Pair with mentors or assign to relevant projects
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Mentoring Matches */}
        <AccordionItem value="mentoring" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-purple-600" />
              <div className="text-left">
                <h3 className="text-xl font-bold" style={{ color: '#000000' }}>
                  🤝 Suggested Mentoring Pairs
                </h3>
                <p className="text-sm text-gray-100 font-medium mt-1">
                  {filteredMatches.length} optimal expert-learner pairings for internal CPD
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-4 mt-4">
              {filteredMatches.length === 0 ? (
                <p className="text-gray-100 font-medium text-center py-8">No matches found matching your filters</p>
              ) : (
                filteredMatches.slice(0, 20).map((match, index) => (
                  <Card key={`${match.expert.id}-${match.learner.id}`} className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#000000' }}>
                            <span className="font-semibold text-green-700">{match.expert.name}</span>
                            <span className="text-white font-medium">→</span>
                            <span className="font-semibold text-blue-700">{match.learner.name}</span>
                          </CardTitle>
                          <CardDescription style={{ color: '#000000' }}>
                            {match.matchedSkills.length} matched skills • 
                            Match Score: {match.matchScore.toFixed(1)}
                          </CardDescription>
                        </div>
                        <Badge variant="default" className="bg-purple-600">
                          #{index + 1} Match
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold mb-2" style={{ color: '#000000' }}>Matched Skills:</p>
                          <div className="space-y-2">
                            {match.matchedSkills.map(skill => (
                              <div key={skill.skillName} className="flex justify-between items-center p-2 bg-purple-50 rounded">
                                <span className="text-sm font-medium" style={{ color: '#000000' }}>{skill.skillName}</span>
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                    Expert: {skill.expertLevel}/5
                                  </Badge>
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                    Learner: {skill.learnerLevel}/5
                                  </Badge>
                                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                                    Interest: {skill.learnerInterest}/5
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-sm font-semibold text-purple-900 mb-2">🚀 Action Plan:</p>
                          <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                            <li>Schedule monthly 1-on-1 mentoring sessions</li>
                            <li>Pair on projects requiring {match.matchedSkills[0].skillName}</li>
                            <li>Knowledge transfer via shadowing or code reviews</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Category Expertise Map */}
        <AccordionItem value="category-map" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-orange-600" />
              <div className="text-left">
                <h3 className="text-xl font-bold" style={{ color: '#000000' }}>
                  📚 Expertise by Category
                </h3>
                <p className="text-sm text-gray-100 font-medium mt-1">
                  Team experts organized by skill category
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {Array.from(categoryExperts.entries()).map(([category, experts]) => (
                <Card key={category} className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg" style={{ color: '#000000' }}>{category}</CardTitle>
                    <CardDescription>{experts.length} expert(s)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {experts.map(expert => (
                        <div key={expert.member.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                          <span className="text-sm font-medium" style={{ color: '#000000' }}>
                            {expert.member.name}
                          </span>
                          <Badge variant="outline" className="bg-white">
                            {expert.expertSkillsCount} skills
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

