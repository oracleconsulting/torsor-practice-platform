// File: src/components/dashboard/RoadmapDebug.tsx

import React from 'react';
import { Card } from '@/components/ui/card';

interface RoadmapDebugProps {
  roadmap: any;
}

export const RoadmapDebug: React.FC<RoadmapDebugProps> = ({ roadmap }) => {
  return (
    <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 p-6">
      <h3 className="text-xl font-bold text-white mb-4">Roadmap Structure Debug</h3>
      <pre className="text-xs text-gray-300 overflow-auto max-h-96 bg-black/30 p-4 rounded">
        {JSON.stringify(roadmap, null, 2)}
      </pre>
    </Card>
  );
};
