import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, Brain, Sparkles, MessageSquare, ChevronDown, User } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

interface BoardChatProps {
  groupId: string;
  boardMembers: string[];
  tier?: number;
}

interface Message {
  id: string;
  speaker: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'agent' | 'synthesis' | 'secretary';
  agentRole?: string;
}

interface AgentResponse {
  agent: string;
  response: string;
}

// Agent color mapping for visual distinction
const agentColors: Record<string, string> = {
  CEO: 'from-purple-500 to-pink-500',
  CFO: 'from-green-500 to-emerald-500',
  CMO: 'from-orange-500 to-red-500',
  COO: 'from-blue-500 to-cyan-500',
  CTO: 'from-indigo-500 to-purple-500',
  CHRO: 'from-yellow-500 to-orange-500',
  CSO: 'from-pink-500 to-rose-500',
  Secretary: 'from-gray-500 to-gray-600'
};

export const BoardChat: React.FC<BoardChatProps> = ({ groupId, boardMembers, tier = 1 }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize meeting on mount
  useEffect(() => {
    initializeMeeting();
  }, [groupId]);

  const initializeMeeting = async () => {
    try {
      const response = await fetch(`https://oracle-api-server-production.up.railway.app/api/board/meeting/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: groupId,
          tier: tier,
          meeting_type: 'regular'
        })
      });

      const data = await response.json();
      setMeetingId(data.meeting_id);

      // Add secretary introduction
      setMessages([{
        id: '0',
        speaker: 'Company Secretary',
        content: data.secretary_message || "Good morning. I'm your Company Secretary. The board is ready for your questions.",
        timestamp: new Date(),
        type: 'secretary'
      }]);
    } catch (error) {
      console.error('Failed to initialize meeting:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the board. Please refresh.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !meetingId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      speaker: 'You',
      content: inputMessage,
      timestamp: new Date(),
      type: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Determine which agents to ask based on tier
      let agentsToAsk = selectedAgents.length > 0 ? selectedAgents : undefined;
      
      // Tier 1: Can only ask the fixed board
      if (tier === 1) {
        agentsToAsk = undefined; // Use default board
      }

      const response = await fetch(`https://oracle-api-server-production.up.railway.app/api/board/conversation/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meetingId,
          message: inputMessage,
          tier: tier,
          selected_agents: agentsToAsk
        })
      });

      const data = await response.json();

      // Add thinking indicator
      const thinkingMessage: Message = {
        id: 'thinking',
        speaker: 'Board',
        content: 'Board members are considering your question...',
        timestamp: new Date(),
        type: 'agent'
      };
      setMessages(prev => [...prev, thinkingMessage]);

      // Simulate agent responses arriving
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== 'thinking'));

        // Add individual agent responses
        if (data.responses) {
          Object.entries(data.responses).forEach(([agent, response], index) => {
            setTimeout(() => {
              const agentMessage: Message = {
                id: `agent-${Date.now()}-${index}`,
                speaker: agent,
                content: response as string,
                timestamp: new Date(),
                type: 'agent',
                agentRole: agent
              };
              setMessages(prev => [...prev, agentMessage]);
            }, index * 1000); // Stagger responses
          });
        }

        // Add synthesis after all agent responses
        if (data.synthesis) {
          setTimeout(() => {
            const synthesisMessage: Message = {
              id: `synthesis-${Date.now()}`,
              speaker: 'Board Synthesis',
              content: data.synthesis,
              timestamp: new Date(),
              type: 'synthesis'
            };
            setMessages(prev => [...prev, synthesisMessage]);
          }, Object.keys(data.responses || {}).length * 1000 + 500);
        }
      }, 1500);

    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to get board response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleAgentSelection = (agent: string) => {
    setSelectedAgents(prev => 
      prev.includes(agent) 
        ? prev.filter(a => a !== agent)
        : [...prev, agent]
    );
  };

  return (
    <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-white">Board Meeting</h3>
            <Badge variant="outline" className="text-xs">
              Tier {tier}
            </Badge>
          </div>
          
          {/* Agent selector for Tier 2+ */}
          {tier >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAgentSelector(!showAgentSelector)}
              className="text-gray-400 border-gray-700"
            >
              <Users className="w-4 h-4 mr-1" />
              Select Advisors
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAgentSelector ? 'rotate-180' : ''}`} />
            </Button>
          )}
        </div>

        {/* Agent selector panel */}
        {showAgentSelector && tier >= 2 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-gray-800"
          >
            <p className="text-sm text-gray-400 mb-2">
              Select specific advisors or leave empty to ask all
            </p>
            <div className="flex flex-wrap gap-2">
              {boardMembers.filter(m => !['CAO', 'CDO', 'CRO', 'CSO'].includes(m)).map(agent => (
                <Badge
                  key={agent}
                  variant={selectedAgents.includes(agent) ? "default" : "outline"}
                  className="cursor-pointer transition-all"
                  onClick={() => toggleAgentSelection(agent)}
                >
                  {agent}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                {/* Speaker label */}
                <div className={`flex items-center gap-2 mb-1 ${message.type === 'user' ? 'justify-end' : ''}`}>
                  {message.type !== 'user' && (
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                      agentColors[message.agentRole || 'CSO'] || 'from-gray-500 to-gray-600'
                    } flex items-center justify-center`}>
                      {message.type === 'synthesis' ? (
                        <Brain className="w-4 h-4 text-white" />
                      ) : message.type === 'secretary' ? (
                        <MessageSquare className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {message.speaker.substring(0, 2)}
                        </span>
                      )}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-400">
                    {message.speaker}
                  </span>
                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center ml-2">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Message bubble */}
                <div className={`rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : message.type === 'synthesis'
                    ? 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-700 text-white'
                    : 'bg-gray-800 text-gray-200'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-1 opacity-60">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-gray-400"
          >
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200" />
            </div>
            <span className="text-sm">Board is thinking...</span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              tier === 1 
                ? "Ask your board of advisors..." 
                : "Ask specific advisors or the entire board..."
            }
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Character count */}
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            {tier >= 2 && selectedAgents.length > 0 
              ? `Asking: ${selectedAgents.join(', ')}`
              : 'Asking all board members'
            }
          </p>
          <p className="text-xs text-gray-500">
            {inputMessage.length}/500
          </p>
        </div>
      </div>
    </Card>
  );
}; 