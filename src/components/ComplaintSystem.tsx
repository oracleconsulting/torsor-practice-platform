
import React, { useState } from 'react';
import { AlertTriangle, FileText, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ComplaintSystem = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const complaintCategories = [
    {
      title: "Tax Compliance Failures",
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      issues: ["VAT returns filed incorrectly", "Corporation tax errors", "Missing tax reliefs"],
      count: "12 templates"
    },
    {
      title: "Accounting Failures", 
      icon: FileText,
      color: "from-orange-500 to-orange-600",
      issues: ["Accounts don't balance", "Missing reconciliations", "Incorrect categorization"],
      count: "8 templates"
    },
    {
      title: "Advisory Negligence",
      icon: Shield, 
      color: "from-yellow-500 to-yellow-600",
      issues: ["Bad tax advice given", "Missed opportunities", "No written advice"],
      count: "6 templates"
    }
  ];

  const workflowSteps = [
    { title: "Client Details", icon: FileText, completed: false },
    { title: "Issue Documentation", icon: AlertTriangle, completed: false },
    { title: "Complaint Drafting", icon: Shield, completed: false },
    { title: "Final Review", icon: CheckCircle, completed: false }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mr-2" />
            Professional Standards Complaint System
          </h3>
          <p className="text-gray-400 mt-1">Efficiently handle complaints about previous accountants' poor work</p>
        </div>

        {/* Complaint Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {complaintCategories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => setSelectedCategory(category)}
              className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 cursor-pointer group hover:border-red-500/50 transition-all"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${category.color} rounded-t-xl`} />
              
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${category.color} bg-opacity-20 backdrop-blur-sm`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-500/30">{category.count}</span>
              </div>

              <h4 className="text-lg font-semibold text-white mb-2">{category.title}</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                {category.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-center">
                    <div className="w-1 h-1 bg-gray-500 rounded-full mr-2" />
                    {issue}
                  </li>
                ))}
              </ul>

              <motion.div
                whileHover={{ x: 4 }}
                className="mt-4 flex items-center text-sm font-medium text-purple-400 group-hover:text-purple-300"
              >
                Start Complaint
                <ArrowRight className="w-4 h-4 ml-1" />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Workflow Steps */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">Complaint Builder Workflow</h4>
          
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-8 left-8 right-8 h-1 bg-gray-700 rounded-full">
              <div className="h-full w-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300" />
            </div>
            
            {/* Steps */}
            <div className="relative grid grid-cols-4 gap-4">
              {workflowSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className={`
                    w-16 h-16 mx-auto rounded-full flex items-center justify-center border-2 backdrop-blur-sm
                    ${step.completed 
                      ? 'bg-purple-500 text-white border-purple-500' 
                      : 'bg-gray-800 border-gray-600 text-gray-400'
                    }
                  `}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-white">{step.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-8 text-gray-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Full complaint system with regulatory body templates and evidence management coming soon</p>
      </div>
    </div>
  );
};

export default ComplaintSystem;
