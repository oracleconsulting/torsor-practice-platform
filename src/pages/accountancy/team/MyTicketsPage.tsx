/**
 * My Tickets Page (Team Member View)
 * View personal tickets, check replies, and raise new tickets
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Ticket, MessageSquare, Clock, CheckCircle2, 
  AlertCircle, Lightbulb, HelpCircle, MessageCircle,
  Plus, Send, Info
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface SupportTicket {
  id: string;
  category: 'issue' | 'question' | 'suggestion' | 'feedback' | 'other';
  subject: string;
  description: string;
  is_anonymous: boolean;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface TicketReply {
  id: string;
  ticket_id: string;
  message: string;
  is_admin_reply: boolean;
  author_name: string;
  created_at: string;
}

const MyTicketsPage: React.FC = () => {
  const { practice, practiceId } = useAccountancyContext();
  const { user } = useAuth();
  const [member, setMember] = useState<any>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [replies, setReplies] = useState<Record<string, TicketReply[]>>({});
  const [loading, setLoading] = useState(true);
  const [showRaiseTicket, setShowRaiseTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Form state
  const [category, setCategory] = useState<string>('question');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  // Fetch member data
  useEffect(() => {
    const fetchMember = async () => {
      if (!user?.id || !practiceId) return;

      try {
        const { data, error } = await supabase
          .from('practice_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('practice_id', practiceId)
          .single();

        if (error) {
          console.error('Error fetching member:', error);
          return;
        }

        setMember(data);
      } catch (error) {
        console.error('Error fetching member:', error);
      }
    };

    fetchMember();
  }, [user?.id, practiceId]);

  useEffect(() => {
    if (practiceId && member?.id) {
      loadMyTickets();
    }
  }, [practiceId, member?.id]);

  const loadMyTickets = async () => {
    try {
      setLoading(true);
      
      // Load my tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('practice_member_id', member!.id)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      setTickets(ticketsData || []);

      // Load replies for my tickets
      if (ticketsData && ticketsData.length > 0) {
        const ticketIds = ticketsData.map(t => t.id);
        const { data: repliesData, error: repliesError } = await supabase
          .from('ticket_replies')
          .select('*')
          .in('ticket_id', ticketIds)
          .order('created_at', { ascending: true});

        if (repliesError) throw repliesError;

        // Group replies by ticket_id
        const repliesByTicket: Record<string, TicketReply[]> = {};
        (repliesData || []).forEach((reply: TicketReply) => {
          if (!repliesByTicket[reply.ticket_id]) {
            repliesByTicket[reply.ticket_id] = [];
          }
          repliesByTicket[reply.ticket_id].push(reply);
        });

        setReplies(repliesByTicket);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('support_tickets')
        .insert({
          practice_id: practiceId!,
          practice_member_id: member!.id,
          category,
          subject: subject.trim(),
          description: description.trim(),
          is_anonymous: isAnonymous,
          submitter_email: member!.email,
          status: 'open',
          priority: 'medium'
        });

      if (error) throw error;

      // Reset form
      setCategory('question');
      setSubject('');
      setDescription('');
      setIsAnonymous(false);
      setShowRaiseTicket(false);

      // Reload tickets
      await loadMyTickets();

      alert('Ticket submitted successfully! Your practice admin will be notified.');
    } catch (error) {
      console.error('Error submitting ticket:', error);
      alert('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendFollowUp = async () => {
    if (!selectedTicket || !followUpMessage.trim()) return;

    try {
      setSendingFollowUp(true);

      const { error } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: selectedTicket.id,
          message: followUpMessage.trim(),
          is_admin_reply: false,
          author_name: member!.name
        });

      if (error) throw error;

      setFollowUpMessage('');
      await loadMyTickets();
      
      alert('Follow-up message sent!');
    } catch (error) {
      console.error('Error sending follow-up:', error);
      alert('Failed to send follow-up message.');
    } finally {
      setSendingFollowUp(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'issue':
        return <AlertCircle className="w-4 h-4" />;
      case 'question':
        return <HelpCircle className="w-4 h-4" />;
      case 'suggestion':
        return <Lightbulb className="w-4 h-4" />;
      case 'feedback':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Ticket className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'issue':
        return 'destructive';
      case 'question':
        return 'default';
      case 'suggestion':
        return 'secondary';
      case 'feedback':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Tickets</h2>
          <p className="text-gray-600 mt-1">Track your questions, issues, and suggestions</p>
        </div>
        
        <Dialog open={showRaiseTicket} onOpenChange={setShowRaiseTicket}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Raise New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Raise a Support Ticket</DialogTitle>
              <DialogDescription>
                Have a question, issue, or suggestion? Let us know and we'll get back to you soon.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="question">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        Question
                      </div>
                    </SelectItem>
                    <SelectItem value="issue">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Issue/Problem
                      </div>
                    </SelectItem>
                    <SelectItem value="suggestion">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Suggestion
                      </div>
                    </SelectItem>
                    <SelectItem value="feedback">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Feedback
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        Other
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your ticket"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{subject.length}/200 characters</p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide as much detail as possible..."
                  rows={6}
                />
              </div>

              {/* Anonymous Checkbox */}
              <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                />
                <div className="flex-1">
                  <label
                    htmlFor="anonymous"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Submit anonymously
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    If checked, your name won't be visible to the admin. However, you'll still receive email updates about this ticket.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowRaiseTicket(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitTicket} disabled={submitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Submit a ticket for any questions, issues, or suggestions. You'll receive email notifications when there are updates.
        </AlertDescription>
      </Alert>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets yet</h3>
            <p className="text-gray-600 mb-6">
              Have a question or issue? Raise your first ticket and we'll help you out.
            </p>
            <Button onClick={() => setShowRaiseTicket(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Raise Your First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => {
            const hasUnreadReplies = replies[ticket.id]?.some(r => r.is_admin_reply) || false;
            
            return (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getCategoryColor(ticket.category) as any} className="flex items-center gap-1">
                          {getCategoryIcon(ticket.category)}
                          {ticket.category}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        {hasUnreadReplies && (
                          <Badge variant="default" className="bg-blue-600">
                            New Reply
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{ticket.subject}</h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                        </div>
                        {replies[ticket.id] && replies[ticket.id].length > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {replies[ticket.id].length} {replies[ticket.id].length === 1 ? 'reply' : 'replies'}
                          </div>
                        )}
                      </div>

                      <p className="text-gray-700 line-clamp-2">{ticket.description}</p>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {getCategoryIcon(ticket.category)}
                            {ticket.subject}
                          </DialogTitle>
                          <DialogDescription>
                            Ticket #{ticket.id.slice(0, 8)} • {format(new Date(ticket.created_at), 'PPpp')}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                          {/* Ticket Description */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant={getCategoryColor(ticket.category) as any}>
                                {ticket.category}
                              </Badge>
                              <Badge className={getStatusColor(ticket.status)}>
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 mb-2">Your message:</p>
                              <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
                            </div>
                          </div>

                          {/* Conversation Thread */}
                          {replies[ticket.id] && replies[ticket.id].length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Conversation</h4>
                              <div className="space-y-3">
                                {replies[ticket.id].map((reply) => (
                                  <div 
                                    key={reply.id} 
                                    className={`p-4 rounded-lg ${
                                      reply.is_admin_reply 
                                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                                        : 'bg-gray-50 border-l-4 border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm text-gray-900">
                                        {reply.is_admin_reply ? '👤 Admin Reply' : '👥 You'}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {format(new Date(reply.created_at), 'PPp')}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Follow-up Form */}
                          {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                            <div>
                              <Label htmlFor="followup">Add a follow-up message</Label>
                              <Textarea
                                id="followup"
                                value={followUpMessage}
                                onChange={(e) => setFollowUpMessage(e.target.value)}
                                placeholder="Add more information or ask a follow-up question..."
                                rows={3}
                                className="mt-2"
                              />
                              <Button
                                onClick={handleSendFollowUp}
                                disabled={!followUpMessage.trim() || sendingFollowUp}
                                className="mt-3"
                              >
                                <Send className="w-4 h-4 mr-2" />
                                {sendingFollowUp ? 'Sending...' : 'Send Follow-up'}
                              </Button>
                            </div>
                          )}

                          {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                            <Alert>
                              <CheckCircle2 className="h-4 w-4" />
                              <AlertDescription>
                                This ticket has been {ticket.status}. If you need further assistance, please raise a new ticket.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;

