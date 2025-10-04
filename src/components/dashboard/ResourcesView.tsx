
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Video, Download, ExternalLink } from 'lucide-react';

export const ResourcesView = () => {
  const resources = [
    {
      title: "The Founder's Time Audit",
      description: "Track where your time really goes with this comprehensive audit template",
      type: "Template",
      icon: FileText,
      category: "Time Management"
    },
    {
      title: "Delegation Decision Matrix",
      description: "Know what to delegate and when with this decision framework",
      type: "Framework",
      icon: FileText,
      category: "Leadership"
    },
    {
      title: "90-Day Sprint Planning",
      description: "How to execute your roadmap in focused 90-day sprints",
      type: "Guide",
      icon: BookOpen,
      category: "Planning"
    },
    {
      title: "Building Your First SOP",
      description: "5-minute guide to creating your first Standard Operating Procedure",
      type: "Video",
      icon: Video,
      category: "Systems"
    },
    {
      title: "Business Model Canvas",
      description: "Map out your business model with this proven framework",
      type: "Template",
      icon: FileText,
      category: "Strategy"
    },
    {
      title: "Customer Interview Script",
      description: "Uncover valuable insights with this customer interview template",
      type: "Template",
      icon: FileText,
      category: "Research"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-oracle-navy to-oracle-navy/90 text-white">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-oracle-gold">
            <BookOpen className="h-6 w-6" />
            Resources for Your Journey
          </CardTitle>
          <p className="text-white/90">
            Templates, frameworks, and guides to accelerate your business transformation
          </p>
          <div className="pt-2">
            <Badge className="bg-green-600 hover:bg-green-700 text-white border-0">
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Resources Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {resources.map((resource, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-oracle-gold/30">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-oracle-navy/10 rounded-lg flex items-center justify-center">
                    <resource.icon className="h-5 w-5 text-oracle-navy" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-oracle-navy">{resource.title}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs border-oracle-gold text-oracle-navy">
                        {resource.type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-oracle-navy/10 text-oracle-navy">
                        {resource.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-oracle-navy mb-4">{resource.description}</p>
              <div className="flex gap-2">
                <Button size="sm" className="bg-oracle-navy hover:bg-oracle-navy/90 text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button size="sm" variant="outline" className="border-oracle-gold text-oracle-navy hover:bg-oracle-gold/10">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon Section */}
      <Card className="border-2 border-oracle-gold/30 bg-oracle-cream/10">
        <CardHeader>
          <CardTitle className="text-oracle-navy">More Resources Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-oracle-navy/60" />
            <p className="text-oracle-navy mb-4">
              We're continuously adding new templates, guides, and frameworks based on your needs and feedback.
            </p>
            <p className="text-sm text-oracle-navy">
              Have a specific resource request? Let us know through your assessment feedback.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
