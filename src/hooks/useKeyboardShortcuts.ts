import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  handler: () => void;
  description?: string;
  preventDefault?: boolean;
}

/**
 * Hook to register keyboard shortcuts
 * Supports combinations like "g+m" for Gmail-style navigation
 */
export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  const pressedKeys = new Set<string>();
  let keySequence: string[] = [];
  let sequenceTimeout: NodeJS.Timeout;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    
    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Add to pressed keys
    pressedKeys.add(key);
    
    // Build key sequence for combinations like "g+m"
    keySequence.push(key);
    
    // Clear sequence after 1 second
    clearTimeout(sequenceTimeout);
    sequenceTimeout = setTimeout(() => {
      keySequence = [];
      pressedKeys.clear();
    }, 1000);

    // Check for matches
    const currentSequence = keySequence.join('+');
    
    shortcuts.forEach(({ key: shortcutKey, handler, preventDefault = true }) => {
      // Handle single keys
      if (shortcutKey === key) {
        if (preventDefault) event.preventDefault();
        handler();
        keySequence = [];
        pressedKeys.clear();
      }
      
      // Handle key combinations
      if (shortcutKey.includes('+')) {
        const parts = shortcutKey.split('+');
        const matches = parts.every(part => keySequence.includes(part));
        
        if (matches && keySequence.length === parts.length) {
          if (preventDefault) event.preventDefault();
          handler();
          keySequence = [];
          pressedKeys.clear();
        }
      }
    });
  }, [shortcuts]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    pressedKeys.delete(key);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearTimeout(sequenceTimeout);
    };
  }, [handleKeyDown, handleKeyUp]);
};

/**
 * Hook to show keyboard shortcuts help dialog
 */
export const useKeyboardShortcutsHelp = () => {
  const shortcuts = [
    { key: 'g+o', description: 'Go to Overview' },
    { key: 'g+m', description: 'Go to Skills Matrix' },
    { key: 'g+a', description: 'Go to Assessment' },
    { key: 'g+g', description: 'Go to Gap Analysis' },
    { key: 'g+p', description: 'Go to Development Planning' },
    { key: 'g+s', description: 'Go to Skills Analysis' },
    { key: 'g+t', description: 'Go to Team Metrics' },
    { key: 'e', description: 'Export Data' },
    { key: '?', description: 'Show this help' },
    { key: '/', description: 'Search' },
    { key: 'Esc', description: 'Close dialogs' },
  ];

  return shortcuts;
};

