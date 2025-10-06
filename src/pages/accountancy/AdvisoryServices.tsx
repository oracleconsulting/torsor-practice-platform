import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  ScaleIcon,
  CurrencyPoundIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  BriefcaseIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAccountancyContext } from '../../contexts/AccountancyContext';
import { supabase } from '../../lib/supabase/client';
import AdvisoryDashboard from '../../components/accountancy/advisory/AdvisoryDashboard';
import ClientAdvisoryList from '../../components/accountancy/advisory/ClientAdvisoryList';
import AdvisoryMetrics from '../../components/accountancy/advisory/AdvisoryMetrics';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

interface AdvisoryService {
  id: string;
  name: string;
  description: string;
  iconName: string;
  basePrice: string;
  deliveryTime: string;
  deliveredBy?: string; // Who delivers this service
  aims?: string; // What this service aims to achieve
  tier: 'all' | 'professional' | 'enterprise';
  features: string[];
  isCustom?: boolean;
  isEdited?: boolean; // Track if default service has been edited
}

const iconMap: Record<string, any> = {
  'ArrowTrendingUpIcon': ArrowTrendingUpIcon,
  'ScaleIcon': ScaleIcon,
  'UserGroupIcon': UserGroupIcon,
  'ChartBarIcon': ChartBarIcon,
  'BriefcaseIcon': BriefcaseIcon,
  'CurrencyPoundIcon': CurrencyPoundIcon
};

const defaultServices: AdvisoryService[] = [
  {
    id: 'forecasting',
    name: 'Financial Forecasting & Budgets',
    description: 'Comprehensive budgets, forecasts, and cashflow projections',
    iconName: 'ArrowTrendingUpIcon',
    basePrice: '£1,000 - £3,000',
    deliveryTime: '3-5 days',
    tier: 'all',
    features: [
      '12-month rolling forecasts',
      'Scenario planning (best/worst/expected)',
      'Cash flow waterfall analysis',
      'Variance analysis vs actuals',
      'KPI projections',
      'Break-even analysis'
    ]
  },
  {
    id: 'valuation',
    name: 'Business Valuation',
    description: 'Professional business valuations for various purposes',
    iconName: 'ScaleIcon',
    basePrice: '£1,500 - £4,000',
    deliveryTime: '5-7 days',
    tier: 'professional',
    features: [
      'Multiple valuation methods',
      'Market comparables analysis',
      'DCF modeling',
      'Asset-based valuation',
      'Exit planning scenarios',
      'Valuation report & certificate'
    ]
  },
  {
    id: 'strategy',
    name: 'Strategy Day Facilitation',
    description: 'Structured strategic planning sessions with your team',
    iconName: 'UserGroupIcon',
    basePrice: '£2,000/day',
    deliveryTime: 'Full day session',
    tier: 'professional',
    features: [
      'Pre-session diagnostics',
      'Facilitated workshops',
      'SWOT analysis',
      'Strategic roadmap creation',
      'Action plan development',
      'Post-session follow-up'
    ]
  },
  {
    id: 'benchmarking',
    name: 'Industry Benchmarking',
    description: 'Compare performance against industry peers',
    iconName: 'ChartBarIcon',
    basePrice: '£450 - £1,500',
    deliveryTime: '2-3 days',
    tier: 'all',
    features: [
      'Industry KPI comparison',
      'Percentile rankings',
      'Gap analysis',
      'Improvement opportunities',
      'Quarterly updates',
      'Consultation session'
    ]
  },
  {
    id: 'accelerator',
    name: 'Advisory Accelerator',
    description: 'Ongoing advisory support program',
    iconName: 'BriefcaseIcon',
    basePrice: '£500-£2,000/month',
    deliveryTime: 'Monthly',
    tier: 'professional',
    features: [
      'Monthly advisory sessions',
      'Quarterly business reviews',
      'On-demand support',
      'Performance monitoring',
      'Strategic guidance',
      'Board meeting support'
    ]
  },
  {
    id: 'profit-extraction',
    name: 'Profit Extraction Planning',
    description: 'Optimize director remuneration and tax efficiency',
    iconName: 'CurrencyPoundIcon',
    basePrice: '£500 - £1,500',
    deliveryTime: '2-3 days',
    tier: 'all',
    features: [
      'Salary vs dividend analysis',
      'Tax optimization modeling',
      'Pension contribution planning',
      'Personal allowance utilization',
      'NIC efficiency review',
      'Annual review & updates'
    ]
  }
];

const AdvisoryServices: React.FC = () => {
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  const practiceId = practice?.id;
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'services' | 'metrics'>('services');
  const [advisoryStats, setAdvisoryStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<AdvisoryService[]>(defaultServices);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<AdvisoryService | null>(null);
  const [formData, setFormData] = useState<Partial<AdvisoryService>>({
    name: '',
    description: '',
    iconName: 'BriefcaseIcon',
    basePrice: '',
    deliveryTime: '',
    deliveredBy: '',
    aims: '',
    tier: 'all',
    features: ['']
  });

  useEffect(() => {
    fetchAdvisoryStats();
    loadCustomServices();
  }, [practiceId]);

  const fetchAdvisoryStats = async () => {
    try {
      setLoading(true);
      // Mock stats for now
      setAdvisoryStats({
        activeEngagements: 12,
        monthlyRevenue: 15000,
        avgClientValue: 3500,
        successRate: 94
      });
    } catch (error) {
      console.error('Error fetching advisory stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomServices = () => {
    // Load custom services AND edited default services from localStorage
    const customSaved = localStorage.getItem(`custom-services-${practiceId}`);
    const editedSaved = localStorage.getItem(`edited-services-${practiceId}`);
    
    let allServices = [...defaultServices];
    
    // Apply edits to default services
    if (editedSaved) {
      const editedServices = JSON.parse(editedSaved);
      allServices = allServices.map(service => {
        const edited = editedServices.find((e: any) => e.id === service.id);
        return edited ? { ...service, ...edited, isEdited: true } : service;
      });
    }
    
    // Add custom services
    if (customSaved) {
      const customServices = JSON.parse(customSaved);
      allServices = [...allServices, ...customServices];
    }
    
    setServices(allServices);
  };

  const saveCustomServices = (updatedServices: AdvisoryService[]) => {
    // Save custom services
    const customOnly = updatedServices.filter(s => s.isCustom);
    localStorage.setItem(`custom-services-${practiceId}`, JSON.stringify(customOnly));
    
    // Save edited default services (only the changed fields)
    const editedDefaults = updatedServices
      .filter(s => !s.isCustom && s.isEdited)
      .map(s => ({
        id: s.id,
        basePrice: s.basePrice,
        deliveryTime: s.deliveryTime,
        deliveredBy: s.deliveredBy,
        aims: s.aims,
        features: s.features,
        description: s.description,
        tier: s.tier,
        isEdited: true
      }));
    
    if (editedDefaults.length > 0) {
      localStorage.setItem(`edited-services-${practiceId}`, JSON.stringify(editedDefaults));
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      iconName: 'BriefcaseIcon',
      basePrice: '',
      deliveryTime: '',
      tier: 'all',
      features: ['']
    });
    setIsModalOpen(true);
  };

  const handleEditService = (service: AdvisoryService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      iconName: service.iconName,
      basePrice: service.basePrice,
      deliveryTime: service.deliveryTime,
      deliveredBy: service.deliveredBy || '',
      aims: service.aims || '',
      tier: service.tier,
      features: [...service.features]
    });
    setIsModalOpen(true);
  };

  const handleDeleteService = (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      const updated = services.filter(s => s.id !== serviceId);
      setServices(updated);
      saveCustomServices(updated);
    }
  };

  const handleSaveService = () => {
    if (!formData.name || !formData.description || !formData.basePrice) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingService) {
      // Update existing service
      const updated = services.map(s => 
        s.id === editingService.id 
          ? { ...s, ...formData, features: formData.features?.filter(f => f.trim()) || [] }
          : s
      );
      setServices(updated);
      saveCustomServices(updated);
    } else {
      // Add new service
      const newService: AdvisoryService = {
        id: `custom-${Date.now()}`,
        name: formData.name!,
        description: formData.description!,
        iconName: formData.iconName || 'BriefcaseIcon',
        basePrice: formData.basePrice!,
        deliveryTime: formData.deliveryTime!,
        tier: formData.tier || 'all',
        features: formData.features?.filter(f => f.trim()) || [],
        isCustom: true
      };
      const updated = [...services, newService];
      setServices(updated);
      saveCustomServices(updated);
    }

    setIsModalOpen(false);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const handleAddFeature = () => {
    setFormData({ ...formData, features: [...(formData.features || []), ''] });
  };

  const handleRemoveFeature = (index: number) => {
    const newFeatures = (formData.features || []).filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Advisory Services</h1>
        <p className="mt-2 text-gray-600">
          Comprehensive business advisory to help clients achieve strategic, financial, and operational goals
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Click "Service Catalog" tab to add, edit, or delete services
        </p>
      </div>

      {/* Quick Stats */}
      {advisoryStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Engagements</p>
                  <p className="text-2xl font-bold text-gray-900">{advisoryStats.activeEngagements}</p>
                </div>
                <BriefcaseIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">£{advisoryStats.monthlyRevenue?.toLocaleString()}</p>
                </div>
                <CurrencyPoundIcon className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Client Value</p>
                  <p className="text-2xl font-bold text-gray-900">£{advisoryStats.avgClientValue?.toLocaleString()}</p>
                </div>
                <ArrowTrendingUpIcon className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{advisoryStats.successRate}%</p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'services'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Service Catalog
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'clients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Client Engagements
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'metrics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Performance Metrics
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 font-medium">
              👉 To add, edit, or delete advisory services, click the <strong>"Service Catalog"</strong> tab above.
            </p>
          </div>
          <AdvisoryDashboard practiceId={practiceId} />
        </div>
      )}

      {activeTab === 'services' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Service Catalog</h2>
            <Button onClick={handleAddService} className="flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Add New Service
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = iconMap[service.iconName] || BriefcaseIcon;
              return (
                <Card 
                  key={service.id} 
                  className="relative hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/advisory-services/${service.id}`)}
                >
                  {/* Edit button for ALL services, delete only for custom */}
                  <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditService(service);
                      }}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Edit service details"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    {service.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteService(service.id);
                        }}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete custom service"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                    {service.isEdited && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                        Edited
                      </span>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Icon className="w-10 h-10 text-blue-600" />
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        service.tier === 'professional' ? 'bg-blue-100 text-blue-800' :
                        service.tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {service.tier === 'all' ? 'All Tiers' : service.tier}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Price Range:</span>
                        <span className="font-medium text-gray-900">{service.basePrice}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Delivery:</span>
                        <span className="font-medium text-gray-900">{service.deliveryTime}</span>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-xs text-gray-500 mb-2">Key Features:</p>
                      <ul className="space-y-1">
                        {service.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start">
                            <span className="text-blue-500 mr-1">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {service.features.length > 3 && (
                        <p className="text-xs text-blue-600 mt-2">
                          +{service.features.length - 3} more features
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <ClientAdvisoryList practiceId={practiceId} />
      )}

      {activeTab === 'metrics' && (
        <AdvisoryMetrics practiceId={practiceId} />
      )}

      {/* Add/Edit Service Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Tax Planning Advisory"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the service"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basePrice">Price Range *</Label>
                <Input
                  id="basePrice"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  placeholder="e.g., £500 - £1,500"
                />
              </div>

              <div>
                <Label htmlFor="deliveryTime">Delivery Time *</Label>
                <Input
                  id="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                  placeholder="e.g., 3-5 days"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="deliveredBy">Delivered By</Label>
              <Input
                id="deliveredBy"
                value={formData.deliveredBy || ''}
                onChange={(e) => setFormData({ ...formData, deliveredBy: e.target.value })}
                placeholder="e.g., Senior Advisory Team, Partner-Led, James Howard"
              />
              <p className="text-xs text-gray-500 mt-1">Who will deliver this service to clients</p>
            </div>

            <div>
              <Label htmlFor="aims">Service Aims</Label>
              <Textarea
                id="aims"
                value={formData.aims || ''}
                onChange={(e) => setFormData({ ...formData, aims: e.target.value })}
                placeholder="What does this service aim to achieve for clients?"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">The goals and outcomes this service delivers</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tier">Subscription Tier</Label>
                <Select value={formData.tier} onValueChange={(value: any) => setFormData({ ...formData, tier: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="professional">Professional+</SelectItem>
                    <SelectItem value="enterprise">Enterprise Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="icon">Icon</Label>
                <Select value={formData.iconName} onValueChange={(value) => setFormData({ ...formData, iconName: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BriefcaseIcon">Briefcase</SelectItem>
                    <SelectItem value="ChartBarIcon">Chart Bar</SelectItem>
                    <SelectItem value="ArrowTrendingUpIcon">Trending Up</SelectItem>
                    <SelectItem value="ScaleIcon">Scale</SelectItem>
                    <SelectItem value="UserGroupIcon">User Group</SelectItem>
                    <SelectItem value="CurrencyPoundIcon">Currency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Key Features</Label>
              <div className="space-y-2 mt-2">
                {(formData.features || ['']).map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      placeholder={`Feature ${index + 1}`}
                    />
                    {(formData.features?.length || 0) > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddFeature}
                  className="w-full"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveService}>
              {editingService ? 'Update Service' : 'Add Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvisoryServices;
