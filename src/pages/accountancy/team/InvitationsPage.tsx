import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
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
  Upload,
  Download,
  AlertCircle,
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
import * as InvitationsAPI from '@/lib/api/invitations';
import * as EmailService from '@/lib/email-service';

/**
 * Full Invitation Management System
 * - Create individual invitations
 * - Bulk CSV import
 * - Track status (pending/accepted/expired)
 * - Resend/revoke functionality
 * - Email integration with SendGrid
 */
export default function InvitationsPage() {
  const { toast } = useToast();
  const { practice } = useAccountancyContext();
  
  const [invitations, setInvitations] = useState<InvitationsAPI.Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewInvite, setShowNewInvite] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (practice?.id) {
      loadInvitations();
      loadStats();
    }
  }, [practice?.id]);

  const loadInvitations = async () => {
    if (!practice?.id) return;
    
    try {
      const data = await InvitationsAPI.getInvitations(practice.id);
      setInvitations(data);
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

  const loadStats = async () => {
    if (!practice?.id) return;
    
    try {
      const data = await InvitationsAPI.getInvitationStats(practice.id);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
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
      if (!practice?.id) return;
      
      setSending(true);

      try {
        // Create invitation in database
        const invitation = await InvitationsAPI.createInvitation(practice.id, {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          personalMessage: formData.personalMessage,
        });

        // Generate invite link
        const inviteLink = InvitationsAPI.generateInviteLink(invitation.invite_code);

        // Try to send email (falls back to clipboard if not configured)
        const emailConfig = EmailService.getEmailConfig();
        
        if (emailConfig.configured) {
          const result = await EmailService.sendInvitationEmail(
            formData.email,
            formData.name,
            inviteLink,
            formData.personalMessage
          );

          if (result.success) {
            // Mark email as sent
            await InvitationsAPI.trackInvitationEvent(invitation.id, 'sent', {
              messageId: result.messageId,
            });
            
            toast({
              title: 'Invitation Sent',
              description: `Email sent to ${formData.email}`,
            });
          } else {
            // Email failed, copy link instead
            await navigator.clipboard.writeText(inviteLink);
            toast({
              title: 'Link Copied',
              description: `Email failed. Link copied to clipboard for ${formData.email}`,
              variant: 'default',
            });
          }
        } else {
          // SendGrid not configured, copy link
          await navigator.clipboard.writeText(inviteLink);
          toast({
            title: 'Invitation Created',
            description: `Link copied! Share with ${formData.email}`,
          });
        }

        setShowNewInvite(false);
        setFormData({ email: '', name: '', role: 'Team Member', personalMessage: '' });
        loadInvitations();
        loadStats();
      } catch (error: any) {
        console.error('Failed to create invitation:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to create invitation',
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

        {!EmailService.isEmailConfigured() && (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">Email not configured</p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Invitation link will be copied to clipboard. Set VITE_RESEND_API_KEY or RESEND_API_KEY to enable automatic emails.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={sending} className="flex-1">
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Creating...' : 'Create Invitation'}
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

  const BulkImportDialog = () => {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
      }
    };

    const handleImport = async () => {
      if (!file || !practice?.id) return;

      setImporting(true);
      try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        // Parse CSV (simple parser - assumes email,name,role format)
        const invitations: InvitationsAPI.BulkInviteRow[] = [];
        
        for (let i = 1; i < lines.length; i++) { // Skip header
          const [email, name, role] = lines[i].split(',').map(s => s.trim());
          if (email) {
            invitations.push({ email, name, role });
          }
        }

        if (invitations.length === 0) {
          throw new Error('No valid invitations found in CSV');
        }

        // Create batch
        await InvitationsAPI.createBulkInvitationBatch(
          practice.id,
          `Bulk Import - ${new Date().toLocaleDateString()}`,
          invitations
        );

        toast({
          title: 'Import Successful',
          description: `${invitations.length} invitations created`,
        });

        setShowBulkImport(false);
        setFile(null);
        loadInvitations();
        loadStats();
      } catch (error: any) {
        console.error('Import failed:', error);
        toast({
          title: 'Import Failed',
          description: error.message || 'Failed to import invitations',
          variant: 'destructive',
        });
      } finally {
        setImporting(false);
      }
    };

    const downloadTemplate = () => {
      const csv = 'email,name,role\nmember1@rpgcc.com,John Smith,Senior Accountant\nmember2@rpgcc.com,Jane Doe,Advisor';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invitation-template.csv';
      a.click();
    };

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>CSV Template</Label>
          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <p className="text-sm text-muted-foreground">
            Format: email,name,role (one per line)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="csv-file">Upload CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
        </div>

        {file && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              File selected: <strong>{file.name}</strong>
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button onClick={handleImport} disabled={!file || importing} className="flex-1">
            <Upload className="w-4 h-4 mr-2" />
            {importing ? 'Importing...' : 'Import Invitations'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowBulkImport(false);
              setFile(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const InvitationCard = ({ invitation }: { invitation: InvitationsAPI.Invitation }) => {
    const [copying, setCopying] = useState(false);
    const [acting, setActing] = useState(false);

    const copyInviteLink = async () => {
      const link = InvitationsAPI.generateInviteLink(invitation.invite_code);
      await navigator.clipboard.writeText(link);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
      toast({
        title: 'Link Copied',
        description: 'Invitation link copied to clipboard',
      });
    };

    const resendInvitation = async () => {
      setActing(true);
      try {
        await InvitationsAPI.resendInvitation(invitation.id);
        
        // Try to send email
        if (EmailService.isEmailConfigured()) {
          const link = InvitationsAPI.generateInviteLink(invitation.invite_code);
          await EmailService.sendInvitationEmail(
            invitation.email,
            invitation.name || 'Team Member',
            link,
            invitation.personal_message
          );
        }
        
        toast({
          title: 'Invitation Resent',
          description: `Invitation resent to ${invitation.email}`,
        });
        loadInvitations();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to resend invitation',
          variant: 'destructive',
        });
      } finally {
        setActing(false);
      }
    };

    const revokeInvitation = async () => {
      setActing(true);
      try {
        await InvitationsAPI.revokeInvitation(invitation.id);
        toast({
          title: 'Invitation Revoked',
          description: `Invitation for ${invitation.email} has been revoked`,
        });
        loadInvitations();
        loadStats();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to revoke invitation',
          variant: 'destructive',
        });
      } finally {
        setActing(false);
      }
    };

    const deleteInvitation = async () => {
      if (!window.confirm(`⚠️ PERMANENTLY DELETE invitation for ${invitation.email}?\n\nThis CANNOT be undone!`)) {
        return;
      }
      
      setActing(true);
      try {
        await InvitationsAPI.deleteInvitation(invitation.id);
        toast({
          title: 'Invitation Deleted',
          description: `Invitation for ${invitation.email} permanently removed`,
        });
        loadInvitations();
        loadStats();
      } catch (error: any) {
        toast({
          title: 'Delete Failed',
          description: error.message || 'Failed to delete invitation',
          variant: 'destructive',
        });
      } finally {
        setActing(false);
      }
    };

    const statusConfig = {
      pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-950', label: 'Pending' },
      accepted: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950', label: 'Accepted' },
      expired: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950', label: 'Expired' },
      revoked: { icon: XCircle, color: 'text-gray-100 font-medium', bg: 'bg-gray-100 dark:bg-gray-950', label: 'Revoked' },
    };

    const config = statusConfig[invitation.status];
    const StatusIcon = config.icon;

    const expiresIn = Math.ceil((new Date(invitation.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

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
                  <h3 className="font-semibold">{invitation.name || 'Unnamed'}</h3>
                  <p className="text-sm text-muted-foreground">{invitation.email}</p>
                  {invitation.role && (
                    <Badge variant="outline" className="mt-1">
                      {invitation.role}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>
                    Sent {new Date(invitation.sent_at || invitation.created_at).toLocaleDateString()}
                  </span>
                </div>
                {invitation.status === 'pending' && expiresIn >= 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      Expires in {expiresIn} {expiresIn === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                )}
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
                    disabled={copying || acting}
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
                    disabled={acting}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={revokeInvitation}
                    disabled={acting}
                    title="Mark as revoked (keeps in database)"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Revoke
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={deleteInvitation}
                    disabled={acting}
                    className="bg-red-600 hover:bg-red-700"
                    title="PERMANENTLY DELETE (nuclear option)"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
              {/* Show delete for non-pending too */}
              {invitation.status !== 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={deleteInvitation}
                  disabled={acting}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
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
        <div className="flex gap-2">
          <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Import Invitations</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to create multiple invitations at once
                </DialogDescription>
              </DialogHeader>
              <BulkImportDialog />
            </DialogContent>
          </Dialog>
          
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
                  Send an invitation to join the skills portal
                </DialogDescription>
              </DialogHeader>
              <NewInvitationForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      {stats && (
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
      )}

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
