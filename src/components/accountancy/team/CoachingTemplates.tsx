/**
 * Coaching Templates Component
 * 
 * Quick access to coaching templates for common scenarios
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Briefcase, TrendingUp, BookOpen, ArrowRight } from 'lucide-react';

export interface CoachingTemplate {
  type: 'skill_improvement' | 'interview_prep' | 'career_pathway' | 'cpd_recommendation';
  title: string;
  description: string;
  icon: React.ReactNode;
}

const templates: CoachingTemplate[] = [
  {
    type: 'skill_improvement',
    title: 'Skill Improvement Plan',
    description: 'Get a personalized plan to level up a specific skill',
    icon: <Target className="h-5 w-5" />
  },
  {
    type: 'interview_prep',
    title: 'Interview Preparation',
    description: 'Prepare for your next role with tailored interview advice',
    icon: <Briefcase className="h-5 w-5" />
  },
  {
    type: 'career_pathway',
    title: 'Career Pathway Guide',
    description: 'Map out your career progression with milestone goals',
    icon: <TrendingUp className="h-5 w-5" />
  },
  {
    type: 'cpd_recommendation',
    title: 'CPD Recommendations',
    description: 'Find CPD activities that align with your skill gaps',
    icon: <BookOpen className="h-5 w-5" />
  }
];

interface CoachingTemplatesProps {
  onSelectTemplate: (type: CoachingTemplate['type']) => void;
}

export const CoachingTemplates: React.FC<CoachingTemplatesProps> = ({
  onSelectTemplate
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Quick Start Templates</h3>
        <p className="text-sm text-muted-foreground">
          Get started with these pre-built coaching scenarios
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card
            key={template.type}
            className="hover:border-primary transition-colors cursor-pointer"
            onClick={() => onSelectTemplate(template.type)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {template.icon}
                  </div>
                  <CardTitle className="text-base">{template.title}</CardTitle>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{template.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

