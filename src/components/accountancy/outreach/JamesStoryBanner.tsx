import React from 'react';
import { Card } from '@/components/ui/card';

const JamesStoryBanner: React.FC = () => {
  return (
    <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white overflow-hidden">
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img 
              src="/images/james-professional.jpg" 
              alt="James Howard"
              className="h-16 w-16 rounded-full border-2 border-white object-cover"
            />
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
              <span className="text-xs">✓</span>
            </div>
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">
              Why Quality Over Quantity?
            </h2>
            <p className="text-blue-100 leading-relaxed">
              After 15 years in accounting, I've seen how PE acquisitions can disrupt 
              established firms. My mission is to help practices navigate this transition 
              with genuine understanding and personalized support - not generic solutions.
            </p>
          </div>

          <div className="text-center border-l border-blue-500 pl-6">
            <div className="text-3xl font-bold">50</div>
            <div className="text-sm text-blue-200">Client Limit</div>
            <div className="text-xs text-blue-300 mt-1">Quality Guaranteed</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-blue-500">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">15+</div>
              <div className="text-sm text-blue-200">Years Experience</div>
            </div>
            <div>
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-blue-200">PE Focus</div>
            </div>
            <div>
              <div className="text-2xl font-bold">24h</div>
              <div className="text-sm text-blue-200">Response Time</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default JamesStoryBanner; 