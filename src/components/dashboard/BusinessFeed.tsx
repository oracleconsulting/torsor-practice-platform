
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Rss, TrendingUp, Clock, Star, ExternalLink, Users, DollarSign, Target } from 'lucide-react';

export const BusinessFeed = () => {
  const insights = [
    {
      type: "Market Trend",
      title: "AI Automation Adoption Accelerates",
      description: "SMEs are increasingly adopting AI tools to streamline operations, with 73% planning investments in 2025",
      source: "McKinsey Global Institute",
      timeAgo: "2 hours ago",
      relevance: "High",
      icon: TrendingUp,
      category: "Technology"
    },
    {
      type: "Industry Analysis",
      title: "Remote Work Impact on Productivity",
      description: "New research shows hybrid teams outperform fully remote or office-based teams by 23%",
      source: "Harvard Business Review",
      timeAgo: "4 hours ago",
      relevance: "Medium",
      icon: Users,
      category: "Operations"
    },
    {
      type: "Financial Insight",
      title: "Cash Flow Management in Uncertain Times",
      description: "Best practices for maintaining healthy cash flow during economic volatility",
      source: "CFO Magazine",
      timeAgo: "6 hours ago",
      relevance: "High",
      icon: DollarSign,
      category: "Finance"
    }
  ];

  const metrics = [
    {
      title: "Time to Freedom",
      value: "18 months",
      description: "Average time for Oracle clients to achieve operational independence",
      icon: Clock,
      trend: "improving"
    },
    {
      title: "Focus Areas",
      value: "3.2",
      description: "Optimal number of strategic focus areas for SME growth",
      icon: Target,
      trend: "stable"
    },
    {
      title: "Weekly Time Saved",
      value: "12 hours",
      description: "Average weekly time savings after implementing Oracle recommendations",
      icon: TrendingUp,
      trend: "improving"
    }
  ];

  const socialProof = [
    {
      company: "TechStart Solutions",
      achievement: "Reduced operational overhead by 40%",
      timeframe: "6 months",
      industry: "SaaS"
    },
    {
      company: "Green Valley Consulting",
      achievement: "Scaled team from 5 to 15 without founder burnout",
      timeframe: "12 months",
      industry: "Consulting"
    },
    {
      company: "Digital Commerce Co",
      achievement: "Automated 60% of routine processes",
      timeframe: "8 months",
      industry: "E-commerce"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-oracle-navy to-oracle-navy/90 text-white">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-oracle-gold">
            <Rss className="h-6 w-6" />
            Business Intelligence Feed
          </CardTitle>
          <p className="text-white/90">
            Real-time insights and benchmarks to inform your strategic decisions
          </p>
          <div className="pt-2">
            <Badge className="bg-green-600 hover:bg-green-700 text-white border-0">
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric, index) => (
          <Card key={index} className="border-l-4 border-l-oracle-gold/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <metric.icon className="h-5 w-5 text-oracle-navy" />
                <span className="text-sm font-medium text-oracle-navy">{metric.title}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-oracle-navy mb-1">{metric.value}</div>
              <p className="text-sm text-gray-600">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-oracle-navy">Latest Market Insights</CardTitle>
          <p className="text-sm text-gray-600">Curated intelligence for strategic decision-making</p>
          <div className="pt-2">
            <Badge variant="outline" className="border-orange-400 text-orange-600">
              Example Data - Real insights coming soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="border-l-4 border-l-oracle-gold/30 pl-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <insight.icon className="h-4 w-4 text-oracle-navy" />
                      <Badge variant="outline" className="text-xs border-oracle-navy text-oracle-navy">
                        {insight.type}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          insight.relevance === 'High' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {insight.relevance} Relevance
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-oracle-navy mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{insight.source}</span>
                      <span>{insight.timeAgo}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-oracle-gold text-oracle-navy hover:bg-oracle-gold/10">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ventara Social Proof Engine */}
      <Card className="border-2 border-oracle-gold/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-oracle-navy flex items-center gap-2">
                <Star className="h-5 w-5 text-oracle-gold" />
                Ventara Social Proof Engine
              </CardTitle>
              <p className="text-sm text-gray-600">Real client transformations and success stories</p>
              <div className="pt-2">
                <Badge variant="outline" className="border-orange-400 text-orange-600">
                  Example Data - Real social proof coming soon
                </Badge>
              </div>
            </div>
            <Badge className="bg-oracle-navy text-white">
              Launching Q3 2025
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {socialProof.map((proof, index) => (
              <div key={index} className="bg-oracle-cream/20 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-oracle-navy">{proof.company}</h4>
                  <Badge variant="outline" className="text-xs border-oracle-navy text-oracle-navy">
                    {proof.industry}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mb-2">{proof.achievement}</p>
                <p className="text-xs text-gray-500">Achieved in {proof.timeframe}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-oracle-navy/5 rounded-lg text-center">
            <p className="text-sm text-oracle-navy">
              <strong>Ventara.io</strong> will automatically track and showcase your business transformation journey, 
              providing social proof to build credibility and attract new opportunities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
