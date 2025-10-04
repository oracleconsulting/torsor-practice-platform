
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DynamicHeader from '@/components/layout/DynamicHeader';
import { GlassCard } from '@/components/accountancy/ui/GlassCard';
import { ROICalculator } from '@/components/accountancy/ROICalculator';
import { PricingSection } from '@/components/accountancy/PricingSection';
import { FeatureCard } from '@/components/accountancy/FeatureCard';

const AccountancyPortal = () => {
  const [selectedPricingTier, setSelectedPricingTier] = useState('professional');

  const features = [
    {
      icon: '🤖',
      title: 'AI Advisory Coach',
      description: 'Get personalized guidance on transforming your practice from compliance to advisory excellence.',
      benefits: ['24/7 availability', 'Practice-specific advice', 'Conversation templates']
    },
    {
      icon: '📊',
      title: 'Practice Health Monitor',
      description: 'Comprehensive assessment of compliance, team development, and advisory readiness.',
      benefits: ['Real-time scoring', 'Action priorities', 'Progress tracking']
    },
    {
      icon: '🚨',
      title: 'Client Rescue Center',
      description: 'Systematic approach to handling problem clients and turning challenges into opportunities.',
      benefits: ['Issue templates', 'Resolution tracking', 'Fee recovery tools']
    },
    {
      icon: '📄',
      title: 'Advisory Templates',
      description: 'Professional templates for proposals, reports, and client communications.',
      benefits: ['ICAEW compliant', 'Customizable', 'Professional design']
    },
    {
      icon: '🎓',
      title: 'CPD Tracker',
      description: 'Manage team CPD requirements with automated tracking and compliance monitoring.',
      benefits: ['Auto calculations', 'Deadline alerts', 'Compliance reports']
    },
    {
      icon: '📈',
      title: 'Advisory Growth Hub',
      description: 'Tools and frameworks for building and scaling your advisory services.',
      benefits: ['Revenue tracking', 'Client conversion', 'Service packages']
    }
  ];

  return (
    <>
      <DynamicHeader />
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24">
          <div className="absolute inset-0 bg-grid-white/5" />
          <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Oracle Method for
                <span className="text-gold-400 block">Accountancy Practices</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Transform compliance into competitive advantage. Build thriving advisory 
                practices with AI-powered professional standards management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/accountancy/health"
                  className="px-8 py-4 bg-gold-400 text-black font-semibold rounded-lg hover:bg-gold-500 transition-all"
                >
                  Start Advisory Assessment →
                </Link>
                <button 
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all backdrop-blur"
                >
                  View Pricing & ROI
                </button>
              </div>
            </motion.div>
            
            {/* Stats Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="text-center">
                <p className="text-5xl font-bold text-gold-400">500+</p>
                <p className="text-gray-300 mt-2">UK Firms Transformed</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-gold-400">£2M+</p>
                <p className="text-gray-300 mt-2">Advisory Revenue Generated</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-gold-400">90%</p>
                <p className="text-gray-300 mt-2">Client Retention Rate</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-white text-center mb-16"
            >
              Complete Advisory Transformation Suite
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <FeatureCard {...feature} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI Calculator */}
        <section id="roi-calculator" className="py-24 px-4 bg-navy-900/30">
          <div className="max-w-4xl mx-auto">
            <ROICalculator />
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <PricingSection 
              selected={selectedPricingTier}
              onSelect={setSelectedPricingTier}
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 bg-gradient-to-r from-purple-900 to-navy-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join hundreds of UK accountancy firms already using Oracle Method to build thriving advisory practices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/accountancy/health"
                className="px-8 py-4 bg-gold-400 text-black font-semibold rounded-lg hover:bg-gold-500 transition-all"
              >
                Start Free Assessment
              </Link>
              <Link 
                to="/accountancy/dashboard"
                className="px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all backdrop-blur"
              >
                View Demo Dashboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AccountancyPortal;
