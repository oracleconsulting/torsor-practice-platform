
import React, { useState, useMemo } from 'react';
import { GlassCard } from './ui/GlassCard';

export const ROICalculator = () => {
  const [inputs, setInputs] = useState({
    annualRevenue: 500000,
    teamSize: 10,
    complianceHours: 25,
    currentAdvisoryPercentage: 20
  });

  const calculations = useMemo(() => {
    // Time savings calculation
    const weeklyHoursSaved = inputs.complianceHours * 0.4; // 40% reduction
    const annualHoursSaved = weeklyHoursSaved * inputs.teamSize * 52;
    const timeSavingsValue = annualHoursSaved * 100; // £100/hour

    // Advisory revenue growth
    const currentAdvisoryRevenue = inputs.annualRevenue * (inputs.currentAdvisoryPercentage / 100);
    const targetAdvisoryRevenue = inputs.annualRevenue * 0.5; // Target 50%
    const advisoryGrowth = targetAdvisoryRevenue - currentAdvisoryRevenue;

    // Total calculations
    const annualCost = 79 * 12; // Professional plan
    const totalBenefit = timeSavingsValue + advisoryGrowth;
    const netBenefit = totalBenefit - annualCost;
    const roi = (netBenefit / annualCost) * 100;
    const paybackMonths = annualCost / (totalBenefit / 12);

    return {
      weeklyHoursSaved: Math.round(weeklyHoursSaved),
      annualHoursSaved: Math.round(annualHoursSaved),
      timeSavingsValue: Math.round(timeSavingsValue),
      advisoryGrowth: Math.round(advisoryGrowth),
      totalBenefit: Math.round(totalBenefit),
      netBenefit: Math.round(netBenefit),
      roi: Math.round(roi),
      paybackMonths: Math.round(paybackMonths * 10) / 10
    };
  }, [inputs]);

  const formatCurrency = (value) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toLocaleString()}`;
  };

  const InputSlider = ({ label, value, onChange, min, max, step, format }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-white font-medium">{label}</label>
        <span className="text-gold-400 font-semibold">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );

  return (
    <div className="bg-navy-900/30 py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <GlassCard>
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Calculate Your Advisory Transformation ROI
            </h2>
            <p className="text-gray-300 text-lg">
              See how much you could save and earn by transforming to advisory excellence
            </p>
          </div>
          
          {/* Input Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InputSlider
              label="Annual Practice Revenue"
              value={inputs.annualRevenue}
              onChange={(value) => setInputs({...inputs, annualRevenue: value})}
              min={100000}
              max={2000000}
              step={50000}
              format={formatCurrency}
            />
            
            <InputSlider
              label="Team Size"
              value={inputs.teamSize}
              onChange={(value) => setInputs({...inputs, teamSize: value})}
              min={1}
              max={50}
              step={1}
              format={(v) => `${v} people`}
            />
            
            <InputSlider
              label="Hours/Week on Compliance"
              value={inputs.complianceHours}
              onChange={(value) => setInputs({...inputs, complianceHours: value})}
              min={10}
              max={60}
              step={5}
              format={(v) => `${v} hours`}
            />
            
            <InputSlider
              label="Current Advisory Revenue %"
              value={inputs.currentAdvisoryPercentage}
              onChange={(value) => setInputs({...inputs, currentAdvisoryPercentage: value})}
              min={0}
              max={100}
              step={5}
              format={(v) => `${v}%`}
            />
          </div>

          {/* Results */}
          <div className="border-t border-white/10 pt-8">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">
              Your Annual Transformation Impact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {calculations.annualHoursSaved.toLocaleString()} hrs
                </div>
                <div className="text-gray-400">Time Saved Annually</div>
                <div className="text-gold-400 text-sm">
                  {calculations.weeklyHoursSaved} hours/week per person
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  +{formatCurrency(calculations.advisoryGrowth)}
                </div>
                <div className="text-gray-400">Advisory Revenue Growth</div>
                <div className="text-gold-400 text-sm">
                  Moving from {inputs.currentAdvisoryPercentage}% to 50% advisory
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {calculations.roi}%
                </div>
                <div className="text-gray-400">Annual ROI</div>
                <div className="text-gold-400 text-sm">
                  Payback in {calculations.paybackMonths} months
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gold-400/20 to-gold-400/10 rounded-xl p-6 text-center">
              <div className="text-sm text-gold-400 mb-2">Total Annual Benefit</div>
              <div className="text-4xl font-bold text-gold-400 mb-2">
                {formatCurrency(calculations.totalBenefit)}
              </div>
              <div className="text-sm text-gray-300 mb-3">
                Less: Oracle Method Professional (£948/year)
              </div>
              <div className="text-2xl font-bold text-white">
                Net Annual Benefit: {formatCurrency(calculations.netBenefit)}
              </div>
            </div>

            <button className="w-full mt-6 px-8 py-4 bg-gold-400 text-black font-semibold rounded-lg hover:bg-gold-500 transition-all text-lg">
              Start Your Transformation →
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
