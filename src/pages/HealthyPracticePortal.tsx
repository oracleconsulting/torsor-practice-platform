
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Stethoscope, 
  TrendingUp, 
  Users, 
  Calendar, 
  Shield,
  FileCheck,
  Lock,
  Check,
  Heart,
  Activity,
  Star,
  Award
} from 'lucide-react';

const HealthyPracticePortal = () => {
  const [practiceScore] = useState(78);
  
  const metrics = [
    {
      icon: Stethoscope,
      title: 'Compliance Score',
      value: '92%',
      trend: '+5%',
      color: 'health-teal',
      gradient: 'from-teal-500 to-teal-600'
    },
    {
      icon: TrendingUp,
      title: 'Financial Health',
      value: 'Strong',
      subtitle: '£125k projected',
      color: 'health-mint',
      gradient: 'from-emerald-400 to-teal-500'
    },
    {
      icon: Users,
      title: 'Patient Growth',
      value: '+23%',
      subtitle: 'This quarter',
      color: 'health-sky',
      gradient: 'from-cyan-400 to-teal-500'
    },
    {
      icon: Calendar,
      title: 'Next CQC Check',
      value: '45 days',
      subtitle: 'On track',
      color: 'purple',
      gradient: 'from-purple-400 to-purple-600'
    }
  ];

  const advisors = [
    {
      name: 'Dr. Sarah Mitchell',
      role: 'Practice Management Expert',
      specialty: 'CQC Compliance & NHS Contracts',
      avatar: '/avatars/sarah-mitchell.jpg',
      availability: 'Available now',
      gradient: 'from-teal-500 to-teal-600',
      rating: 4.9
    },
    {
      name: 'Marcus Chen',
      role: 'Healthcare CFO',
      specialty: 'Practice Valuations & Financial Planning',
      avatar: '/avatars/marcus-chen.jpg',
      availability: 'Available now',
      gradient: 'from-emerald-400 to-teal-500',
      rating: 4.8
    },
    {
      name: 'Dr. Rebecca Thompson',
      role: 'Clinical Excellence',
      specialty: 'Patient Care & Clinical Governance',
      avatar: '/avatars/rebecca-thompson.jpg',
      availability: 'Available now',
      gradient: 'from-cyan-400 to-teal-500',
      rating: 5.0
    }
  ];

  const complianceItems = [
    {
      title: 'CQC Standards',
      status: 'compliant',
      progress: 92,
      nextAction: 'Annual review in 45 days',
      icon: FileCheck
    },
    {
      title: 'GDPR Compliance',
      status: 'action-needed',
      progress: 78,
      nextAction: 'Update privacy policy',
      icon: Lock
    },
    {
      title: 'Health & Safety',
      status: 'compliant',
      progress: 95,
      nextAction: 'Next audit in 6 months',
      icon: Shield
    }
  ];

  const setupSteps = [
    {
      id: 1,
      title: 'Practice Registration',
      description: 'Complete CQC registration and initial compliance setup',
      completed: true,
      icon: <FileCheck className="w-6 h-6" />
    },
    {
      id: 2,
      title: 'Financial Infrastructure',
      description: 'Set up accounting, banking, and financial tracking systems',
      completed: true,
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      id: 3,
      title: 'Patient Management System',
      description: 'Implement GDPR-compliant patient records and booking system',
      completed: false,
      icon: <Users className="w-6 h-6" />
    },
    {
      id: 4,
      title: 'Quality Assurance',
      description: 'Establish clinical governance and quality improvement processes',
      completed: false,
      icon: <Award className="w-6 h-6" />
    }
  ];

  const CircularProgress = ({ value, size = 120, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(55, 65, 81, 0.3)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#healthGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">Score</div>
          </div>
        </div>
        <defs>
          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
        </defs>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-teal-900/20 via-gray-900 to-cyan-900/10" />
      <div className="fixed inset-0 opacity-[0.02]">
        {/* Medical pattern overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2314B8A6' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H18v2.5h-2.5v2H18v2.5h2v-2.5h2.5v-2H20z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 pt-24 px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 md:mb-16"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-script text-white mb-4">
            The Healthy Practice
          </h1>
          <p className="text-xl md:text-2xl text-teal-400 tracking-wider uppercase mb-6">
            Change the Conversation
          </p>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            From graduation to practice ownership. We guide healthcare professionals 
            through every step of building a thriving practice.
          </p>
        </motion.div>

        {/* Practice Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-7xl mx-auto mb-12"
        >
          <div className="bg-gradient-to-r from-teal-500/10 to-cyan-400/10 rounded-2xl p-6 md:p-8 border border-teal-500/20 backdrop-blur-sm">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Practice Health Score</h2>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="mx-auto md:mx-0">
                <CircularProgress value={practiceScore} size={120} />
              </div>
              <div className="text-center md:text-left">
                <p className="text-teal-400 text-4xl md:text-5xl font-bold mb-2">{practiceScore}/100</p>
                <p className="text-gray-400 text-lg">Well on track to a thriving practice</p>
                <div className="flex items-center gap-2 mt-4 justify-center md:justify-start">
                  <Heart className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-gray-400">Last updated: Today</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid-mobile-stack max-w-7xl mx-auto mb-12"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="card-mobile group"
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${metric.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
                {metric.trend && (
                  <span className="text-emerald-400 text-sm font-medium bg-emerald-400/10 px-2 py-1 rounded-full">
                    {metric.trend}
                  </span>
                )}
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{metric.title}</p>
                <p className="text-white text-2xl font-bold">{metric.value}</p>
                {metric.subtitle && (
                  <p className="text-gray-500 text-sm mt-1">{metric.subtitle}</p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Healthcare Advisors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-7xl mx-auto mb-12"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
            Your Healthcare Advisory Board
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {advisors.map((advisor, index) => (
              <motion.div
                key={advisor.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="card-mobile group cursor-pointer"
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className={`w-full h-32 bg-gradient-to-r ${advisor.gradient} rounded-lg mb-4 flex items-center justify-center`}>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-white font-semibold">{advisor.name}</h4>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-yellow-400 text-sm">{advisor.rating}</span>
                  </div>
                </div>
                <p className="text-teal-400 text-sm font-medium mb-1">{advisor.role}</p>
                <p className="text-gray-400 text-sm mb-4">{advisor.specialty}</p>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded-full">
                    {advisor.availability}
                  </span>
                  <button className="text-teal-400 hover:text-teal-300 text-sm font-medium">
                    Book Session →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Compliance Command Center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-7xl mx-auto mb-12"
        >
          <div className="card-mobile">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Shield className="text-teal-400" />
                                    Compliance Command Centre
            </h3>
            <div className="space-y-4">
              {complianceItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-teal-500/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.status === 'compliant' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{item.title}</h4>
                        <p className="text-gray-400 text-sm">{item.nextAction}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'compliant'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {item.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        item.status === 'compliant' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Practice Setup Wizard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
            Your Practice Journey
          </h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-teal-500/20" />
            
            <div className="space-y-8">
              {setupSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex gap-6"
                >
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.completed 
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600' 
                      : 'bg-gray-800 border-2 border-teal-500/30'
                  }`}>
                    {step.completed ? <Check className="w-6 h-6 text-white" /> : step.icon}
                  </div>
                  
                  <div className="flex-1 card-mobile hover:border-teal-500/30 transition-all">
                    <h4 className="text-lg font-semibold text-white mb-2">{step.title}</h4>
                    <p className="text-gray-400 mb-4">{step.description}</p>
                    {!step.completed && (
                      <button className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
                        Start this step →
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <div className="card-mobile">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Build Your Healthy Practice?
            </h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of healthcare professionals who've built thriving practices with our guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-touch bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/25">
                Start Practice Assessment
              </button>
              <button className="btn-touch bg-gray-800 text-white rounded-lg font-medium border border-gray-700 hover:border-teal-500/30">
                Schedule Consultation
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* SVG Gradients */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default HealthyPracticePortal;
