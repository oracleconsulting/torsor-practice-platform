
import React from 'react';
import { FileText, Plus, Clock, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const ProjectBuilder = () => {
  const templates = [
    {
      name: "Business Growth Advisory",
      duration: "6 months",
      pricing: "£500-2000/month",
      color: "from-green-500 to-emerald-600",
      icon: Plus,
      description: "Complete growth strategy development and implementation"
    },
    {
      name: "Cash Flow Optimization", 
      duration: "3 months",
      pricing: "£750-1500/month",
      color: "from-blue-500 to-blue-600",
      icon: DollarSign,
      description: "13-week cash flow analysis and working capital review"
    },
    {
      name: "Strategic Planning",
      duration: "4 months", 
      pricing: "£1000-2500/month",
      color: "from-purple-500 to-purple-600",
      icon: FileText,
      description: "Long-term strategic planning and implementation roadmap"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center">
              <FileText className="w-6 h-6 text-purple-400 mr-2" />
              Advisory Project Builder
            </h3>
            <p className="text-gray-400 mt-1">Create structured, repeatable advisory engagements</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Custom Project
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((template, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 cursor-pointer group hover:border-purple-500/50 transition-all"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${template.color} rounded-t-xl`} />
              
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${template.color} bg-opacity-20 backdrop-blur-sm`}>
                  <template.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-500/30">Template</span>
              </div>

              <h4 className="text-lg font-semibold text-white mb-2">{template.name}</h4>
              <p className="text-sm text-gray-400 mb-4">{template.description}</p>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-400">
                  <Clock className="w-4 h-4 mr-2 text-purple-400" />
                  {template.duration}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <DollarSign className="w-4 h-4 mr-2 text-purple-400" />
                  {template.pricing}
                </div>
              </div>

              <motion.button
                whileHover={{ x: 4 }}
                className="w-full mt-4 bg-gray-700/50 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all border border-gray-600 group-hover:border-purple-500/50"
              >
                Use Template
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">More project templates and custom builder coming soon</p>
      </div>
    </div>
  );
};

export default ProjectBuilder;
