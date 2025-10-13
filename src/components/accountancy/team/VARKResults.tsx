/**
 * VARK Assessment Results Display
 * Shows learning style profile with charts, recommendations, and download options
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Ear,
  FileText,
  Hand,
  Download,
  Check,
  Lightbulb,
  Users,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { type VARKProfile } from '@/data/varkQuestions';
import confetti from 'canvas-confetti';

interface VARKResultsProps {
  profile: VARKProfile;
  memberName: string;
  onContinue: () => void;
}

export default function VARKResults({ profile, memberName, onContinue }: VARKResultsProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  // Trigger celebration animation on mount
  React.useEffect(() => {
    if (showConfetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [showConfetti]);

  const getStyleIcon = (style: string) => {
    switch (style.toLowerCase()) {
      case 'visual': return <Eye className="w-6 h-6" />;
      case 'auditory': return <Ear className="w-6 h-6" />;
      case 'readwrite': case 'read/write': return <FileText className="w-6 h-6" />;
      case 'kinesthetic': return <Hand className="w-6 h-6" />;
      default: return null;
    }
  };

  const getStyleColor = (style: string) => {
    switch (style.toLowerCase()) {
      case 'visual': return { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-500', light: 'bg-blue-50' };
      case 'auditory': return { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-500', light: 'bg-green-50' };
      case 'readwrite': case 'read/write': return { bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-500', light: 'bg-purple-50' };
      case 'kinesthetic': return { bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-500', light: 'bg-orange-50' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-700', border: 'border-gray-500', light: 'bg-gray-50' };
    }
  };

  const CircularProgress = ({ percentage, label, icon, color }: {
    percentage: number;
    label: string;
    icon: React.ReactNode;
    color: ReturnType<typeof getStyleColor>;
  }) => {
    const circumference = 2 * Math.PI * 45; // radius = 45
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex flex-col items-center"
      >
        <div className="relative w-32 h-32 mb-4">
          <svg className="transform -rotate-90 w-32 h-32">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <motion.circle
              cx="64"
              cy="64"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={color.text}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: circumference
              }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`${color.text} mb-1`}>{icon}</div>
            <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
      </motion.div>
    );
  };

  const handleDownloadReport = () => {
    // TODO: Generate PDF report
    alert('PDF report generation coming soon!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Celebration Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            Assessment Complete!
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </h1>
          <p className="text-xl text-gray-600">
            Congratulations, {memberName}! Here's your unique learning profile.
          </p>
        </motion.div>

        {/* Learning Type Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mb-8"
        >
          <Badge className="text-2xl px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            {profile.learningType}
          </Badge>
        </motion.div>

        {/* Circular Progress Charts */}
        <Card className="shadow-xl mb-8 border-2">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardTitle className="text-white font-bold text-2xl">Your Learning Style Profile</CardTitle>
            <CardDescription className="text-white font-medium opacity-90">
              Understanding your preferences helps personalize your development
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <CircularProgress
                percentage={profile.percentages.visual}
                label="Visual"
                icon={<Eye className="w-6 h-6" />}
                color={getStyleColor('visual')}
              />
              <CircularProgress
                percentage={profile.percentages.auditory}
                label="Auditory"
                icon={<Ear className="w-6 h-6" />}
                color={getStyleColor('auditory')}
              />
              <CircularProgress
                percentage={profile.percentages.readWrite}
                label="Read/Write"
                icon={<FileText className="w-6 h-6" />}
                color={getStyleColor('readwrite')}
              />
              <CircularProgress
                percentage={profile.percentages.kinesthetic}
                label="Kinesthetic"
                icon={<Hand className="w-6 h-6" />}
                color={getStyleColor('kinesthetic')}
              />
            </div>
          </CardContent>
        </Card>

        {/* What This Means */}
        <Card className="shadow-xl mb-8 border-2">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              What This Means for You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.dominantStyles.map((style, idx) => (
                <div key={idx} className={`p-4 rounded-lg border-2 ${getStyleColor(style).light} ${getStyleColor(style).border}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`${getStyleColor(style).bg} p-2 rounded-lg text-white`}>
                      {getStyleIcon(style)}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 capitalize">{style} Learner</h3>
                  </div>
                  <p className="text-gray-700">
                    {style === 'visual' && "You prefer to learn through seeing and visualizing information. Diagrams, charts, and videos are your best friends."}
                    {style === 'auditory' && "You learn best through listening and speaking. Discussions, podcasts, and verbal explanations help you grasp concepts quickly."}
                    {style === 'readWrite' && "You excel at learning through reading and writing. Taking notes, reading documentation, and written summaries work best for you."}
                    {style === 'kinesthetic' && "You're a hands-on learner who prefers practical experience. Learning by doing and real-world practice is your strength."}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Personalized Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Learning Strategies */}
          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Your Learning Strategies
              </CardTitle>
              <CardDescription className="text-gray-600">
                Techniques that work best for your style
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {profile.recommendations.map((rec, idx) => (
                  <div key={idx}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`${getStyleColor(rec.style).bg} p-1.5 rounded text-white`}>
                        {getStyleIcon(rec.style)}
                      </div>
                      <h4 className="font-bold text-gray-900">{rec.style} ({rec.percentage}%)</h4>
                    </div>
                    <ul className="space-y-2 ml-2">
                      {rec.strategies.learning.map((strategy, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mentoring Recommendations */}
          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                For Your Mentor
              </CardTitle>
              <CardDescription className="text-gray-600">
                How mentors can best support your learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {profile.recommendations.map((rec, idx) => (
                  <div key={idx}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`${getStyleColor(rec.style).bg} p-1.5 rounded text-white`}>
                        {getStyleIcon(rec.style)}
                      </div>
                      <h4 className="font-bold text-gray-900">{rec.style} ({rec.percentage}%)</h4>
                    </div>
                    <ul className="space-y-2 ml-2">
                      {rec.strategies.mentoring.map((strategy, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={handleDownloadReport}
            variant="outline"
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF Report
          </Button>
          <Button
            onClick={onContinue}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-6"
          >
            Continue to Dashboard
          </Button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Your learning style profile has been saved and will be used to personalize your training recommendations and mentor matching.
          </p>
        </div>
      </div>
    </div>
  );
}

