import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { ChatMessage } from '../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && (
          <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
        )}
        
        {/* Message content */}
        <div className={`
          flex flex-col gap-1
          ${isOwn ? 'items-end' : 'items-start'}
        `}>
          {/* Message bubble */}
          <div className={`
            px-4 py-2 rounded-lg
            ${isOwn 
              ? 'bg-purple-600 text-white rounded-br-none' 
              : 'bg-gray-800 text-white rounded-bl-none'
            }
          `}>
            {message.content}
            
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm bg-black/20 rounded px-2 py-1"
                  >
                    <span className="truncate">{attachment}</span>
                    <button className="text-blue-300 hover:text-blue-200">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Message info */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {isOwn && (
              <span>
                {message.read_by.length > 0 ? (
                  <CheckCheck className="w-4 h-4 text-blue-400" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 