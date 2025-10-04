
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Check } from 'lucide-react';

interface Agent {
  code: string;
  name: string;
  title: string;
  expertise: string;
  recommended_for: string[];
}

export function BoardCustomizer({ groupId, currentBoard }: { groupId: string; currentBoard: string[] }) {
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>(currentBoard);
  const [saving, setSaving] = useState(false);

  // Use static data instead of external fetch
  useEffect(() => {
    const staticAgents: Agent[] = [
      { code: 'CEO', name: 'Chief Executive Officer', title: 'Strategic Leadership', expertise: 'Vision, Strategy, Leadership', recommended_for: ['all'] },
      { code: 'CFO', name: 'Chief Financial Officer', title: 'Financial Strategy', expertise: 'Finance, Investment, Risk', recommended_for: ['growth'] },
      { code: 'COO', name: 'Chief Operating Officer', title: 'Operations Excellence', expertise: 'Operations, Process, Efficiency', recommended_for: ['scale'] },
      { code: 'CMO', name: 'Chief Marketing Officer', title: 'Growth & Marketing', expertise: 'Marketing, Brand, Growth', recommended_for: ['marketing'] },
      { code: 'CTO', name: 'Chief Technology Officer', title: 'Technology Leadership', expertise: 'Technology, Innovation, Digital', recommended_for: ['tech'] }
    ];
    setAvailableAgents(staticAgents);
  }, []);

  const toggleAgent = (code: string) => {
    if (selectedAgents.includes(code)) {
      setSelectedAgents(prev => prev.filter(a => a !== code));
    } else if (selectedAgents.length < 7) {
      setSelectedAgents(prev => [...prev, code]);
    }
  };

  const saveBoard = async () => {
    setSaving(true);
    try {
      // Would save to API - currently disabled to prevent CORS
      console.log('Board customization saved:', selectedAgents);
    } catch (error) {
      console.error('Failed to save board:', error);
    } finally {
      setSaving(false);
    }
  };

  const coreAgents = ['CEO', 'CFO', 'COO', 'CMO', 'CTO'];

  const renderAgentButton = (agent: Agent) => (
    <button
      key={agent.code}
      onClick={() => toggleAgent(agent.code)}
      className={`p-3 rounded-lg border transition-all ${
        selectedAgents.includes(agent.code)
          ? 'bg-purple-600/20 border-purple-500'
          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="text-left">
          <div className="font-medium text-white">{agent.code}</div>
          <div className="text-xs text-gray-400 mt-1">{agent.title}</div>
        </div>
        {selectedAgents.includes(agent.code) && (
          <Check className="w-4 h-4 text-purple-400" />
        )}
      </div>
    </button>
  );

  return (
    <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Customize Your Board
      </h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="text-gray-400 text-sm mb-2">Core Executives</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableAgents.filter(a => coreAgents.includes(a.code)).map(renderAgentButton)}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {selectedAgents.length} agents selected (max 7)
        </span>
        <Button
          onClick={saveBoard}
          disabled={saving || selectedAgents.length === 0}
          className="bg-gradient-to-r from-purple-600 to-pink-600"
        >
          {saving ? 'Saving...' : 'Save Board'}
        </Button>
      </div>
    </Card>
  );
}
