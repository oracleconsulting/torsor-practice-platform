import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { keyboardShortcuts } from '@/lib/design-tokens';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const shortcutGroups = [
    {
      title: 'Navigation',
      shortcuts: [
        keyboardShortcuts.overview,
        keyboardShortcuts.matrix,
        keyboardShortcuts.assessment,
        keyboardShortcuts.gaps,
        keyboardShortcuts.planning,
        keyboardShortcuts.analysis,
        keyboardShortcuts.metrics,
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        keyboardShortcuts.export,
        keyboardShortcuts.search,
        keyboardShortcuts.help,
      ],
    },
  ];

  const formatKey = (key: string) => {
    return key.split('+').map((k, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="mx-1 text-gray-400">then</span>}
        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
          {k.toUpperCase()}
        </kbd>
      </React.Fragment>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>⌨️</span>
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate faster. Gmail-style navigation: press keys in sequence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcutGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {formatKey(shortcut.key)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> For "G" shortcuts, press <kbd className="px-1 py-0.5 text-xs bg-white border rounded">G</kbd> then{' '}
            <kbd className="px-1 py-0.5 text-xs bg-white border rounded">M</kbd> within 1 second (like Gmail).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

