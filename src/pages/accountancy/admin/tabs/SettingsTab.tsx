import React from 'react';
import { Settings as SettingsIcon, Brain } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AISettingsPage from '../AISettingsPage';

/**
 * Settings Tab - System configuration and AI settings
 * 
 * Consolidates:
 * - AI SETTINGS
 */
const SettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <Card className="border-2 border-gray-500 bg-gradient-to-r from-gray-50 to-slate-50">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-gray-600" />
            Settings
          </CardTitle>
          <CardDescription className="text-base">
            Configure AI models, prompts, and system settings
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Content */}
      <AISettingsPage />
    </div>
  );
};

export default SettingsTab;

