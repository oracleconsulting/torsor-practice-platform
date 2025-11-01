/**
 * Tickets Admin Page
 * View and manage all support tickets raised by team members
 * Features: Filter by category/status, reply to tickets, mark as resolved
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { sendTicketReplyEmail } from '@/lib/email-service';
import { 
  Ticket, MessageSquare, Clock, CheckCircle2, 
  AlertCircle, Lightbulb, HelpCircle, MessageCircle,
  User, UserX, Send, Filter, Search
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface SupportTicket {
  id: string;
  practice_member_id: string | null;
  practice_id: string;
  category: 'issue' | 'question' | 'suggestion' | 'feedback' | 'other';
  subject: string;
  description: string;
  is_anonymous: boolean;
  submitter_email: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  member_name?: string;
}

interface TicketReply {
  id: string;
  ticket_id: string;
  message: string;
  is_admin_reply: boolean;
  author_name: string;
  created_at: string;
  email_sent: boolean;
}

const TicketsAdmin: React.FC = () => {
  const { practice, practiceId } = useAccountancyContext();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [replies, setReplies] = useState<Record<string, TicketReply[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (practiceId) {
      loadTickets();
    }
  }, [practiceId]);

  useEffect(() => {
    applyFilters();
  }, [tickets, statusFilter, categoryFilter, searchQuery]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      // Load tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select(`
          *,
          practice_members!support_tickets_practice_member_id_fkey (
            name
          )
        `)
        .eq('practice_id', practiceId!)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Transform data
      const transformedTickets: SupportTicket[] = (ticketsData || []).map((ticket: any) => ({
        ...ticket,
        member_name: ticket.is_anonymous ? null : ticket.practice_members?.name
      }));

      setTickets(transformedTickets);

      // Load all replies
      const ticketIds = transformedTickets.map(t => t.id);
      if (ticketIds.length > 0) {
        const { data: repliesData, error: repliesError } = await supabase
          .from('ticket_replies')
          .select('*')
          .in('ticket_id', ticketIds)
          .order('created_at', { ascending: true });

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

  const applyFilters = () => {
    let filtered = [...tickets];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.subject.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        (t.member_name && t.member_name.toLowerCase().includes(query))
      );
    }

    setFilteredTickets(filtered);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setSending(true);

      // Insert reply
      const { data: replyData, error: replyError } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: selectedTicket.id,
          message: replyMessage.trim(),
          is_admin_reply: true,
          author_name: practice?.contactName || 'Admin',
          email_sent: false
        })
        .select()
        .single();

      if (replyError) throw replyError;

      // Update ticket status to 'in_progress' if it was 'open'
      if (selectedTicket.status === 'open') {
        const { error: updateError } = await supabase
          .from('support_tickets')
          .update({ status: 'in_progress' })
          .eq('id', selectedTicket.id);

        if (updateError) throw updateError;
      }

      // Send email notification to ticket submitter
      try {
        const ticketUrl = `${window.location.origin}/team-member/tickets`;
        const emailResult = await sendTicketReplyEmail(
          selectedTicket.submitter_email,
          selectedTicket.subject,
          replyMessage.trim(),
          ticketUrl,
          selectedTicket.member_name
        );

        if (emailResult.success) {
          // Update reply to mark email as sent
          await supabase
            .from('ticket_replies')
            .update({ 
              email_sent: true,
              email_sent_at: new Date().toISOString()
            })
            .eq('id', replyData.id);
          
          console.log('✅ Email notification sent to:', selectedTicket.submitter_email);
        } else {
          console.warn('⚠️ Email notification failed:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the whole operation if email fails
      }

      // Reload tickets and replies
      await loadTickets();
      setReplyMessage('');
      alert('Reply sent successfully! The team member has been notified by email.');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      await loadTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Failed to update ticket status.');
    }
  };

  const handleUpdatePriority = async (ticketId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ priority: newPriority })
        .eq('id', ticketId);

      if (error) throw error;

      await loadTickets();
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      alert('Failed to update ticket priority.');
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-gray-600 mt-1">Manage team member questions, issues, and suggestions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Ticket className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="issue">Issues</SelectItem>
                <SelectItem value="question">Questions</SelectItem>
                <SelectItem value="suggestion">Suggestions</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No support tickets have been raised yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getCategoryColor(ticket.category) as any} className="flex items-center gap-1">
                        {getCategoryIcon(ticket.category)}
                        {ticket.category}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      {ticket.is_anonymous && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <UserX className="w-3 h-3" />
                          Anonymous
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{ticket.subject}</h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      {!ticket.is_anonymous && ticket.member_name && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {ticket.member_name}
                        </div>
                      )}
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

                    <p className="text-gray-700 whitespace-pre-wrap line-clamp-2">{ticket.description}</p>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        View & Reply
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
                        {/* Ticket Info */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant={getCategoryColor(ticket.category) as any}>
                              {ticket.category}
                            </Badge>
                            {!ticket.is_anonymous && ticket.member_name && (
                              <span className="text-sm text-gray-600">
                                From: <span className="font-medium">{ticket.member_name}</span>
                              </span>
                            )}
                            {ticket.is_anonymous && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <UserX className="w-3 h-3" />
                                Anonymous Submission
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                            {ticket.description}
                          </p>
                        </div>

                        {/* Status & Priority Controls */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <Select 
                              value={ticket.status} 
                              onValueChange={(value) => handleUpdateStatus(ticket.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Priority</Label>
                            <Select 
                              value={ticket.priority} 
                              onValueChange={(value) => handleUpdatePriority(ticket.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
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
                                      ? 'bg-blue-50 ml-8' 
                                      : 'bg-gray-50 mr-8'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">
                                      {reply.is_admin_reply ? '👤 Admin' : '👥 Team Member'}
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

                        {/* Reply Form */}
                        {ticket.status !== 'closed' && (
                          <div>
                            <Label htmlFor="reply-message">Your Reply</Label>
                            <Textarea
                              id="reply-message"
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Type your reply here... The team member will be notified by email."
                              rows={4}
                              className="mt-2"
                            />
                            <Button
                              onClick={handleSendReply}
                              disabled={!replyMessage.trim() || sending}
                              className="mt-3"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {sending ? 'Sending...' : 'Send Reply'}
                            </Button>
                          </div>
                        )}

                        {ticket.status === 'closed' && (
                          <Alert>
                            <AlertDescription>
                              This ticket is closed. Change the status to reopen it.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketsAdmin;

