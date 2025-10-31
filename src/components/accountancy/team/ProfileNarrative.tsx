/**
 * ProfileNarrative Component
 * Displays rich narrative descriptions for assessment results
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Target, Lightbulb } from 'lucide-react';

interface ProfileNarrativeProps {
  title: string;
  narrative: string;
  superpower?: string;
  growthEdge?: string;
  energiser?: string;
  gift?: string;
  strength?: string;
  power?: string;
}

export const ProfileNarrative: React.FC<ProfileNarrativeProps> = ({
  title,
  narrative,
  superpower,
  growthEdge,
  energiser,
  gift,
  strength,
  power
}) => {
  // Determine which fields to show based on what's provided
  const showSuperpower = superpower || gift || strength || power;
  const showGrowth = growthEdge || energiser;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-800 leading-relaxed text-base">
          {narrative}
        </p>

        {showSuperpower && (
          <div className="bg-white/70 p-4 rounded-lg border-l-4 border-green-500">
            <div className="flex items-start gap-2">
              <Target className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  {superpower ? 'Your Superpower' : gift ? 'Your Gift to Teams' : strength ? 'Your Strength' : 'Your Power'}
                </p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {superpower || gift || strength || power}
                </p>
              </div>
            </div>
          </div>
        )}

        {showGrowth && (
          <div className="bg-white/70 p-4 rounded-lg border-l-4 border-amber-500">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  {growthEdge ? 'Worth Knowing' : 'What Energises You'}
                </p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {growthEdge || energiser}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileNarrative;

