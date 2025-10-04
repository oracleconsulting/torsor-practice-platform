import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Users, 
  Copy, 
  Check, 
  Star, 
  TrendingUp,
  Zap,
  Trophy
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ReferralData {
  referral_code: string;
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  rewards_earned: string[];
}

interface ReferralProgramProps {
  groupId: string;
  userEmail: string;
}

export function ReferralProgram({ groupId, userEmail }: ReferralProgramProps) {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReferralData();
  }, [groupId]);

  const fetchReferralData = async () => {
    try {
      // Check if user already has a referral code
      const { data: existingReferrals, error: fetchError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_group_id', groupId);

      if (fetchError) throw fetchError;

      // Generate referral code if doesn't exist
      let referralCode = '';
      if (!existingReferrals || existingReferrals.length === 0) {
        referralCode = generateReferralCode(userEmail);
        const { error: insertError } = await supabase
          .from('referrals')
          .insert({
            referrer_group_id: groupId,
            referral_code: referralCode,
            status: 'pending'
          });

        if (insertError) throw insertError;
      } else {
        // Get stats from existing referrals
        referralCode = existingReferrals[0].referral_code;
      }

      // Calculate stats
      const stats = calculateReferralStats(existingReferrals || []);
      setReferralData({
        referral_code: referralCode,
        ...stats
      });
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = (email: string): string => {
    const prefix = email.split('@')[0].slice(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${random}`;
  };

  const calculateReferralStats = (referrals: any[]) => {
    const successful = referrals.filter(r => r.status === 'converted').length;
    const pending = referrals.filter(r => r.status === 'signed_up').length;
    
    const rewards = [];
    if (successful >= 1) rewards.push('1 Month Free');
    if (successful >= 3) rewards.push('Lifetime Pilot Pricing (50% off)');
    if (successful >= 5) rewards.push('Early Access to New Features');

    return {
      total_referrals: referrals.length,
      successful_referrals: successful,
      pending_referrals: pending,
      rewards_earned: rewards
    };
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/signup?ref=${referralData?.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  if (loading) {
    return (
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  const referralLink = `${window.location.origin}/signup?ref=${referralData?.referral_code}`;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-900">
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Pilot Referral Program</h2>
                <p className="text-gray-400">Share Oracle AI and earn exclusive rewards</p>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
              Limited Time
            </Badge>
          </div>

          {/* Referral Link */}
          <div className="mt-6">
            <label className="text-sm text-gray-400 mb-2 block">Your Referral Link</label>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="bg-gray-800/50 border-gray-700 text-white font-mono text-sm"
              />
              <Button
                onClick={copyReferralLink}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white min-w-[100px]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">{referralData?.total_referrals || 0}</span>
            </div>
            <p className="text-gray-400">Total Referrals</p>
          </Card>

          <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold text-white">{referralData?.successful_referrals || 0}</span>
            </div>
            <p className="text-gray-400">Successful</p>
          </Card>

          <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{referralData?.pending_referrals || 0}</span>
            </div>
            <p className="text-gray-400">Pending</p>
          </Card>
        </div>

        {/* Rewards */}
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Rewards Tiers
          </h3>
          
          <div className="space-y-4">
            {[
              {
                referrals: 1,
                reward: '1 Month Free',
                description: 'Get your next month of Oracle AI completely free',
                earned: (referralData?.successful_referrals || 0) >= 1
              },
              {
                referrals: 3,
                reward: 'Lifetime Pilot Pricing',
                description: 'Lock in 50% off regular pricing forever',
                earned: (referralData?.successful_referrals || 0) >= 3
              },
              {
                referrals: 5,
                reward: 'Early Access Program',
                description: 'Be the first to try new features and integrations',
                earned: (referralData?.successful_referrals || 0) >= 5
              }
            ].map((tier, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-lg border ${
                  tier.earned 
                    ? 'bg-green-900/20 border-green-500/50' 
                    : 'bg-gray-800/50 border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Star className={`w-5 h-5 ${tier.earned ? 'text-yellow-400' : 'text-gray-500'}`} />
                      <h4 className="font-semibold text-white">{tier.reward}</h4>
                      {tier.earned && (
                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                          Earned!
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{tier.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{tier.referrals}</span>
                    <p className="text-xs text-gray-500">referrals</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Share Options */}
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Share With Your Network</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { platform: 'LinkedIn', color: 'from-blue-600 to-blue-700', bgColor: 'bg-blue-600' },
              { platform: 'Twitter', color: 'from-sky-500 to-sky-600', bgColor: 'bg-sky-500' },
              { platform: 'Email', color: 'from-gray-600 to-gray-700', bgColor: 'bg-gray-600' },
              { platform: 'Slack', color: 'from-purple-600 to-purple-700', bgColor: 'bg-purple-600' }
            ].map((platform) => (
              <Button
                key={platform.platform}
                variant="outline"
                className="border-gray-700 hover:border-gray-600 bg-gray-800/30 hover:bg-gray-700/50 text-white"
                onClick={() => {
                  // Implement sharing logic
                  toast({
                    title: "Coming Soon",
                    description: `${platform.platform} sharing will be available soon!`,
                  });
                }}
              >
                <div className={`w-4 h-4 rounded ${platform.bgColor} mr-2`} />
                {platform.platform}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
