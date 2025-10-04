import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { ChatMessage, ChatThread } from '../../../types/chat';
import { EmojiPicker } from './EmojiPicker';
import { FileAttachment } from './FileAttachment';
import { TypingIndicator } from './TypingIndicator';
import { MessageBubble } from './MessageBubble';

interface ChatInterfaceProps {
  portalId: string;
  userId: string;
  thread?: ChatThread;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  portalId,
  userId,
  thread
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(
    `/ws/chat/${portalId}/${userId}`
  );

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage);
      
      switch (data.type) {
        case 'chat_message':
          setMessages(prev => [...prev, data.message]);
          // Mark as read if window is focused
          if (document.hasFocus()) {
            markMessageAsRead(data.message.id);
          }
          break;
          
        case 'typing_indicator':
          setTypingUsers(data.typing_users.filter((id: string) => id !== userId));
          break;
          
        case 'user_status':
          // Handle user online/offline status
          break;
      }
    }
  }, [lastMessage]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      sendMessage(JSON.stringify({
        type: 'typing',
        is_typing: true
      }));
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendMessage(JSON.stringify({
        type: 'typing',
        is_typing: false
      }));
    }, 2000);
  }, [isTyping, sendMessage]);

  // Send message
  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    const messageData = {
      type: 'chat_message',
      content: inputValue,
      thread_id: thread?.id,
      attachments: attachments.map(f => f.name) // Handle file upload separately
    };

    sendMessage(JSON.stringify(messageData));
    
    // Clear input
    setInputValue('');
    setAttachments([]);
    setIsTyping(false);
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const markMessageAsRead = (messageId: string) => {
    sendMessage(JSON.stringify({
      type: 'mark_read',
      message_ids: [messageId]
    }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div>
          <h3 className="text-white font-semibold">
            {thread?.title || 'Messages'}
          </h3>
          <p className="text-xs text-gray-400">
            {connectionStatus === 'connected' ? 'Online' : 'Connecting...'}
          </p>
        </div>
        <button className="text-gray-400 hover:text-white">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === userId}
              showAvatar={
                index === 0 || 
                messages[index - 1].sender_id !== message.sender_id
              }
            />
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-800">
          <div className="flex gap-2 overflow-x-auto">
            {attachments.map((file, index) => (
              <FileAttachment
                key={index}
                file={file}
                onRemove={() => {
                  setAttachments(prev => prev.filter((_, i) => i !== index));
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-end gap-2">
          {/* Attachment button */}
          <button
            className="p-2 text-gray-400 hover:text-white"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            id="file-input"
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
              }
            }}
          />

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>

          {/* Emoji picker */}
          <div className="relative">
            <button
              className="p-2 text-gray-400 hover:text-white"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-5 h-5" />
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={(emoji) => {
                  setInputValue(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() && attachments.length === 0}
            className={`
              p-2 rounded-lg transition-colors
              ${inputValue.trim() || attachments.length > 0
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-800 text-gray-500'
              }
            `}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}; 