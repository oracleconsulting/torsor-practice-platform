import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Target, Users, Activity, 
  Brain, BarChart2, CheckCircle, Smartphone
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands = [
    {
      group: 'Navigation',
      items: [
        { icon: Target, label: 'Training Recommendations', path: '/accountancy/team-portal/training-recommendations', keywords: ['ai', 'learning', 'courses'] },
        { icon: Users, label: 'Mentoring Hub', path: '/accountancy/team-portal/mentoring', keywords: ['mentor', 'coaching', 'expert'] },
        { icon: Activity, label: 'CPD Skills Impact', path: '/accountancy/team-portal/cpd-skills-impact', keywords: ['cpd', 'development', 'roi'] },
        { icon: Brain, label: 'VARK Assessment', path: '/accountancy/team-portal/vark-assessment', keywords: ['learning', 'style', 'assessment'] },
        { icon: BarChart2, label: 'Analytics Dashboard', path: '/accountancy/team-portal/analytics', keywords: ['analytics', 'insights', 'metrics'] },
        { icon: CheckCircle, label: 'Onboarding', path: '/accountancy/team-portal/onboarding', keywords: ['onboard', 'new', 'welcome'] },
        { icon: Smartphone, label: 'Mobile Assessment', path: '/accountancy/team-portal/mobile-assessment', keywords: ['mobile', 'phone', 'assessment'] },
      ]
    }
  ];

  const filteredCommands = commands.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.keywords.some(kw => kw.toLowerCase().includes(search.toLowerCase()))
    )
  })).filter(group => group.items.length > 0);

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px] p-0 bg-gray-800 border-gray-700">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-700 px-3">
            <svg
              className="w-4 h-4 text-gray-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Type a command or search..."
              className="flex h-11 w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-gray-600 bg-gray-700 px-1.5 font-mono text-xs text-gray-400 opacity-100 sm:flex">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">
                No results found.
              </div>
            ) : (
              filteredCommands.map((group) => (
                <div key={group.group} className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase">
                    {group.group}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleSelect(item.path)}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                      >
                        <item.icon className="w-4 h-4 text-gray-400" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-700 px-3 py-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-600 bg-gray-700 px-1.5 font-mono text-xs">
                ↑↓
              </kbd>
              <span>to navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-600 bg-gray-700 px-1.5 font-mono text-xs">
                ↵
              </kbd>
              <span>to select</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;

