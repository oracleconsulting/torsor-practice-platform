
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const InfoSection = () => {
  return (
    <Card className="bg-white/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-oracle-navy">What Happens Next?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="p-3 bg-oracle-navy/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-oracle-navy font-bold">1</span>
            </div>
            <h3 className="font-semibold text-oracle-navy mb-2">Complete Assessment</h3>
            <p className="text-sm text-oracle-navy/70">Answer our comprehensive business questions to identify your challenges and opportunities.</p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-oracle-navy/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-oracle-navy font-bold">2</span>
            </div>
            <h3 className="font-semibold text-oracle-navy mb-2">Get Your Roadmap</h3>
            <p className="text-sm text-oracle-navy/70">Receive a personalized 90-day plan with specific actions to transform your business.</p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-oracle-navy/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-oracle-navy font-bold">3</span>
            </div>
            <h3 className="font-semibold text-oracle-navy mb-2">Connect with Experts</h3>
            <p className="text-sm text-oracle-navy/70">Get matched with vetted advisors who can help you implement your roadmap.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
