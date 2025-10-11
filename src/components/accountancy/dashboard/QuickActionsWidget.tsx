import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountancyContext } from '../../../contexts/AccountancyContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { 
  Plus, 
  FileText, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Settings,
  Lock
} from 'lucide-react';

export const QuickActionsWidget: React.FC = () => {
  const navigate = useNavigate();
  const context = useAccountancyContext();
  const { subscriptionTier } = context || { subscriptionTier: 'free' };

  const isFreeTier = subscriptionTier === 'free';
  const isProfessionalPlus = subscriptionTier === 'professional' || subscriptionTier === 'excellence' || subscriptionTier === 'enterprise';

  const actions = [
    {
      title: 'New Client',
      description: 'Add a new client to your practice',
      icon: <Plus className="w-5 h-5" />,
      action: () => navigate('/accountancy/client-management'),
      available: true,
      color: 'bg-semantic-success'
    },
    {
      title: 'Health Check',
      description: 'Run a practice health assessment',
      icon: <FileText className="w-5 h-5" />,
      action: () => navigate('/accountancy/health'),
      available: true,
      color: 'bg-primary-blue'
    },
    {
      title: 'Team Management',
      description: 'Manage team members and CPD',
      icon: <Users className="w-5 h-5" />,
      action: () => navigate('/accountancy/team'),
      available: !isFreeTier,
      color: 'bg-primary-blue'
    },
    {
      title: 'Client Rescue',
      description: 'Start a new client rescue project',
      icon: <AlertTriangle className="w-5 h-5" />,
      action: () => navigate('/accountancy/client-rescues'),
      available: !isFreeTier,
      color: 'bg-orange-500'
    },
    {
      title: 'Advisory Services',
      description: 'Track advisory revenue and projects',
      icon: <TrendingUp className="w-5 h-5" />,
      action: () => navigate('/accountancy/advisory-services'),
      available: true,
      color: 'bg-pink-500'
    },
    {
      title: 'Regulatory Compliance',
      description: 'Manage complaints and compliance',
      icon: <Settings className="w-5 h-5" />,
      action: () => navigate('/accountancy/compliance'),
      available: isProfessionalPlus,
      color: 'bg-primary-coral'
    }
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-6 text-primary">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            disabled={!action.available}
            className={`p-4 rounded-lg border transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-lg ${
              action.available
                ? 'bg-card border-light hover:border-primary-blue hover:shadow-hover'
                : 'bg-muted border-light opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Icon Container with Gradient */}
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                action.available 
                  ? 'bg-gradient-to-br from-primary-blue to-primary-coral text-white' 
                  : 'bg-muted text-tertiary'
              }`}>
                {action.icon}
              </div>
              
              <div>
                <div className={`text-sm font-medium ${
                  action.available ? 'text-primary' : 'text-tertiary'
                }`}>
                  {action.title}
                </div>
                <div className={`text-xs ${
                  action.available ? 'text-secondary' : 'text-tertiary'
                }`}>
                  {action.description}
                </div>
              </div>
              
              {!action.available && (
                <div className="flex items-center gap-1 text-xs text-secondary">
                  <Lock className="w-3 h-3" />
                  <span>Upgrade Required</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {isFreeTier && (
        <div className="mt-4 p-3 bg-secondary rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary">Free Tier</span>
            <span className="text-xs bg-primary-blue text-white px-2 py-1 rounded-full">
              Upgrade for more features
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
