import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  ScaleIcon,
  DocumentChartBarIcon,
  CurrencyPoundIcon,
  ArrowTrendingUpIcon,
  LightBulbIcon,
  ArrowRightIcon,
  ClockIcon,
  UserGroupIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { useAccountancyContext } from '../contexts/AccountancyContext';
import { supabase } from '../lib/supabase/client';
import AdvisoryDashboard from '../components/accountancy/advisory/AdvisoryDashboard';
import ClientAdvisoryList from '../components/accountancy/advisory/ClientAdvisoryList';
import AdvisoryMetrics from '../components/accountancy/advisory/AdvisoryMetrics';

interface AdvisoryService {
  id: string;
  name: string;
  description: string;
  icon: any;
  basePrice: string;
  deliveryTime: string;
  path: string;
  tier: 'all' | 'professional' | 'enterprise';
  features: string[];
}

const AdvisoryServices: React.FC = () => {
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  const practiceId = practice?.id;
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'services' | 'metrics'>('overview');
  const [advisoryStats, setAdvisoryStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const services: AdvisoryService[] = [
    {
      id: 'forecasting',
      name: 'Financial Forecasting & Budgets',
      description: 'Comprehensive budgets, forecasts, and cashflow projections',
      icon: ArrowTrendingUpIcon,
      basePrice: '£1,000 - £3,000',
      deliveryTime: '3-5 days',
      path: '/accountancy/portal/advisory/forecasting',
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
      icon: ScaleIcon,
      basePrice: '£1,500 - £4,000',
      deliveryTime: '5-7 days',
      path: '/accountancy/portal/advisory/valuation',
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
      icon: UserGroupIcon,
      basePrice: '£2,000/day',
      deliveryTime: 'Full day session',
      path: '/accountancy/portal/advisory/strategy',
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
      icon: ChartBarIcon,
      basePrice: '£450 - £1,500',
      deliveryTime: '2-3 days',
      path: '/accountancy/portal/advisory/benchmarking',
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
      icon: BriefcaseIcon,
      basePrice: '£500-£2,000/month',
      deliveryTime: 'Monthly',
      path: '/accountancy/portal/advisory/accelerator',
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
      icon: CurrencyPoundIcon,
      basePrice: '£500 - £1,500',
      deliveryTime: '2-3 days',
      path: '/accountancy/portal/advisory/profit-extraction',
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

  useEffect(() => {
    fetchAdvisoryStats();
  }, [practiceId]);

  const fetchAdvisoryStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/accountancy/advisory/stats?practiceId=${practiceId}`, {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      const data = await response.json();
      setAdvisoryStats(data);
    } catch (error) {
      console.error('Error fetching advisory stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (service: AdvisoryService) => {
    navigate(service.path);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Advisory Services</h1>
        <p className="mt-2 text-gray-600">
          Comprehensive business advisory to help clients achieve strategic, financial, and operational goals
        </p>
      </div>

      {/* Quick Stats */}
      {advisoryStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Engagements</p>
                <p className="text-2xl font-bold text-gray-900">{advisoryStats.activeEngagements}</p>
              </div>
              <BriefcaseIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">£{advisoryStats.monthlyRevenue?.toLocaleString()}</p>
              </div>
              <CurrencyPoundIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Client Value</p>
                <p className="text-2xl font-bold text-gray-900">£{advisoryStats.avgClientValue?.toLocaleString()}</p>
              </div>
              <ArrowTrendingUpIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{advisoryStats.successRate}%</p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-orange-500" />
            </div>
          </div>
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
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'services'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Service Catalog
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'clients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Client Engagements
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'metrics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Performance Metrics
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <AdvisoryDashboard practiceId={practiceId} />
      )}

      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleServiceClick(service)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-10 h-10 text-blue-600" />
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      service.tier === 'professional' 
                        ? 'bg-blue-100 text-blue-800'
                        : service.tier === 'enterprise'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
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

                  <button className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    View Details
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'clients' && (
        <ClientAdvisoryList practiceId={practiceId} />
      )}

      {activeTab === 'metrics' && (
        <AdvisoryMetrics practiceId={practiceId} />
      )}
    </div>
  );
};

export default AdvisoryServices;
