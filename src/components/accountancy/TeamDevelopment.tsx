import React from 'react';
import { Users, Award, BookOpen, TrendingUp, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const teamFeatures = [
  {
    key: 'cpd',
    title: 'CPD Tracker',
    description: 'Individual CPD hours tracking with compliance alerts and course recommendations',
    icon: Award,
    color: 'from-emerald-500 to-emerald-600',
    status: 'Active',
    href: '/accountancy/team/cpd-tracker',
  },
  {
    key: 'advisory',
    title: 'Advisory Skills Matrix',
    description: 'Skill assessment by team member with gap identification and training pathways',
    icon: TrendingUp,
    color: 'from-blue-500 to-blue-600',
    status: 'Active',
    href: '/accountancy/team/advisory-skills',
  },
  {
    key: 'kpi',
    title: 'KPI Management',
    description: 'Define, track, and manage key performance indicators for your team and clients.',
    icon: BarChart2,
    color: 'from-indigo-500 to-blue-600',
    status: 'Active',
    href: '/accountancy/team/kpi',
  },
  {
    key: 'knowledge',
    title: 'Knowledge Base',
    description: 'Best practice templates, conversation scripts, and success story library',
    icon: BookOpen,
    color: 'from-purple-500 to-purple-600',
    status: 'Active',
    href: '/accountancy/team/knowledge-base',
  },
];

const TeamDevelopment: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Users className="w-6 h-6 text-purple-400 mr-2" />
            Team Development Hub
          </h3>
          <p className="text-gray-400 mt-1">Build advisory confidence and capability across your team</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamFeatures.map((feature, index) => (
            <motion.button
              key={feature.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative w-full text-left bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 transition-all h-full focus:outline-none hover:border-purple-500/50"
              onClick={() => navigate(feature.href)}
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color} rounded-t-xl`} />
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} bg-opacity-20 backdrop-blur-sm`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                {feature.status === 'Coming Soon' && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30">
                    {feature.status}
                  </span>
                )}
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </motion.button>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
        <h4 className="text-lg font-semibold text-white mb-4">KPI Management</h4>
        <p className="text-gray-400 mb-4">
          Define, track, and manage key performance indicators for your team and clients. (KPI dashboard will render here.)
        </p>
      </div>
      
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Team development tools will help build advisory confidence across your entire team</p>
      </div>
    </div>
  );
};

export default TeamDevelopment;
