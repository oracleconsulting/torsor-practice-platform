import React, { useState, useEffect } from 'react';
import { 
  Users, AlertCircle, Award, Brain, Briefcase, Download, Settings, ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

// Import new components
import SkillsMatrix from '@/components/accountancy/team/SkillsMatrix';
import SkillsAssessment from '@/components/accountancy/team/SkillsAssessment';
import GapAnalysis from '@/components/accountancy/team/GapAnalysis';
import DevelopmentPlanning from '@/components/accountancy/team/DevelopmentPlanning';
import TeamMetrics from '@/components/accountancy/team/TeamMetrics';

// Direct Dialog components to avoid wrapper issues
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = DialogPrimitive.Overlay;
const DialogContent = ({ className, children, ...props }: any) => (
  <DialogPortal>
    <DialogOverlay className="fixed inset-0 z-50 bg-black/80" />
    <DialogPrimitive.Content
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-6xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-8 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-y-auto",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
);
const DialogHeader = ({ className, ...props }: any) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  skills: Skill[];
}

interface Skill {
  id: string;
  name: string;
  description: string;
  requiredLevel: number; // 1-5
  category: string;
}

interface TeamMemberSkill {
  memberId: string;
  skillId: string;
  currentLevel: number; // 1-5
  targetLevel: number;
  lastAssessed: Date;
  certifications?: string[];
  notes?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  skills: TeamMemberSkill[];
  overallScore?: number;
}

interface TrainingRecommendation {
  skillId: string;
  skillName: string;
  priority: 'high' | 'medium' | 'low';
  trainingType: string;
  provider: string;
  duration: string;
  cost?: number;
}

const AdvisorySkillsPage: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedCategory] = useState<string>('all');
  const [filterRole] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  // New state for advanced features
  const [activeTab, setActiveTab] = useState('matrix');
  const [assessmentMode, setAssessmentMode] = useState<'view' | 'assess'>('view');
  const [selectedMemberForAssessment] = useState<TeamMember | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Try to fetch real data from Supabase first
      try {
        const { supabase } = await import('@/lib/supabase/client');
        
        // Fetch ALL skills from database first
        const { data: allSkills, error: skillsError } = await supabase
          .from('skills')
          .select('*')
          .order('category', { ascending: true });
        
        if (skillsError) {
          console.error('Failed to fetch skills:', skillsError);
        }
        
        console.log('Found', allSkills?.length || 0, 'skills in database');
        
        // Fetch skill assessments with practice member info
        const { data: assessments, error } = await supabase
          .from('skill_assessments')
          .select(`
            *,
            practice_member:team_member_id (
              id,
              user_id,
              name,
              email,
              role
            ),
            skill:skill_id (
              id,
              name,
              category,
              description,
              required_level
            )
          `);
          
        if (error) throw error;
        
        if (assessments && assessments.length > 0) {
          console.log('Found', assessments.length, 'skill assessments from database');
          
          // Build team members from assessments
          const memberMap = new Map<string, any>();
          
          assessments.forEach((assessment: any) => {
            const memberId = assessment.team_member_id;
            if (!memberMap.has(memberId)) {
              // Get real member data from the database
              const name = assessment.practice_member?.name || 'Team Member';
              const role = assessment.practice_member?.role || 'Member';
              const email = assessment.practice_member?.email || `${name.toLowerCase().replace(' ', '.')}@practice.com`;
              
              memberMap.set(memberId, {
                id: memberId,
                name,
                role,
                email,
                department: 'Advisory',
                skills: []
              });
            }
            
            const member = memberMap.get(memberId);
            member.skills.push({
              memberId: memberId,
              skillId: assessment.skill_id,
              currentLevel: assessment.current_level || 0,
              interestLevel: assessment.interest_level || 3,
              targetLevel: (assessment.current_level || 0) + 1,
              lastAssessed: new Date(assessment.assessed_at),
              certifications: assessment.certifications || [],
              notes: assessment.notes,
              yearsExperience: assessment.years_experience
            });
          });
          
          const members = Array.from(memberMap.values());
          
          if (members.length > 0) {
            setTeamMembers(members);
            
            // Build skill categories from real database skills
            if (allSkills && allSkills.length > 0) {
              const categoryMap = new Map<string, any>();
              
              allSkills.forEach((skill: any) => {
                const category = skill.category || 'uncategorized';
                if (!categoryMap.has(category)) {
                  categoryMap.set(category, {
                    id: category,
                    name: category.split('-').map((word: string) => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' '),
                    description: `${category} skills`,
                    icon: Brain,
                    skills: []
                  });
                }
                
                categoryMap.get(category).skills.push({
                  id: skill.id,
                  name: skill.name,
                  description: skill.description || '',
                  requiredLevel: skill.required_level || 3,
                  category: category
                });
              });
              
              setSkillCategories(Array.from(categoryMap.values()));
              console.log('✅ Loaded real data:', members.length, 'members,', allSkills.length, 'skills');
            } else {
              setSkillCategories(getMockSkillCategories());
            }
            return;
          }
        }
      } catch (dbError) {
        console.error('Failed to fetch from database:', dbError);
      }
      
      // If no data, show empty state (no mock fallback)
      if (teamMembers.length === 0) {
        setSkillCategories(getMockSkillCategories());
        console.log('📭 No team members found - use Team Invitations to add your team');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockSkillCategories = (): SkillCategory[] => {
    return [
      {
        id: 'technical-accounting-audit',
        name: 'Technical Accounting & Audit',
        description: 'Core technical accounting, audit, and tax skills',
        icon: Brain,
        skills: [
          { id: 's1', name: 'Financial Reporting (UK GAAP)', description: 'Expertise in UK Generally Accepted Accounting Principles', requiredLevel: 4, category: 'technical-accounting-audit' },
          { id: 's2', name: 'Financial Reporting (IFRS)', description: 'International Financial Reporting Standards knowledge', requiredLevel: 3, category: 'technical-accounting-audit' },
          { id: 's3', name: 'Audit Planning & Execution', description: 'Comprehensive audit methodology and procedures', requiredLevel: 4, category: 'technical-accounting-audit' },
          { id: 's4', name: 'Risk Assessment & Testing', description: 'Identification and evaluation of financial risks', requiredLevel: 4, category: 'technical-accounting-audit' },
          { id: 's5', name: 'Corporate Tax Planning', description: 'Strategic corporate tax optimization and compliance', requiredLevel: 4, category: 'technical-accounting-audit' },
          { id: 's6', name: 'Personal Tax Advisory', description: 'Individual tax planning and compliance', requiredLevel: 3, category: 'technical-accounting-audit' },
          { id: 's7', name: 'VAT & Indirect Taxes', description: 'Value Added Tax compliance and planning', requiredLevel: 3, category: 'technical-accounting-audit' },
          { id: 's8', name: 'International Tax', description: 'Cross-border tax planning and compliance', requiredLevel: 3, category: 'technical-accounting-audit' },
          { id: 's9', name: 'Transfer Pricing', description: 'Intercompany pricing policies and documentation', requiredLevel: 3, category: 'technical-accounting-audit' },
          { id: 's10', name: 'Consolidated Accounts', description: 'Group accounting and consolidation procedures', requiredLevel: 4, category: 'technical-accounting-audit' }
        ]
      },
      {
        id: 'digital-technology',
        name: 'Digital & Technology',
        description: 'Digital tools, software, and technology skills',
        icon: Award,
        skills: [
          { id: 's11', name: 'Cloud Accounting Software (Xero)', description: 'Expert proficiency in Xero platform', requiredLevel: 3, category: 'digital-technology' },
          { id: 's12', name: 'Cloud Accounting Software (QuickBooks)', description: 'QuickBooks Online and Enterprise solutions', requiredLevel: 3, category: 'digital-technology' },
          { id: 's13', name: 'Cloud Accounting Software (Sage)', description: 'Sage platform expertise', requiredLevel: 3, category: 'digital-technology' },
          { id: 's14', name: 'Data Analytics & Visualization', description: 'Data analysis and business intelligence', requiredLevel: 3, category: 'digital-technology' },
          { id: 's15', name: 'Process Automation (RPA)', description: 'Robotic Process Automation implementation', requiredLevel: 2, category: 'digital-technology' },
          { id: 's16', name: 'AI & Machine Learning Applications', description: 'Artificial intelligence tools for accounting', requiredLevel: 2, category: 'digital-technology' },
          { id: 's17', name: 'Cybersecurity Awareness', description: 'Information security best practices', requiredLevel: 3, category: 'digital-technology' },
          { id: 's18', name: 'Excel Advanced Functions', description: 'Advanced Excel features and macros', requiredLevel: 4, category: 'digital-technology' },
          { id: 's19', name: 'Power BI/Tableau', description: 'Business intelligence platforms', requiredLevel: 2, category: 'digital-technology' },
          { id: 's20', name: 'Python/R for Accounting', description: 'Programming for data analysis', requiredLevel: 2, category: 'digital-technology' }
        ]
      },
      {
        id: 'advisory-consulting',
        name: 'Advisory & Consulting',
        description: 'Business advisory and consulting capabilities',
        icon: Briefcase,
        skills: [
          { id: 's21', name: 'Business Valuation', description: 'Company valuation methodologies', requiredLevel: 3, category: 'advisory-consulting' },
          { id: 's22', name: 'M&A Due Diligence', description: 'Merger and acquisition analysis', requiredLevel: 3, category: 'advisory-consulting' },
          { id: 's23', name: 'Financial Modelling', description: 'Advanced financial modeling and analysis', requiredLevel: 4, category: 'advisory-consulting' },
          { id: 's24', name: 'Cash Flow Forecasting', description: 'Cash flow analysis and liquidity planning', requiredLevel: 4, category: 'advisory-consulting' },
          { id: 's25', name: 'Strategic Business Planning', description: 'Strategic planning and business case development', requiredLevel: 3, category: 'advisory-consulting' },
          { id: 's26', name: 'Succession Planning', description: 'Business succession strategies', requiredLevel: 3, category: 'advisory-consulting' },
          { id: 's27', name: 'Turnaround & Restructuring', description: 'Distressed business advisory', requiredLevel: 2, category: 'advisory-consulting' },
          { id: 's28', name: 'ESG Reporting & Advisory', description: 'Environmental, Social, and Governance reporting', requiredLevel: 2, category: 'advisory-consulting' }
        ]
      },
      {
        id: 'sector-specialisation',
        name: 'Sector Specialisation',
        description: 'Industry-specific knowledge and expertise',
        icon: Users,
        skills: [
          { id: 's29', name: 'Technology & SaaS', description: 'Software-as-a-Service accounting expertise', requiredLevel: 3, category: 'sector-specialisation' },
          { id: 's30', name: 'Real Estate & Construction', description: 'Property accounting and construction contracts', requiredLevel: 3, category: 'sector-specialisation' },
          { id: 's31', name: 'Healthcare & Life Sciences', description: 'Healthcare sector accounting and compliance', requiredLevel: 2, category: 'sector-specialisation' },
          { id: 's32', name: 'Financial Services', description: 'Banking and investment management accounting', requiredLevel: 3, category: 'sector-specialisation' },
          { id: 's33', name: 'Manufacturing & Distribution', description: 'Manufacturing accounting and inventory management', requiredLevel: 3, category: 'sector-specialisation' },
          { id: 's34', name: 'Retail & E-commerce', description: 'Retail accounting and e-commerce platforms', requiredLevel: 3, category: 'sector-specialisation' },
          { id: 's35', name: 'Non-Profit & Charities', description: 'Charity accounting and SORP compliance', requiredLevel: 3, category: 'sector-specialisation' },
          { id: 's36', name: 'Professional Services', description: 'Professional services accounting and partnerships', requiredLevel: 4, category: 'sector-specialisation' }
        ]
      },
      {
        id: 'regulatory-compliance',
        name: 'Regulatory & Compliance',
        description: 'Regulatory knowledge and compliance procedures',
        icon: Brain,
        skills: [
          { id: 's37', name: 'FCA Regulations', description: 'Financial Conduct Authority rules and compliance', requiredLevel: 3, category: 'regulatory-compliance' },
          { id: 's38', name: 'AML/KYC Procedures', description: 'Anti-Money Laundering and KYC procedures', requiredLevel: 4, category: 'regulatory-compliance' },
          { id: 's39', name: 'GDPR & Data Protection', description: 'Data protection regulation compliance', requiredLevel: 3, category: 'regulatory-compliance' },
          { id: 's40', name: 'Companies House Filings', description: 'Company registration and statutory filings', requiredLevel: 4, category: 'regulatory-compliance' },
          { id: 's41', name: 'SRA Accounts Rules', description: 'Solicitors Regulation Authority accounting rules', requiredLevel: 2, category: 'regulatory-compliance' },
          { id: 's42', name: 'Charity Commission Reporting', description: 'Charity Commission requirements and governance', requiredLevel: 3, category: 'regulatory-compliance' },
          { id: 's43', name: 'Pension Regulations', description: 'Pension scheme accounting and compliance', requiredLevel: 3, category: 'regulatory-compliance' }
        ]
      },
      {
        id: 'client-business-development',
        name: 'Client & Business Development',
        description: 'Client relationship and business growth skills',
        icon: Users,
        skills: [
          { id: 's44', name: 'Client Relationship Management', description: 'Building and maintaining client relationships', requiredLevel: 4, category: 'client-business-development' },
          { id: 's45', name: 'New Business Development', description: 'Prospecting and lead generation strategies', requiredLevel: 3, category: 'client-business-development' },
          { id: 's46', name: 'Proposal Writing & Pitching', description: 'Professional proposal development and presentations', requiredLevel: 3, category: 'client-business-development' },
          { id: 's47', name: 'Cross-Selling Services', description: 'Identifying additional service opportunities', requiredLevel: 3, category: 'client-business-development' },
          { id: 's48', name: 'Client Onboarding', description: 'New client setup and engagement processes', requiredLevel: 4, category: 'client-business-development' },
          { id: 's49', name: 'Fee Negotiation', description: 'Pricing strategies and value-based pricing', requiredLevel: 3, category: 'client-business-development' },
          { id: 's50', name: 'Client Retention Strategies', description: 'Client satisfaction and retention programs', requiredLevel: 4, category: 'client-business-development' }
        ]
      },
      {
        id: 'leadership-management',
        name: 'Leadership & Management',
        description: 'Leadership, management, and team development skills',
        icon: Briefcase,
        skills: [
          { id: 's51', name: 'Team Leadership', description: 'Leading teams and performance management', requiredLevel: 3, category: 'leadership-management' },
          { id: 's52', name: 'Performance Management', description: 'Employee performance evaluation and development', requiredLevel: 3, category: 'leadership-management' },
          { id: 's53', name: 'Coaching & Mentoring', description: 'Coaching skills and talent development', requiredLevel: 3, category: 'leadership-management' },
          { id: 's54', name: 'Project Management', description: 'Project planning, execution, and delivery', requiredLevel: 3, category: 'leadership-management' },
          { id: 's55', name: 'Change Management', description: 'Managing organizational change and adoption', requiredLevel: 3, category: 'leadership-management' },
          { id: 's56', name: 'Strategic Thinking', description: 'Strategic planning and vision development', requiredLevel: 4, category: 'leadership-management' },
          { id: 's57', name: 'Decision Making', description: 'Decision-making processes and judgment', requiredLevel: 4, category: 'leadership-management' },
          { id: 's58', name: 'Delegation & Empowerment', description: 'Delegation skills and team development', requiredLevel: 3, category: 'leadership-management' }
        ]
      },
      {
        id: 'soft-skills-communication',
        name: 'Soft Skills & Communication',
        description: 'Communication, interpersonal, and professional skills',
        icon: Users,
        skills: [
          { id: 's59', name: 'Written Communication', description: 'Professional writing and documentation skills', requiredLevel: 4, category: 'soft-skills-communication' },
          { id: 's60', name: 'Presentation Skills', description: 'Public speaking and presentation design', requiredLevel: 3, category: 'soft-skills-communication' },
          { id: 's61', name: 'Active Listening', description: 'Listening skills and effective communication', requiredLevel: 4, category: 'soft-skills-communication' },
          { id: 's62', name: 'Emotional Intelligence', description: 'Self-awareness, empathy, and interpersonal skills', requiredLevel: 3, category: 'soft-skills-communication' },
          { id: 's63', name: 'Problem Solving', description: 'Analytical thinking and solution development', requiredLevel: 4, category: 'soft-skills-communication' },
          { id: 's64', name: 'Critical Thinking', description: 'Logical analysis and reasoned judgment', requiredLevel: 4, category: 'soft-skills-communication' },
          { id: 's65', name: 'Time Management', description: 'Prioritization and productivity optimization', requiredLevel: 4, category: 'soft-skills-communication' },
          { id: 's66', name: 'Adaptability', description: 'Flexibility and learning agility', requiredLevel: 3, category: 'soft-skills-communication' },
          { id: 's67', name: 'Collaboration', description: 'Teamwork and collaborative problem-solving', requiredLevel: 4, category: 'soft-skills-communication' },
          { id: 's68', name: 'Professional Skepticism', description: 'Critical evaluation and professional judgment', requiredLevel: 4, category: 'soft-skills-communication' }
        ]
      }
    ];
  };

  // Mock team members removed - now only shows real database data

  // const getSkillGaps = (member: TeamMember): number => {
  //   const gaps = member.skills.filter(s => s.currentLevel < s.targetLevel).length;
  //   return gaps;
  // };

  const getTrainingRecommendations = (member: TeamMember): TrainingRecommendation[] => {
    const recommendations: TrainingRecommendation[] = [];
    
    member.skills.forEach(skill => {
      if (skill.currentLevel < skill.targetLevel) {
        const gap = skill.targetLevel - skill.currentLevel;
        const skillInfo = skillCategories
          .flatMap(cat => cat.skills)
          .find(s => s.id === skill.skillId);
        
        if (skillInfo) {
          recommendations.push({
            skillId: skill.skillId,
            skillName: skillInfo.name,
            priority: gap >= 2 ? 'high' : gap === 1 ? 'medium' : 'low',
            trainingType: gap >= 2 ? 'Intensive Course' : 'Workshop',
            provider: 'PRAXIS Academy',
            duration: gap >= 2 ? '5 days' : '2 days',
            cost: gap >= 2 ? 2500 : 1000
          });
        }
      }
    });
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const getRadarChartData = (member: TeamMember) => {
    const categories = skillCategories.map(cat => cat.name);
    const currentData = skillCategories.map(cat => {
      const categorySkills = member.skills.filter(s => 
        cat.skills.some(skill => skill.id === s.skillId)
      );
      if (categorySkills.length === 0) return 0;
      return (categorySkills.reduce((sum, s) => sum + s.currentLevel, 0) / categorySkills.length) * 20;
    });
    const targetData = skillCategories.map(cat => {
      const categorySkills = member.skills.filter(s => 
        cat.skills.some(skill => skill.id === s.skillId)
      );
      if (categorySkills.length === 0) return 0;
      return (categorySkills.reduce((sum, s) => sum + s.targetLevel, 0) / categorySkills.length) * 20;
    });

    return {
      labels: categories,
      datasets: [
        {
          label: 'Current Level',
          data: currentData,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
        {
          label: 'Target Level',
          data: targetData,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
          borderDash: [5, 5]
        }
      ]
    };
  };

  // Unused function - keeping for potential future use
  // const renderTeamMemberCard = (member: TeamMember) => {
  //   const gaps = getSkillGaps(member);
  //   const recommendations = getTrainingRecommendations(member);
  //   
  //   return (
  //     <Card 
  //       key={member.id} 
  //       className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
  //       onClick={() => setSelectedMember(member)}
  //     >
  //       <CardHeader>
  //         <div className="flex items-start justify-between">
  //           <div className="flex items-center gap-3">
  //             <Avatar>
  //               <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
  //             </Avatar>
  //             <div>
  //               <CardTitle className="text-lg text-white">{member.name}</CardTitle>
  //               <CardDescription>{member.role} • {member.department}</CardDescription>
  //             </div>
  //           </div>
  //           <Badge variant={member.overallScore >= 80 ? 'default' : 
  //                          member.overallScore >= 60 ? 'secondary' : 'destructive'}>
  //             {member.overallScore}%
  //           </Badge>
  //         </div>
  //       </CardHeader>
  //       <CardContent className="space-y-4">
  //         {/* Skills Summary */}
  //         <div className="grid grid-cols-2 gap-4 text-sm">
  //           <div>
  //             <span className="text-gray-400">Total Skills</span>
  //             <p className="text-white font-medium">{member.skills.length}</p>
  //           </div>
  //           <div>
  //             <span className="text-gray-400">Skill Gaps</span>
  //             <p className={`font-medium ${gaps > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
  //               {gaps}
  //             </p>
  //           </div>
  //         </div>
  //
  //         {/* Top Skills */}
  //         <div>
  //           <p className="text-sm text-gray-400 mb-2">Top Skills</p>
  //           <div className="flex flex-wrap gap-2">
  //             {member.skills
  //               .filter(s => s.currentLevel >= 4)
  //               .slice(0, 3)
  //               .map(skill => {
  //                 const skillInfo = skillCategories
  //                   .flatMap(cat => cat.skills)
  //                   .find(s => s.id === skill.skillId);
  //                 return skillInfo ? (
  //                   <Badge key={skill.skillId} variant="outline" className="text-xs">
  //                     {skillInfo.name}
  //                   </Badge>
  //                 ) : null;
  //               })}
  //           </div>
  //         </div>
  //
  //         {/* Training Needed */}
  //         {recommendations.length > 0 && (
  //           <Alert className="bg-yellow-900/20 border-yellow-700">
  //             <AlertCircle className="h-4 w-4" />
  //             <AlertDescription className="text-sm">
  //               {recommendations.length} training recommendations
  //             </AlertDescription>
  //           </Alert>
  //         )}
  //
  //         <Button 
  //           size="sm" 
  //           variant="outline" 
  //           className="w-full"
  //           onClick={(e) => {
  //             e.stopPropagation();
  //             setSelectedMember(member);
  //           }}
  //         >
  //           View Details
  //           <ChevronRight className="w-4 h-4 ml-2" />
  //         </Button>
  //       </CardContent>
  //     </Card>
  //   );
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading Advisory Skills Matrix...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Skills Matrix & Development</h1>
          <p className="text-muted-foreground">Assess capabilities, identify gaps, and plan development</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAssessmentMode('assess')}>
            Start Assessment
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Matrix
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 border-slate-200">
          <TabsTrigger value="matrix">Skills Matrix</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
          <TabsTrigger value="planning">Development Planning</TabsTrigger>
          <TabsTrigger value="skills-analysis">Skills Analysis</TabsTrigger>
          <TabsTrigger value="metrics">Team Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-6">
          <SkillsMatrix 
            teamMembers={teamMembers}
            skillCategories={skillCategories}
            onSelectMember={setSelectedMember}
            filterOptions={{ category: selectedCategory, role: filterRole }}
          />
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          <SkillsAssessment 
            member={selectedMemberForAssessment}
            mode={assessmentMode}
            teamMembers={teamMembers}
            skillCategories={skillCategories}
          />
        </TabsContent>

        <TabsContent value="gaps" className="space-y-6">
          <GapAnalysis 
            teamMembers={teamMembers}
            skillCategories={skillCategories}
            showHeatmap={true}
            priorityAlgorithm="weighted"
          />
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          <DevelopmentPlanning 
            member={selectedMember}
            teamMembers={teamMembers}
            skillCategories={skillCategories}
            autoRecommendations={true}
          />
        </TabsContent>

        <TabsContent value="skills-analysis" className="space-y-6">
          {/* Skills Analysis for Internal Mentoring */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Skills Analysis - Internal CPD & Mentoring
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Identify experts and learners for each skill to facilitate internal knowledge sharing and mentoring. 
                Top performers can mentor those with high interest to develop skills in smaller, focused groups.
              </p>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-2">
                {skillCategories.map((category, categoryIndex) => {
                  // Calculate totals for this category
                  const categorySkillsWithData = category.skills.filter(skill => {
                    return teamMembers.some(member => 
                      member.skills.find(s => s.skillId === skill.id)
                    );
                  });
                  
                  const categoryMentoringOpps = categorySkillsWithData.filter(skill => {
                    const membersWithSkill = teamMembers
                      .map(member => {
                        const skillData = member.skills.find(s => s.skillId === skill.id);
                        return skillData ? { ...member, currentLevel: skillData.currentLevel, interestLevel: skillData.interestLevel } : null;
                      })
                      .filter(Boolean);
                    const topPerformers = membersWithSkill.filter((m: any) => m.currentLevel >= 3);
                    const highInterestLearners = membersWithSkill.filter((m: any) => m.currentLevel <= 2 && m.interestLevel >= 4);
                    return topPerformers.length > 0 && highInterestLearners.length > 0;
                  }).length;

                  return (
                    <AccordionItem key={category.id} value={`category-${categoryIndex}`} className="border border-gray-200 rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 [&[data-state=open]]:bg-gray-50">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <category.icon className="w-5 h-5 text-orange-500" />
                            <h3 className="text-base font-semibold text-gray-900">{category.name}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{categorySkillsWithData.length} skills</Badge>
                            {categoryMentoringOpps > 0 && (
                              <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                                {categoryMentoringOpps} mentoring opps
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3 mt-2">
                          {category.skills.map(skill => {
                        // Get all team members who have this skill assessed
                        const membersWithSkill = teamMembers
                          .map(member => {
                            const skillData = member.skills.find(s => s.skillId === skill.id);
                            return skillData ? { 
                              ...member, 
                              currentLevel: skillData.currentLevel,
                              interestLevel: skillData.interestLevel 
                            } : null;
                          })
                          .filter(Boolean);

                        // Top 5 performers (highest skill level)
                        const topPerformers = membersWithSkill
                          .filter((m: any) => m.currentLevel >= 3) // Only include competent or better
                          .sort((a: any, b: any) => b.currentLevel - a.currentLevel)
                          .slice(0, 5);

                        // Bottom 5 with highest interest (low skill but eager to learn)
                        const highInterestLearners = membersWithSkill
                          .filter((m: any) => m.currentLevel <= 2 && m.interestLevel >= 4) // Low skill, high interest
                          .sort((a: any, b: any) => b.interestLevel - a.interestLevel)
                          .slice(0, 5);

                        // Skip skills with no data
                        if (membersWithSkill.length === 0) return null;

                        return (
                          <div key={skill.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="mb-3">
                              <h4 className="font-medium text-gray-900">{skill.name}</h4>
                              <p className="text-xs text-gray-600 mt-1">{skill.description}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Top Performers */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Award className="w-4 h-4 text-green-500" />
                                  <span className="text-sm font-semibold text-gray-700">
                                    Top Performers ({topPerformers.length})
                                  </span>
                                </div>
                                {topPerformers.length > 0 ? (
                                  <div className="space-y-1">
                                    {topPerformers.map((member: any) => (
                                      <div key={member.id} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1 border border-gray-200">
                                        <span className="text-gray-900">{member.name}</span>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                            Level {member.currentLevel}
                                          </Badge>
                                          <span className="text-gray-500">{member.role}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 italic">No experts identified yet</p>
                                )}
                              </div>

                              {/* High Interest Learners */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Brain className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm font-semibold text-gray-700">
                                    High Interest Learners ({highInterestLearners.length})
                                  </span>
                                </div>
                                {highInterestLearners.length > 0 ? (
                                  <div className="space-y-1">
                                    {highInterestLearners.map((member: any) => (
                                      <div key={member.id} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1 border border-gray-200">
                                        <span className="text-gray-900">{member.name}</span>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                                            Level {member.currentLevel}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                                            Interest {member.interestLevel}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 italic">No high-interest learners</p>
                                )}
                              </div>
                            </div>

                            {/* Mentoring Opportunity Badge */}
                            {topPerformers.length > 0 && highInterestLearners.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <Alert className="bg-green-50 border-green-200">
                                  <AlertCircle className="h-4 w-4 text-green-600" />
                                  <AlertDescription className="text-xs text-green-800">
                                    <strong>Mentoring Opportunity:</strong> {topPerformers.length} expert(s) can mentor {highInterestLearners.length} eager learner(s) in small groups
                                  </AlertDescription>
                                </Alert>
                              </div>
                            )}
                          </div>
                        );
                      })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <TeamMetrics 
            teamMembers={teamMembers}
            skillCategories={skillCategories}
            showBenchmarks={true}
            comparePeriods={true}
          />
        </TabsContent>
      </Tabs>

      {/* Member Details Dialog */}
      {selectedMember && (
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-white text-gray-900">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl font-bold text-gray-900">{selectedMember.name} - Skills Profile</DialogTitle>
              <DialogDescription className="text-gray-600">
                {selectedMember.role} • {selectedMember.department}
              </DialogDescription>
            </DialogHeader>
            
            <div className="overflow-y-auto flex-1 pr-2 space-y-4">
              {/* Radar Chart - Compact */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-gray-900">Skills Overview</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-48">
                    <Radar 
                      data={getRadarChartData(selectedMember)}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              color: '#374151',
                              font: { size: 10 }
                            },
                            grid: {
                              color: 'rgba(0, 0, 0, 0.1)'
                            },
                            pointLabels: {
                              color: '#1f2937',
                              font: { size: 9, weight: 'bold' }
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            labels: {
                              color: '#1f2937',
                              font: { size: 11 }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Skills by Category - Compact Scrollable */}
              <Tabs defaultValue={skillCategories[0]?.id} className="w-full">
                <TabsList className="bg-gray-100 border border-gray-300 w-full flex flex-wrap h-auto">
                  {skillCategories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <TabsTrigger 
                        key={cat.id} 
                        value={cat.id}
                        className="text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 text-gray-700"
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        {cat.name}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {skillCategories.map(category => (
                  <TabsContent key={category.id} value={category.id} className="mt-3">
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {category.skills.map(skill => {
                        const memberSkill = selectedMember.skills.find(s => s.skillId === skill.id);
                        if (!memberSkill) return null;

                        return (
                          <Card key={skill.id} className="bg-white border-gray-200 shadow-sm">
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 truncate">{skill.name}</p>
                                    <p className="text-xs text-gray-600 line-clamp-2">{skill.description}</p>
                                  </div>
                                  {memberSkill.certifications && memberSkill.certifications.length > 0 && (
                                    <div className="flex gap-1 flex-shrink-0">
                                      {memberSkill.certifications.slice(0, 2).map(cert => (
                                        <Badge key={cert} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                          {cert}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-600 font-medium">Current Level</span>
                                      <span className="text-gray-900 font-bold">{memberSkill.currentLevel}/5</span>
                                    </div>
                                    <Progress 
                                      value={memberSkill.currentLevel * 20} 
                                      className="h-2 bg-gray-200"
                                    />
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-600 font-medium">Interest Level</span>
                                      <span className="text-blue-900 font-bold">{memberSkill.interestLevel}/5</span>
                                    </div>
                                    <Progress 
                                      value={memberSkill.interestLevel * 20} 
                                      className="h-2 bg-blue-100"
                                    />
                                  </div>
                                </div>

                                {memberSkill.currentLevel < memberSkill.targetLevel && (
                                  <Alert className="bg-amber-50 border-amber-300 py-2">
                                    <AlertCircle className="h-3 w-3 text-amber-600" />
                                    <AlertDescription className="text-xs text-amber-800">
                                      Gap: {memberSkill.targetLevel - memberSkill.currentLevel} levels • Target: {memberSkill.targetLevel}/5
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Training Recommendations - TO BE BUILT */}
              <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                    Training Recommendations
                    <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-gray-600">
                    Personalized training recommendations will appear here based on skill gaps and development goals.
                  </p>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdvisorySkillsPage; 