import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Shortcut {
  key: string;
  description: string;
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts: Shortcut[] = [
  { key: '⌘K or Ctrl+K', description: 'Open command palette' },
  { key: 'J', description: 'Navigate to next section' },
  { key: 'K', description: 'Navigate to previous section' },
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'E', description: 'Export data' },
  { key: 'ESC', description: 'Close dialogs' },
];

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  open,
  onOpenChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription className="text-gray-400">
            Speed up your workflow with these shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between">
              <span className="text-gray-300">{shortcut.description}</span>
              <kbd className="px-3 py-1.5 bg-gray-700 rounded-md text-sm font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;
