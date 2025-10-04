import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  TrendingUp, 
  BarChart3, 
  Calendar,
  Eye,
  Edit,
  Plus
} from 'lucide-react';
import { consultingAIService, BusinessRoadmap } from '@/services/consultingAIService';

interface StrategicObjective {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  target_date?: string;
}

interface KPI {
  id: string;
  name: string;
  current_value: number;
  target_value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

interface ClientStrategyWidgetProps {
  clientId: string;
  clientName: string;
}

export const ClientStrategyWidget: React.FC<ClientStrategyWidgetProps> = ({ 
  clientId, 
  clientName 
}) => {
  const [roadmap, setRoadmap] = useState<BusinessRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientStrategy = async () => {
      try {
        setLoading(true);
        const data = await consultingAIService.getClientRoadmap(clientId);
        setRoadmap(data);
      } catch (err) {
        console.error('Failed to fetch client strategy:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch strategy');
      } finally {
        setLoading(false);
      }
    };

    fetchClientStrategy();
  }, [clientId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-gray-100 text-gray-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      case 'stable': return <BarChart3 className="w-4 h-4 text-gray-600" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Strategic Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Strategic Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!roadmap) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Strategic Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Roadmap Found</h3>
            <p className="text-gray-600 mb-4">
              {clientName} doesn't have a strategic roadmap yet.
            </p>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Roadmap
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vision & Mission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Strategic Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {roadmap.vision && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Vision</h4>
              <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">
                {roadmap.vision}
              </p>
            </div>
          )}
          
          {roadmap.mission && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Mission</h4>
              <p className="text-gray-900 bg-green-50 p-3 rounded-lg">
                {roadmap.mission}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strategic Objectives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Strategic Objectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roadmap.strategic_objectives.map((objective, index) => (
              <div key={objective.id || index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {objective.title}
                    </h4>
                    {objective.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {objective.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(objective.status)}>
                        {objective.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(objective.priority)}>
                        {objective.priority}
                      </Badge>
                      {objective.target_date && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(objective.target_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{objective.progress}%</span>
                  </div>
                  <Progress value={objective.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {roadmap.kpis && roadmap.kpis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Key Performance Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roadmap.kpis.map((kpi, index) => (
                <div key={kpi.id || index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm text-gray-900">
                      {kpi.name}
                    </h4>
                    {getTrendIcon(kpi.trend)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">
                        {kpi.current_value}
                      </span>
                      <span className="text-sm text-gray-500">
                        / {kpi.target_value} {kpi.unit}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Target: {kpi.target_value} {kpi.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {roadmap.timeline && roadmap.timeline.phases && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Implementation Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roadmap.timeline.phases.map((phase, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {phase.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
                  </p>
                  {phase.objectives && phase.objectives.length > 0 && (
                    <ul className="text-sm text-gray-600 space-y-1">
                      {phase.objectives.map((objective, objIndex) => (
                        <li key={objIndex} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          {objective}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 