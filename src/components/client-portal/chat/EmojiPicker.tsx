import React, { useEffect, useRef } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

// Common emojis for quick access
const COMMON_EMOJIS = [
  '👍', '👎', '😊', '😂', '😍', '🤔', '👋', '❤️',
  '🎉', '✨', '🔥', '👏', '🙌', '💪', '🤝', '👌',
  '✅', '❌', '⭐', '💡', '📝', '💬', '👀', '🤷‍♂️'
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onSelect,
  onClose
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg p-4 w-64"
    >
      <div className="grid grid-cols-6 gap-2">
        {COMMON_EMOJIS.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded text-xl"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}; 