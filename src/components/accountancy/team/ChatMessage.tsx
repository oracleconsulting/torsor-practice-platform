/**
 * Chat Message Component
 * 
 * Displays individual messages in the AI coach chat
 */

import React from 'react';
import { Bot, User, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  helpful?: boolean;
  onFeedback?: (messageId: string, helpful: boolean) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  role,
  content,
  timestamp,
  helpful,
  onFeedback
}) => {
  const isAssistant = role === 'assistant';
  
  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isAssistant ? 'bg-muted/50' : 'bg-background'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isAssistant
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        {isAssistant ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
      </div>
      
      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isAssistant ? 'AI Coach' : 'You'}
          </span>
          <span className="text-xs text-muted-foreground">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
        
        {/* Feedback buttons for assistant messages */}
        {isAssistant && onFeedback && (
          <div className="flex gap-2 pt-2">
            <Button
              variant={helpful === true ? 'default' : 'ghost'}
              size="sm"
              className="h-7"
              onClick={() => onFeedback(id, true)}
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              Helpful
            </Button>
            <Button
              variant={helpful === false ? 'default' : 'ghost'}
              size="sm"
              className="h-7"
              onClick={() => onFeedback(id, false)}
            >
              <ThumbsDown className="h-3 w-3 mr-1" />
              Not helpful
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

