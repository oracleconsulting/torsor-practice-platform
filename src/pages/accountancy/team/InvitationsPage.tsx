import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Send,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/**
 * Team Portal Invitation Management
 * 
 * Admin interface for:
 * - Creating team member accounts
 * - Sending email invitations
 * - Tracking invitation status
 * - Resending/revoking invitations
 */
export default function InvitationsPage() {
  const { toast } = useToast();
  
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewInvite, setShowNewInvite] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      // TODO: Implement actual invitations table/API
      // For now, show empty state (no mock data)
      setInvitations([]);
      
      console.log('📧 Invitations system ready (email integration pending)');
    } catch (error) {
      console.error('Failed to load invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invitations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const NewInvitationForm = () => {
    const [formData, setFormData] = useState({
      email: '',
      name: '',
      role: 'Team Member',
      personalMessage: '',
    });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSending(true);

      try {
        // TODO: Implement actual invitation creation + email sending
        // For now, just generate an invite link
        const inviteLink = `${window.location.origin}/team-portal/login?email=${encodeURIComponent(formData.email)}`;
        
        // Copy to clipboard automatically
        await navigator.clipboard.writeText(inviteLink);
        
        toast({
          title: 'Invitation Link Created',
          description: `Link copied to clipboard! Share with ${formData.email}`,
        });

        setShowNewInvite(false);
        setFormData({ email: '', name: '', role: 'Team Member', personalMessage: '' });
        
        // Note: Until we implement invitation tracking, this just closes the modal
      } catch (error) {
        console.error('Failed to create invitation:', error);
        toast({
          title: 'Error',
          description: 'Failed to create invitation link',
          variant: 'destructive',
        });
      } finally {
        setSending(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="team.member@rpgcc.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Smith"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            type="text"
            placeholder="e.g., Senior Accountant"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Personal Message (Optional)</Label>
          <Textarea
            id="message"
            placeholder="Add a personal note to the invitation email..."
            value={formData.personalMessage}
            onChange={(e) => setFormData({ ...formData, personalMessage: e.target.value })}
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={sending} className="flex-1">
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : 'Send Invitation'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowNewInvite(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  };

  const InvitationCard = ({ invitation }: { invitation: any }) => {
    const [copying, setCopying] = useState(false);

    const copyInviteLink = () => {
      const link = `${window.location.origin}/team-portal/login?invite=${invitation.id}`;
      navigator.clipboard.writeText(link);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
      toast({
        title: 'Link Copied',
        description: 'Invitation link copied to clipboard',
      });
    };

    const resendInvitation = async () => {
      try {
        // TODO: Replace with actual API call
        // await PortalAPI.resendInvitation(invitation.id);
        toast({
          title: 'Invitation Resent',
          description: `Invitation resent to ${invitation.email}`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to resend invitation',
          variant: 'destructive',
        });
      }
    };

    const revokeInvitation = async () => {
      try {
        // TODO: Replace with actual API call
        // await PortalAPI.revokeInvitation(invitation.id);
        toast({
          title: 'Invitation Revoked',
          description: `Invitation for ${invitation.email} has been revoked`,
        });
        loadInvitations();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to revoke invitation',
          variant: 'destructive',
        });
      }
    };

    const statusConfig = {
      pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-950' },
      accepted: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950' },
      expired: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950' },
      revoked: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-950' },
    };

    const config = statusConfig[invitation.status as keyof typeof statusConfig];
    const StatusIcon = config.icon;

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${config.bg}`}>
                  <StatusIcon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold">{invitation.name}</h3>
                  <p className="text-sm text-muted-foreground">{invitation.email}</p>
                  <Badge variant="outline" className="mt-1">
                    {invitation.role}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>
                    Sent {new Date(invitation.sent_at).toLocaleDateString()}
                  </span>
                </div>
                {invitation.accepted_at && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Accepted {new Date(invitation.accepted_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {invitation.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyInviteLink}
                    disabled={copying}
                  >
                    {copying ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    Copy Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resendInvitation}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={revokeInvitation}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Revoke
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invitations...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    expired: invitations.filter(i => i.status === 'expired').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Invitations</h1>
          <p className="text-muted-foreground mt-1">
            Manage team member access to the skills portal
          </p>
        </div>
        <Dialog open={showNewInvite} onOpenChange={setShowNewInvite}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Invitation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an email invitation to join the skills portal
              </DialogDescription>
            </DialogHeader>
            <NewInvitationForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Invitations</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Accepted</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.accepted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Expired</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.expired}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Email Template Preview */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-lg">Email Template Preview</CardTitle>
          <CardDescription>This is what team members will receive</CardDescription>
        </CardHeader>
        <CardContent className="bg-white dark:bg-gray-900 rounded-lg p-6">
          <div className="prose dark:prose-invert max-w-none">
            <h2>You're Invited to Join Our Skills Portal</h2>
            <p>Hi [Name],</p>
            <p>
              You've been invited to join the RPGCC BSG Skills Portal. This is where you can:
            </p>
            <ul>
              <li>Complete your skills self-assessment (60-90 minutes)</li>
              <li>View your skills profile and development opportunities</li>
              <li>Set and track personal development goals</li>
              <li>See anonymized team insights and benchmarks</li>
            </ul>
            <div className="my-6">
              <Button>Access the Portal →</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This invitation link is valid for 7 days. If you have any questions, please contact your team lead.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Invitations</h2>
        {invitations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invitations yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by sending your first invitation
              </p>
              <Button onClick={() => setShowNewInvite(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Send First Invitation
              </Button>
            </CardContent>
          </Card>
        ) : (
          invitations.map(invitation => (
            <InvitationCard key={invitation.id} invitation={invitation} />
          ))
        )}
      </div>
    </div>
  );
}

