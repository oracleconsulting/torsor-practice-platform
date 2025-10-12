import React, { useState, useEffect } from 'react';
import { 
  Target, TrendingUp, TrendingDown, Plus, Edit2, Trash2, 
  Users, Clock, Award, Brain, BarChart3, Settings,
  ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { supabase } from '@/lib/supabase/client';

interface TeamKPI {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'quality' | 'development' | 'satisfaction' | 'efficiency';
  currentValue: number;
  targetValue: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  status: 'on-track' | 'at-risk' | 'off-track';
  owner?: string;
  lastUpdated: Date;
  dataSource?: string;
  formula?: string;
  history: Array<{
    date: Date;
    value: number;
  }>;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  kpis: string[]; // KPI IDs assigned to this member
}

const KPIManagementPage: React.FC = () => {
  const context = useAccountancyContext();
  const [kpis, setKpis] = useState<TeamKPI[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingKPI, setEditingKPI] = useState<TeamKPI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKPIData();
    loadTeamMembers();
  }, []);

  const loadKPIData = async () => {
    try {
      // TODO: Implement real KPI tracking system
      // For now, show empty state - KPIs need to be configured by practice
      setKpis([]);
    } catch (error) {
      console.error('Error loading KPIs:', error);
      setKpis([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      // Load real team members from practice_members table
      const { data, error } = await supabase
        .from('practice_members')
        .select('id, name, role');
      
      if (error) throw error;
      
      setTeamMembers((data || []).map((m: any) => ({
        id: m.id,
        name: m.name || 'Unknown',
        role: m.role || 'Team Member',
        kpis: []
      })));
    } catch (error) {
      console.error('Error loading team members:', error);
      setTeamMembers([]);
    }
  };

  const categoryConfig = {
    productivity: { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    quality: { icon: Award, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    development: { icon: Brain, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    satisfaction: { icon: Users, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    efficiency: { icon: Target, color: 'text-orange-500', bgColor: 'bg-orange-500/10' }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-green-500';
      case 'at-risk': return 'text-yellow-500';
      case 'off-track': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return CheckCircle;
      case 'at-risk': return AlertCircle;
      case 'off-track': return AlertCircle;
      default: return AlertCircle;
    }
  };

  const filteredKPIs = selectedCategory === 'all' 
    ? kpis 
    : kpis.filter(kpi => kpi.category === selectedCategory);

  const renderKPICard = (kpi: TeamKPI) => {
    const config = categoryConfig[kpi.category];
    const Icon = config.icon;
    const TrendIcon = kpi.trend.direction === 'up' ? ArrowUpRight : 
                      kpi.trend.direction === 'down' ? ArrowDownRight : null;
    const StatusIcon = getStatusIcon(kpi.status);

    return (
      <Card key={kpi.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div>
                <CardTitle className="text-lg text-white">{kpi.name}</CardTitle>
                <CardDescription className="text-sm">{kpi.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${getStatusColor(kpi.status)}`} />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingKPI(kpi)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current vs Target */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Current</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">
                  {kpi.currentValue}{kpi.unit}
                </span>
                {TrendIcon && (
                  <div className={`flex items-center gap-1 ${
                    kpi.trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    <span className="text-sm">{kpi.trend.percentage}%</span>
                  </div>
                )}
              </div>
            </div>
            <Progress 
              value={(kpi.currentValue / kpi.targetValue) * 100} 
              className="h-2"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Target: {kpi.targetValue}{kpi.unit}</span>
              <Badge variant={kpi.status === 'on-track' ? 'default' : 
                             kpi.status === 'at-risk' ? 'secondary' : 'destructive'}>
                {kpi.status}
              </Badge>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Owner</span>
              <p className="text-white">{kpi.owner || 'Unassigned'}</p>
            </div>
            <div>
              <span className="text-gray-400">Frequency</span>
              <p className="text-white capitalize">{kpi.frequency}</p>
            </div>
            {kpi.formula && (
              <div className="col-span-2">
                <span className="text-gray-400">Formula</span>
                <p className="text-white text-xs font-mono bg-gray-900 p-2 rounded mt-1">
                  {kpi.formula}
                </p>
              </div>
            )}
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-400">
            Last updated: {kpi.lastUpdated.toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    );
  };

  const KPIForm: React.FC<{ kpi?: TeamKPI | null; onClose: () => void }> = ({ kpi, onClose }) => {
    const [formData, setFormData] = useState({
      name: kpi?.name || '',
      description: kpi?.description || '',
      category: kpi?.category || 'productivity',
      targetValue: kpi?.targetValue || 0,
      unit: kpi?.unit || '%',
      frequency: kpi?.frequency || 'monthly',
      owner: kpi?.owner || '',
      formula: kpi?.formula || '',
      dataSource: kpi?.dataSource || ''
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>KPI Name</Label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Team Utilization Rate"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={formData.category}
              onValueChange={(value) => setFormData({...formData, category: value as any})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="productivity">Productivity</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="satisfaction">Satisfaction</SelectItem>
                <SelectItem value="efficiency">Efficiency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Brief description of what this KPI measures"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Target Value</Label>
            <Input 
              type="number"
              value={formData.targetValue}
              onChange={(e) => setFormData({...formData, targetValue: Number(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Input 
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              placeholder="%, hours, /5, etc."
            />
          </div>
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select 
              value={formData.frequency}
              onValueChange={(value) => setFormData({...formData, frequency: value as any})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Owner</Label>
          <Select 
            value={formData.owner}
            onValueChange={(value) => setFormData({...formData, owner: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map(member => (
                <SelectItem key={member.id} value={member.name}>
                  {member.name} - {member.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Formula (Optional)</Label>
          <Input 
            value={formData.formula}
            onChange={(e) => setFormData({...formData, formula: e.target.value})}
            placeholder="e.g., (Billable Hours / Available Hours) × 100"
          />
        </div>

        <div className="space-y-2">
          <Label>Data Source (Optional)</Label>
          <Input 
            value={formData.dataSource}
            onChange={(e) => setFormData({...formData, dataSource: e.target.value})}
            placeholder="e.g., Time tracking system, Client surveys"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            // Save logic here
            onClose();
          }}>
            {kpi ? 'Update' : 'Create'} KPI
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading KPI Management...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Team KPI Management
          </h1>
          <p className="text-gray-400">
            Define, track, and manage key performance indicators for your team
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create KPI
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New KPI</DialogTitle>
              <DialogDescription>
                Define a new key performance indicator for your team
              </DialogDescription>
            </DialogHeader>
            <KPIForm onClose={() => setShowCreateDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total KPIs</p>
                <p className="text-2xl font-bold text-white">{kpis.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">On Track</p>
                <p className="text-2xl font-bold text-green-500">
                  {kpis.filter(k => k.status === 'on-track').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">At Risk</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {kpis.filter(k => k.status === 'at-risk').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Off Track</p>
                <p className="text-2xl font-bold text-red-500">
                  {kpis.filter(k => k.status === 'off-track').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="all">All KPIs</TabsTrigger>
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger key={key} value={key}>
                <Icon className={`w-4 h-4 mr-2 ${config.color}`} />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredKPIs.map(kpi => renderKPICard(kpi))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingKPI} onOpenChange={() => setEditingKPI(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit KPI</DialogTitle>
            <DialogDescription>
              Update the details of this key performance indicator
            </DialogDescription>
          </DialogHeader>
          <KPIForm kpi={editingKPI} onClose={() => setEditingKPI(null)} />
        </DialogContent>
      </Dialog>

      {/* Alert for Off-Track KPIs */}
      {kpis.filter(k => k.status === 'off-track').length > 0 && (
        <Alert className="bg-red-900/20 border-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {kpis.filter(k => k.status === 'off-track').length} KPIs that are off-track. 
            Consider reviewing these metrics and creating action plans to improve performance.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default KPIManagementPage; 