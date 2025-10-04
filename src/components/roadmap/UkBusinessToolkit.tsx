
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wrench, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  AlertCircle,
  Calendar,
  FileText,
  Globe
} from 'lucide-react';

interface UkBusinessToolkitProps {
  toolkit: {
    recommended_tools?: {
      name?: string;
      category?: string;
      integration_status?: 'integrated' | 'available' | 'setup_required';
      setup_time?: string;
      description?: string;
      uk_specific?: boolean;
    }[];
    quick_setup_guides?: {
      title?: string;
      steps?: string[];
      time_required?: string;
      priority?: 'high' | 'medium' | 'low';
    }[];
    compliance_reminders?: {
      title?: string;
      deadline?: string;
      description?: string;
      urgency?: 'urgent' | 'upcoming' | 'planned';
    }[];
  };
}

export const UkBusinessToolkit: React.FC<UkBusinessToolkitProps> = ({ toolkit }) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'guides' | 'compliance'>('tools');

  if (!toolkit || Object.keys(toolkit).length === 0) {
    return null;
  }

  const tools = toolkit.recommended_tools || [];
  const guides = toolkit.quick_setup_guides || [];
  const compliance = toolkit.compliance_reminders || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'integrated':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'available':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'setup_required':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'from-red-600 to-red-700';
      case 'upcoming':
        return 'from-yellow-600 to-orange-600';
      case 'planned':
        return 'from-blue-600 to-indigo-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-gray-600 to-slate-600 rounded-xl">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">UK Business Toolkit</h3>
            </div>
            <p className="text-gray-400">Essential tools and compliance for British businesses</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-800/50 rounded-lg p-1 flex">
              <Button
                variant={activeTab === 'tools' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('tools')}
                className={activeTab === 'tools' ? 'bg-purple-600' : ''}
              >
                Tools ({tools.length})
              </Button>
              <Button
                variant={activeTab === 'guides' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('guides')}
                className={activeTab === 'guides' ? 'bg-purple-600' : ''}
              >
                Setup Guides ({guides.length})
              </Button>
              <Button
                variant={activeTab === 'compliance' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('compliance')}
                className={activeTab === 'compliance' ? 'bg-purple-600' : ''}
              >
                Compliance ({compliance.length})
              </Button>
            </div>
          </div>

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-gray-800/50 border-gray-700 p-4 h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white flex items-center gap-2">
                          {tool.name}
                          {tool.uk_specific && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                              UK
                            </Badge>
                          )}
                        </h4>
                        <p className="text-gray-400 text-xs">{tool.category}</p>
                      </div>
                      {getStatusIcon(tool.integration_status || '')}
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-3">{tool.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Setup: {tool.setup_time}
                      </span>
                      <Button size="sm" variant="outline" className="text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Setup
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Setup Guides Tab */}
          {activeTab === 'guides' && (
            <div className="space-y-4">
              {guides.map((guide, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-gray-800/50 border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-purple-400" />
                        <div>
                          <h4 className="font-semibold text-white">{guide.title}</h4>
                          <p className="text-gray-400 text-sm">
                            {guide.time_required} • {guide.steps?.length} steps
                          </p>
                        </div>
                      </div>
                      <Badge 
                        className={`${
                          guide.priority === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                          guide.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                          'bg-green-500/20 text-green-300 border-green-500/30'
                        }`}
                      >
                        {guide.priority} priority
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {guide.steps?.slice(0, 3).map((step, stepIdx) => (
                        <div key={stepIdx} className="flex items-start gap-2">
                          <span className="text-purple-400 text-sm mt-0.5">{stepIdx + 1}.</span>
                          <span className="text-gray-300 text-sm">{step}</span>
                        </div>
                      ))}
                      {(guide.steps?.length || 0) > 3 && (
                        <p className="text-gray-400 text-xs ml-4">
                          +{(guide.steps?.length || 0) - 3} more steps
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              {compliance.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`bg-gray-800/50 border-gray-700 p-4 relative overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-r ${getUrgencyColor(item.urgency || '')} opacity-5`} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-orange-400" />
                          <div>
                            <h4 className="font-semibold text-white">{item.title}</h4>
                            <p className="text-gray-400 text-sm">Due: {item.deadline}</p>
                          </div>
                        </div>
                        <Badge 
                          className={`${
                            item.urgency === 'urgent' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                            item.urgency === 'upcoming' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                            'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {item.urgency}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm">{item.description}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
