
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';

interface UpgradePromptProps {
  tier: 'free' | 'starter' | 'growth';
  feature: string;
  description: string;
  targetTier: string;
  targetPrice: string;
  onClose?: () => void;
  position?: 'banner' | 'modal' | 'inline';
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  tier,
  feature,
  description,
  targetTier,
  targetPrice,
  onClose,
  position = 'inline'
}) => {
  const promptClasses = {
    banner: 'fixed top-20 left-4 right-4 md:left-auto md:right-8 md:max-w-sm z-30',
    modal: 'fixed inset-4 md:inset-auto md:bottom-8 md:right-8 md:max-w-sm z-50',
    inline: 'w-full'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'inline' ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === 'inline' ? 0 : 20 }}
      className={promptClasses[position]}
    >
      <div className="bg-gradient-to-r from-purple-900/90 to-pink-900/90 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 md:p-6 shadow-xl">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors touch-area"
            aria-label="Close upgrade prompt"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm md:text-base mb-1">
              Unlock {feature}
            </h3>
            <p className="text-gray-300 text-xs md:text-sm mb-4 leading-relaxed">
              {description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all btn-touch">
                Upgrade to {targetTier}
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </button>
              
              <div className="text-xs text-gray-400 flex items-center justify-center sm:justify-start">
                Starting at {targetPrice}/month
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
