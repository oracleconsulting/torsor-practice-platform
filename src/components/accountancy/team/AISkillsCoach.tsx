/**
 * AI Skills Coach Component
 * 
 * Floating chat widget providing AI-powered coaching for skills development
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Minimize2, Maximize2, Mic, MicOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from './ChatMessage';
import { CoachingTemplates } from './CoachingTemplates';
import {
  sendMessage,
  getRateLimitStatus,
  markMessageHelpful,
  type CoachContext
} from '@/lib/api/ai-coach';
import { cn } from '@/lib/utils';

interface AISkillsCoachProps {
  memberId: string;
  context?: CoachContext;
  initialMessage?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  helpful?: boolean;
}

export const AISkillsCoach: React.FC<AISkillsCoachProps> = ({
  memberId,
  context = { type: 'general', userData: { memberName: 'User' } },
  initialMessage
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number>(100);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load rate limit status
  useEffect(() => {
    if (isOpen) {
      loadRateLimitStatus();
    }
  }, [isOpen, memberId]);

  // Send initial message if provided
  useEffect(() => {
    if (isOpen && initialMessage && messages.length === 0) {
      handleSendMessage(initialMessage);
    }
  }, [isOpen, initialMessage]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const loadRateLimitStatus = async () => {
    try {
      const status = await getRateLimitStatus(memberId);
      setRateLimitRemaining(status.remaining);
    } catch (error) {
      console.error('Failed to load rate limit:', error);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;

    // Check rate limit
    if (rateLimitRemaining <= 0) {
      toast({
        title: 'Daily limit reached',
        description: 'You have reached your daily message limit (100 messages/day). Please try again tomorrow.',
        variant: 'destructive'
      });
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowTemplates(false);

    try {
      const response = await sendMessage(memberId, text, context, conversationId);
      
      // Update conversation ID
      if (!conversationId) {
        setConversationId(response.conversationId);
      }
      
      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update rate limit
      setRateLimitRemaining(response.rateLimitRemaining);
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive'
      });
      
      // Remove the user message if there was an error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    try {
      await markMessageHelpful(messageId, helpful);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, helpful } : msg
        )
      );
      
      toast({
        title: 'Thank you!',
        description: 'Your feedback helps improve the AI coach.',
      });
    } catch (error) {
      console.error('Failed to record feedback:', error);
    }
  };

  const handleTemplateSelect = (templateType: string) => {
    setShowTemplates(false);
    
    // Template-specific prompts
    const prompts: Record<string, string> = {
      skill_improvement: "I'd like help creating a skill improvement plan. Can you guide me through the process?",
      interview_prep: "I need help preparing for an interview. Can you help me get ready?",
      career_pathway: "I want to plan my career progression. Can you help me map out a pathway?",
      cpd_recommendation: "I need CPD activity recommendations. Can you suggest some based on my profile?"
    };
    
    const prompt = prompts[templateType] || "Hello! I'd like some coaching advice.";
    handleSendMessage(prompt);
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: 'Not supported',
        description: 'Voice input is not supported in your browser',
        variant: 'destructive'
      });
      return;
    }

    setIsListening(!isListening);
    
    if (!isListening) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: 'Error',
          description: 'Failed to recognize speech',
          variant: 'destructive'
        });
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Bot className="h-6 w-6" />
        <span className="sr-only">Open AI Coach</span>
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        'fixed bottom-6 right-6 shadow-2xl border-2 z-50 transition-all',
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      )}
    >
      {/* Header */}
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">AI Skills Coach</CardTitle>
              <p className="text-xs text-muted-foreground">
                {rateLimitRemaining} messages remaining today
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
            {showTemplates && messages.length === 0 ? (
              <div className="py-4">
                <CoachingTemplates onSelectTemplate={handleTemplateSelect} />
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p className="font-medium mb-2">Hi! I'm your AI Skills Coach</p>
                    <p>Ask me anything about skills development, career planning, or CPD.</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    {...message}
                    onFeedback={handleFeedback}
                  />
                ))}
                
                {isLoading && (
                  <div className="flex items-center gap-3 p-4 bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleVoiceInput}
                className={cn(isListening && 'text-red-500')}
                disabled={isLoading}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {showTemplates && (
              <button
                onClick={() => setShowTemplates(false)}
                className="text-xs text-muted-foreground hover:underline mt-2"
              >
                Hide templates
              </button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

