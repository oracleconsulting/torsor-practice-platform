import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Users, FileQuestion } from 'lucide-react';

interface BoardResponse {
  question: string;
  responses: Record<string, string>;
  synthesis: string;
  timestamp: string;
  session_id: string;
}

interface BoardChatProps {
  groupId: string;
  boardMembers?: string[];
  tier?: number;
}

export function BoardChat({ groupId, boardMembers = [], tier = 1 }: BoardChatProps) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<BoardResponse | null>(null);
  const [history, setHistory] = useState<BoardResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const questionTemplates = [
    "How should I prioritize my next 30 days?",
    "What's the biggest risk to my business right now?",
    "How can I improve my cash flow this quarter?",
    "Should I hire my first employee?",
    "What metrics should I be tracking?",
  ];

  const askBoard = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    try {
      // Simulate API call - would normally call backend
      console.log('Board consultation request:', question);
      
      // Mock response for now
      const mockResponse: BoardResponse = {
        question,
        responses: {
          'CEO': 'From a strategic perspective, this requires careful consideration of your long-term vision...',
          'CFO': 'Looking at the financial implications, we need to consider cash flow and ROI...',
          'COO': 'Operationally, this would require process changes and resource allocation...'
        },
        synthesis: 'Based on the board discussion, the recommended approach combines strategic vision with operational efficiency...',
        timestamp: new Date().toISOString(),
        session_id: 'mock-session'
      };
      
      setConversation(mockResponse);
      setQuestion('');
      setHistory(prev => [mockResponse, ...prev]);
      
    } catch (error) {
      console.error('Board consultation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-500" />
          <h2 className="text-2xl font-bold text-white">Your AI Board of Advisors</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="text-gray-400 border-gray-700"
        >
          {showHistory ? 'Hide' : 'Show'} History ({history.length})
        </Button>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">Quick questions:</p>
        <div className="flex flex-wrap gap-2">
          {questionTemplates.map((template, idx) => (
            <button
              key={idx}
              onClick={() => setQuestion(template)}
              className="text-xs px-3 py-1 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-full transition-colors"
            >
              {template}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What strategic question do you need help with?"
          className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 min-h-[100px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey) {
              askBoard();
            }
          }}
        />
        
        <div className="flex justify-between items-center">
          <Button
            onClick={askBoard}
            disabled={loading || !question.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Consulting your board...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Ask Your Board
              </>
            )}
          </Button>
          
          <span className="text-xs text-gray-500">⌘+Enter to send</span>
        </div>
      </div>
      
      {conversation && !showHistory && (
        <div className="mt-8 space-y-6">
          <div className="text-sm text-gray-400">
            {new Date(conversation.timestamp).toLocaleString()}
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-4">
            <p className="text-white font-medium">{conversation.question}</p>
          </div>
          
          <div className="grid gap-4">
            {Object.entries(conversation.responses).map(([agent, response]) => (
              <div key={agent} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {agent.slice(0, 2)}
                  </div>
                  <span className="text-white font-medium">{agent} Perspective</span>
                </div>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{response}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg p-6 border border-purple-800/50">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <FileQuestion className="w-5 h-5" />
              Board Synthesis & Recommendations
            </h3>
            <p className="text-gray-200 whitespace-pre-wrap">{conversation.synthesis}</p>
          </div>
        </div>
      )}
      
      {showHistory && history.length > 0 && (
        <div className="mt-6 space-y-4 max-h-[600px] overflow-y-auto">
          {history.map((conv, idx) => (
            <div key={idx} className="bg-gray-800/30 rounded-lg p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                 onClick={() => {
                   setConversation(conv);
                   setShowHistory(false);
                 }}>
              <div className="flex justify-between items-start mb-2">
                <p className="text-white font-medium text-sm">{conv.question}</p>
                <span className="text-xs text-gray-500">
                  {new Date(conv.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-400 text-sm line-clamp-2">{conv.synthesis}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
