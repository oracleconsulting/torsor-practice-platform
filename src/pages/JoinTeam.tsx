import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Mail } from 'lucide-react';

export default function JoinTeam() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);

  const token = searchParams.get('token');
  const groupId = searchParams.get('group');

  useEffect(() => {
    if (!token || !groupId) {
      toast({
        title: "Invalid invitation",
        description: "This invitation link is missing required parameters.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    const verifyInvite = async () => {
      try {
        const { data, error } = await supabase
          .from('team_invites')
          .select('*')
          .eq('invite_token', token)
          .eq('group_id', groupId)
          .eq('status', 'pending')
          .maybeSingle();

        if (error) {
          console.error('Error verifying invite:', error);
          toast({
            title: "Error",
            description: "There was an error verifying your invitation.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        if (!data) {
          toast({
            title: "Invalid invitation",
            description: "This invitation link is invalid, expired, or has already been used.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        setInviteData(data);
      } catch (error) {
        console.error('Error verifying invite:', error);
        toast({
          title: "Error",
          description: "There was an error processing your invitation.",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    verifyInvite();
  }, [token, groupId, navigate, toast]);

  const handleAccept = () => {
    if (!token || !groupId) return;
    
    // Store the invite details for after signup/login
    localStorage.setItem('pending_group_id', groupId);
    localStorage.setItem('invite_token', token);
    localStorage.setItem('invitee_email', inviteData?.invitee_email || '');
    
    toast({
      title: "Redirecting to sign up",
      description: "You'll be added to the team after creating your account.",
    });
    
    // Redirect to auth
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-oracle-navy" />
          <p className="text-gray-600">Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return null; // Will have redirected already
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full border-oracle-gold/30 shadow-lg">
        <CardHeader className="text-center bg-gradient-to-r from-oracle-gold/5 to-blue-50/80">
          <div className="mx-auto mb-4 w-16 h-16 bg-oracle-navy rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-oracle-navy">You're Invited!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-oracle-gold" />
              <span className="font-medium text-oracle-navy">{inviteData.inviter_email}</span>
            </div>
            <p className="text-gray-700">
              has invited you to join their Oracle Method assessment journey as a <strong>{inviteData.role}</strong>.
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 mb-2 font-medium">
              Complete the assessment together to:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Align your business vision and strategy</li>
              <li>• Identify complementary strengths</li>
              <li>• Create a unified roadmap for growth</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleAccept} 
            className="w-full bg-oracle-navy hover:bg-oracle-navy/90 text-white"
            size="lg"
          >
            Accept Invitation & Join Team
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            By accepting, you'll be redirected to create your account and join the assessment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
