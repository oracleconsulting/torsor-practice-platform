import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Clock, DollarSign, Target } from 'lucide-react';
import { ESGClient, ESGScope } from '../../../../types/accountancy';

interface ClientScopingGridProps {
  clients: ESGClient[];
  onClientSelect: (client: ESGClient) => void;
}

export const ClientScopingGrid: React.FC<ClientScopingGridProps> = ({ clients, onClientSelect }) => {
  const [selectedClient, setSelectedClient] = useState<ESGClient | null>(null);

  const getStatusColor = (status: ESGClient['status']) => {
    switch (status) {
      case 'not_started': return 'text-gray-400';
      case 'scoping': return 'text-yellow-400';
      case 'data_collection': return 'text-blue-400';
      case 'reporting': return 'text-purple-400';
      case 'completed': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: ESGClient['status']) => {
    switch (status) {
      case 'not_started': return <Clock className="w-4 h-4" />;
      case 'scoping': return <Target className="w-4 h-4" />;
      case 'data_collection': return <AlertCircle className="w-4 h-4" />;
      case 'reporting': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const assessScope = (client: ESGClient): ESGScope => {
    const { employees, turnover } = client.scope.companySize;
    const mandatory = employees > 50 || turnover > 10000000;
    
    const voluntaryBenefits = [
      'Investment readiness',
      'Tender requirements',
      'Brand value',
      'Stakeholder engagement'
    ];

    const materialTopics = [
      'Carbon emissions',
      'Energy efficiency',
      'Waste management',
      'Diversity and inclusion',
      'Data privacy',
      'Supply chain management'
    ];

    const reportingFramework = mandatory ? 'UK_SDS' : 'SIMPLIFIED';
    const estimatedCost = mandatory ? 8500 : 4500;

    const recommendedActions = [
      'Conduct materiality assessment',
      'Set up data collection systems',
      'Establish baseline metrics',
      'Develop sustainability policy'
    ];

    return {
      clientId: client.id,
      companySize: { employees, turnover },
      mandatory,
      voluntaryBenefits,
      materialTopics,
      reportingFramework,
      estimatedCost,
      recommendedActions
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Client ESG Scoping</h3>
        <div className="text-sm text-gray-400">
          {clients.length} clients assessed
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => {
          const scope = assessScope(client);
          
          return (
            <motion.div
              key={client.id}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-green-500/50 transition-colors"
              onClick={() => {
                setSelectedClient(client);
                onClientSelect(client);
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">{client.name}</h4>
                <div className={`flex items-center ${getStatusColor(client.status)}`}>
                  {getStatusIcon(client.status)}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Industry:</span>
                  <span className="text-white">{client.industry}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Size:</span>
                  <span className="text-white capitalize">{client.size}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Employees:</span>
                  <span className="text-white">{scope.companySize.employees}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Turnover:</span>
                  <span className="text-white">£{(scope.companySize.turnover / 1000000).toFixed(1)}M</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Mandatory:</span>
                  <span className={scope.mandatory ? 'text-green-400' : 'text-gray-400'}>
                    {scope.mandatory ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Revenue:</span>
                  <span className="text-green-400 font-semibold">£{scope.estimatedCost}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Framework:</span>
                  <span className="text-xs text-white bg-blue-500/20 px-2 py-1 rounded">
                    {scope.reportingFramework}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedClient && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
        >
          <h4 className="text-lg font-bold text-white mb-4">
            Detailed Scope Assessment - {selectedClient.name}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-green-400 mb-2">Voluntary Benefits</h5>
              <ul className="space-y-1">
                {assessScope(selectedClient).voluntaryBenefits.map((benefit, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-center">
                    <CheckCircle className="w-3 h-3 text-green-400 mr-2" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-blue-400 mb-2">Material Topics</h5>
              <div className="flex flex-wrap gap-1">
                {assessScope(selectedClient).materialTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h5 className="font-semibold text-purple-400 mb-2">Recommended Actions</h5>
            <ul className="space-y-1">
              {assessScope(selectedClient).recommendedActions.map((action, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-center">
                  <Target className="w-3 h-3 text-purple-400 mr-2" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}; 