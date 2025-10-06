import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAccountancyContext } from '../contexts/AccountancyContext';

interface HealthMetric {
  id: string;
  name: string;
  category: 'financial' | 'operational' | 'compliance' | 'client' | 'team';
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  description: string;
  recommendations: string[];
}

interface HealthScore {
  overall: number;
  financial: number;
  operational: number;
  compliance: number;
  client: number;
  team: number;
  lastCalculated: string;
  trend: 'up' | 'down' | 'stable';
}

export default function PracticeHealth() {
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'financial' | 'operational' | 'compliance' | 'client' | 'team'>('all');

  useEffect(() => {
    loadHealthData();
  }, [practice?.id]);

  const loadHealthData = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockHealthScore: HealthScore = {
        overall: 78,
        financial: 85,
        operational: 72,
        compliance: 90,
        client: 75,
        team: 68,
        lastCalculated: '2024-01-15T10:30:00Z',
        trend: 'up'
      };

      const mockMetrics: HealthMetric[] = [
        {
          id: '1',
          name: 'Cash Flow Management',
          category: 'financial',
          score: 85,
          maxScore: 100,
          status: 'excellent',
          trend: 'up',
          lastUpdated: '2024-01-15',
          description: 'Healthy cash flow with good working capital management',
          recommendations: ['Consider implementing automated cash flow forecasting', 'Review payment terms with clients']
        },
        {
          id: '2',
          name: 'MTD Compliance',
          category: 'compliance',
          score: 90,
          maxScore: 100,
          status: 'excellent',
          trend: 'stable',
          lastUpdated: '2024-01-15',
          description: 'All clients compliant with MTD requirements',
          recommendations: ['Continue monitoring for new MTD updates', 'Plan for future compliance changes']
        },
        {
          id: '3',
          name: 'Client Retention Rate',
          category: 'client',
          score: 75,
          maxScore: 100,
          status: 'good',
          trend: 'up',
          lastUpdated: '2024-01-14',
          description: 'Good client retention with room for improvement',
          recommendations: ['Implement client feedback surveys', 'Develop client engagement programs']
        },
        {
          id: '4',
          name: 'Team Productivity',
          category: 'team',
          score: 68,
          maxScore: 100,
          status: 'warning',
          trend: 'down',
          lastUpdated: '2024-01-13',
          description: 'Team productivity below target - needs attention',
          recommendations: ['Review workload distribution', 'Consider additional training programs', 'Implement productivity tracking']
        },
        {
          id: '5',
          name: 'Process Efficiency',
          category: 'operational',
          score: 72,
          maxScore: 100,
          status: 'good',
          trend: 'up',
          lastUpdated: '2024-01-12',
          description: 'Good process efficiency with automation opportunities',
          recommendations: ['Automate repetitive tasks', 'Streamline client onboarding process']
        },
        {
          id: '6',
          name: 'Profit Margins',
          category: 'financial',
          score: 82,
          maxScore: 100,
          status: 'good',
          trend: 'up',
          lastUpdated: '2024-01-11',
          description: 'Healthy profit margins maintained',
          recommendations: ['Review pricing strategy', 'Optimize cost structure']
        }
      ];

      setHealthScore(mockHealthScore);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <Clock className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'bg-green-50 border-green-200';
      case 'operational': return 'bg-blue-50 border-blue-200';
      case 'compliance': return 'bg-purple-50 border-purple-200';
      case 'client': return 'bg-orange-50 border-orange-200';
      case 'team': return 'bg-pink-50 border-pink-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatus = (score: number) => {
    if (score >= 90) return { status: 'excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 80) return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 70) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'critical', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const filteredMetrics = metrics.filter(metric => 
    selectedCategory === 'all' || metric.category === selectedCategory
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b35]" />
      </div>
    );
  }

  if (!healthScore) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-[#1a2b4a]/40 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#1a2b4a] mb-2">No health data available</h3>
        <p className="text-[#1a2b4a]/60">Health score data will appear here once calculated.</p>
      </div>
    );
  }

  const overallStatus = getOverallStatus(healthScore.overall);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase text-[#1a2b4a] mb-2">PRACTICE HEALTH SCORE</h1>
          <p className="text-[#1a2b4a]/60 font-bold uppercase">Comprehensive practice performance analysis</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={() => navigate('/accountancy/health/calculate')}
            className="border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35] hover:text-white"
          >
            <Activity className="w-4 h-4 mr-2" />
            Recalculate Score
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card className={`border-4 border-[#ff6b35] ${overallStatus.bg}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={`text-2xl font-bold ${overallStatus.color}`}>
              Overall Health Score: {healthScore.overall}/100
            </CardTitle>
            <div className="flex items-center space-x-2">
              {getTrendIcon(healthScore.trend)}
              <Badge className={getStatusColor(overallStatus.status)}>
                {overallStatus.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={healthScore.overall} className="h-3 mb-4" />
          <p className="text-sm text-gray-600">
            Last calculated: {new Date(healthScore.lastCalculated).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { key: 'financial', label: 'Financial', score: healthScore.financial },
          { key: 'operational', label: 'Operational', score: healthScore.operational },
          { key: 'compliance', label: 'Compliance', score: healthScore.compliance },
          { key: 'client', label: 'Client', score: healthScore.client },
          { key: 'team', label: 'Team', score: healthScore.team }
        ].map(category => (
          <Card 
            key={category.key} 
            className={`border-2 cursor-pointer transition-colors ${
              selectedCategory === category.key 
                ? 'border-[#ff6b35] bg-[#ff6b35]/5' 
                : 'border-[#1a2b4a]/20 hover:border-[#ff6b35]'
            }`}
            onClick={() => setSelectedCategory(category.key as any)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#1a2b4a]">{category.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1a2b4a]">{category.score}</div>
              <Progress value={category.score} className="h-2 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'All Metrics' },
          { key: 'financial', label: 'Financial' },
          { key: 'operational', label: 'Operational' },
          { key: 'compliance', label: 'Compliance' },
          { key: 'client', label: 'Client' },
          { key: 'team', label: 'Team' }
        ].map(tab => (
          <Button
            key={tab.key}
            variant={selectedCategory === tab.key ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(tab.key as any)}
            className={selectedCategory === tab.key ? 'bg-[#ff6b35] text-white' : 'border-[#ff6b35] text-[#ff6b35]'}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Metrics List */}
      <div className="space-y-4">
        {filteredMetrics.map(metric => (
          <Card key={metric.id} className={`border-2 ${getCategoryColor(metric.category)}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-[#1a2b4a]">{metric.name}</h3>
                    <Badge className={getStatusColor(metric.status)}>
                      {metric.status.toUpperCase()}
                    </Badge>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <p className="text-gray-600 mb-3">{metric.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span>Score: {metric.score}/{metric.maxScore}</span>
                    <span>Last updated: {new Date(metric.lastUpdated).toLocaleDateString()}</span>
                  </div>
                  <Progress value={(metric.score / metric.maxScore) * 100} className="h-2 mb-3" />
                  
                  {metric.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-[#1a2b4a] mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {metric.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/accountancy/health/metrics/${metric.id}`)}
                    className="border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35] hover:text-white"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMetrics.length === 0 && (
        <Card className="border-2 border-dashed border-[#1a2b4a]/30">
          <CardContent className="p-12 text-center">
            <Activity className="w-12 h-12 text-[#1a2b4a]/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1a2b4a] mb-2">No metrics found</h3>
            <p className="text-[#1a2b4a]/60 mb-4">
              No health metrics available for the selected category.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 