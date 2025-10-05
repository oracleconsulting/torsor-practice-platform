import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  CreditCard, 
  Users, 
  Building2, 
  TrendingUp, 
  Check, 
  X, 
  AlertCircle,
  Download,
  Calendar,
  Zap,
  Shield,
  BarChart3,
  Briefcase,
  GraduationCap,
  Plus,
  Minus
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SubscriptionTier {
  tier_id: string;
  name: string;
  price_monthly: number;
  price_annually: number;
  features: string[];
  max_users: number;
  max_clients: number | null;
  popular?: boolean;
}

interface BoltOn {
  bolt_on_id: string;
  name: string;
  description: string;
  price_monthly: number;
  tier_restrictions?: string[];
  icon?: string;
}

interface CurrentSubscription {
  subscription_id?: string;
  tier: SubscriptionTier | string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  bolt_ons: any[];
  usage: {
    users: { current: number; limit: number };
    clients: { current: number; limit: number | null };
  };
  billing_interval: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  invoice_url?: string;
}

const ManageSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [availableTiers, setAvailableTiers] = useState<SubscriptionTier[]>([]);
  const [availableBoltOns, setAvailableBoltOns] = useState<BoltOn[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedBoltOns, setSelectedBoltOns] = useState<string[]>([]);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annually'>('monthly');
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      // Fetch current subscription
      const subResponse = await fetch('/api/subscriptions/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const subData = await subResponse.json();
      setCurrentSubscription(subData);

      // Fetch available tiers
      const tiersResponse = await fetch('/api/subscriptions/tiers');
      const tiersData = await tiersResponse.json();
      setAvailableTiers(tiersData.tiers || []);

      // Fetch available bolt-ons for current tier
      const currentTierId = typeof subData.tier === 'object' ? subData.tier.tier_id : 'free';
      const boltOnsResponse = await fetch(`/api/subscriptions/bolt-ons/${currentTierId}`);
      const boltOnsData = await boltOnsResponse.json();
      setAvailableBoltOns(boltOnsData.bolt_ons || []);

      // Fetch invoices
      const invoicesResponse = await fetch('/api/subscriptions/invoices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const invoicesData = await invoicesResponse.json();
      setInvoices(invoicesData.invoices || []);

      // Set selected tier to current tier
      setSelectedTier(currentTierId);
      
      // Set selected bolt-ons to current active bolt-ons
      if (subData.bolt_ons) {
        setSelectedBoltOns(subData.bolt_ons.map((bo: any) => bo.bolt_on_id));
      }

    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tier_id: selectedTier,
          bolt_on_ids: selectedBoltOns,
          billing_interval: billingInterval
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Failed to upgrade subscription. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: 'User requested cancellation'
        })
      });

      if (response.ok) {
        alert('Subscription cancelled successfully');
        fetchSubscriptionData();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    }
  };

  const toggleBoltOn = (boltOnId: string) => {
    setSelectedBoltOns(prev => 
      prev.includes(boltOnId) 
        ? prev.filter(id => id !== boltOnId)
        : [...prev, boltOnId]
    );
  };

  const calculateTotal = () => {
    const tier = availableTiers.find(t => t.tier_id === selectedTier);
    if (!tier) return 0;

    const tierPrice = billingInterval === 'monthly' ? tier.price_monthly : tier.price_annually / 12;
    const boltOnTotal = selectedBoltOns.reduce((total, boltOnId) => {
      const boltOn = availableBoltOns.find(bo => bo.bolt_on_id === boltOnId);
      return total + (boltOn?.price_monthly || 0);
    }, 0);

    return tierPrice + boltOnTotal;
  };

  const getBoltOnIcon = (icon?: string) => {
    switch (icon) {
      case 'zap': return <Zap className="h-4 w-4" />;
      case 'shield': return <Shield className="h-4 w-4" />;
      case 'chart': return <BarChart3 className="h-4 w-4" />;
      case 'briefcase': return <Briefcase className="h-4 w-4" />;
      case 'graduation': return <GraduationCap className="h-4 w-4" />;
      default: return <Plus className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  const currentTier = typeof currentSubscription?.tier === 'object' ? currentSubscription.tier : null;
  const isFreeTier = !currentTier || currentTier.tier_id === 'free';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
        <p className="text-gray-400">Manage your PRAXIS subscription, bolt-ons, and billing</p>
      </div>

      {/* Current Plan Overview */}
      <Card className="mb-8 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Current Plan
            {currentSubscription?.status === 'active' ? (
              <Badge className="bg-green-500/20 text-green-400">Active</Badge>
            ) : (
              <Badge variant="secondary">Free Tier</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {currentTier?.name || 'Free Tier'}
              </h3>
              <p className="text-2xl font-bold text-orange-500 mb-4">
                {isFreeTier ? 'Free' : formatCurrency((currentTier?.price_monthly || 0), 'GBP')}
                {!isFreeTier && <span className="text-sm text-gray-400">/month</span>}
              </p>
              
              {currentSubscription?.current_period_end && (
                <p className="text-sm text-gray-400 mb-4">
                  Next billing date: {formatDate(currentSubscription.current_period_end)}
                </p>
              )}

              {/* Active Bolt-ons */}
              {currentSubscription?.bolt_ons && currentSubscription.bolt_ons.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Active Bolt-ons:</h4>
                  <div className="space-y-1">
                    {currentSubscription.bolt_ons.map((boltOn: any) => (
                      <div key={boltOn.bolt_on_id} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{boltOn.bolt_ons?.name}</span>
                        <span className="text-sm text-gray-400">
                          (+{formatCurrency(boltOn.bolt_ons?.price_monthly || 0, 'GBP')}/mo)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Usage Statistics */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Members
                  </span>
                  <span className="text-sm">
                    {currentSubscription?.usage.users.current} / {currentSubscription?.usage.users.limit}
                  </span>
                </div>
                <Progress 
                  value={(currentSubscription?.usage.users.current || 0) / (currentSubscription?.usage.users.limit || 1) * 100} 
                  className="h-2"
                />
              </div>

              {currentSubscription?.usage.clients.limit && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Clients
                    </span>
                    <span className="text-sm">
                      {currentSubscription.usage.clients.current} / {currentSubscription.usage.clients.limit}
                    </span>
                  </div>
                  <Progress 
                    value={(currentSubscription.usage.clients.current || 0) / (currentSubscription.usage.clients.limit || 1) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
          <TabsTrigger value="bolt-ons">Bolt-ons</TabsTrigger>
          <TabsTrigger value="billing">Billing & Invoices</TabsTrigger>
        </TabsList>

        {/* Plans & Pricing Tab */}
        <TabsContent value="plans" className="space-y-6">
          {/* Billing Interval Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-800 rounded-lg">
            <span className={billingInterval === 'monthly' ? 'font-semibold' : 'text-gray-400'}>
              Monthly
            </span>
            <Switch
              checked={billingInterval === 'annually'}
              onCheckedChange={(checked) => setBillingInterval(checked ? 'annually' : 'monthly')}
            />
            <span className={billingInterval === 'annually' ? 'font-semibold' : 'text-gray-400'}>
              Annual
              <Badge className="ml-2 bg-green-500/20 text-green-400">Save 20%</Badge>
            </span>
          </div>

          {/* Tier Selection */}
          <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
            <div className="grid md:grid-cols-3 gap-6">
              {availableTiers.map((tier) => (
                <Card 
                  key={tier.tier_id}
                  className={`relative cursor-pointer transition-all ${
                    selectedTier === tier.tier_id 
                      ? 'ring-2 ring-orange-500 border-orange-500' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedTier(tier.tier_id)}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{tier.name}</CardTitle>
                        <CardDescription>
                          Up to {tier.max_users} users
                          {tier.max_clients && ` • ${tier.max_clients} clients`}
                        </CardDescription>
                      </div>
                      <RadioGroupItem value={tier.tier_id} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">
                        {formatCurrency(
                          billingInterval === 'monthly' 
                            ? tier.price_monthly 
                            : tier.price_annually / 12,
                          'GBP'
                        )}
                      </span>
                      <span className="text-gray-400">/month</span>
                      {billingInterval === 'annually' && (
                        <p className="text-sm text-gray-400 mt-1">
                          {formatCurrency(tier.price_annually, 'GBP')} billed annually
                        </p>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </RadioGroup>

          {/* Upgrade Summary */}
          {selectedTier && selectedTier !== (currentTier?.tier_id || 'free') && (
            <Alert className="border-orange-500/50 bg-orange-500/10">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <AlertTitle>Subscription Change Summary</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="space-y-2">
                  <p>
                    Upgrading from <strong>{currentTier?.name || 'Free Tier'}</strong> to{' '}
                    <strong>{availableTiers.find(t => t.tier_id === selectedTier)?.name}</strong>
                  </p>
                  <p className="text-lg font-semibold">
                    New monthly cost: {formatCurrency(calculateTotal(), 'GBP')}
                    {selectedBoltOns.length > 0 && ' (including bolt-ons)'}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-4">
            {!isFreeTier && (
              <Button variant="outline" onClick={handleCancelSubscription}>
                Cancel Subscription
              </Button>
            )}
            <Button 
              onClick={handleUpgrade}
              disabled={upgrading || selectedTier === (currentTier?.tier_id || 'free')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {upgrading ? 'Processing...' : 'Upgrade Plan'}
            </Button>
          </div>
        </TabsContent>

        {/* Bolt-ons Tab */}
        <TabsContent value="bolt-ons" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {availableBoltOns.map((boltOn) => {
              const isActive = currentSubscription?.bolt_ons?.some(
                (bo: any) => bo.bolt_on_id === boltOn.bolt_on_id && bo.status === 'active'
              );
              const isSelected = selectedBoltOns.includes(boltOn.bolt_on_id);

              return (
                <Card 
                  key={boltOn.bolt_on_id}
                  className={`cursor-pointer transition-all ${
                    isActive || isSelected
                      ? 'ring-2 ring-orange-500 border-orange-500' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => !isActive && toggleBoltOn(boltOn.bolt_on_id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getBoltOnIcon(boltOn.icon)}
                        <div>
                          <CardTitle className="text-lg">{boltOn.name}</CardTitle>
                          <CardDescription>{boltOn.description}</CardDescription>
                        </div>
                      </div>
                      {isActive ? (
                        <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                      ) : (
                        <div className="text-right">
                          <p className="font-semibold">
                            +{formatCurrency(boltOn.price_monthly, 'GBP')}
                          </p>
                          <p className="text-sm text-gray-400">per month</p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {selectedBoltOns.filter(id => 
            !currentSubscription?.bolt_ons?.some((bo: any) => bo.bolt_on_id === id && bo.status === 'active')
          ).length > 0 && (
            <div className="flex justify-end">
              <Button 
                onClick={handleUpgrade}
                disabled={upgrading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {upgrading ? 'Processing...' : 'Add Selected Bolt-ons'}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Billing & Invoices Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Payment Method</p>
                    <p className="text-sm text-gray-400">•••• •••• •••• 4242</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Billing Email</p>
                  <p className="text-sm text-gray-400">billing@practice.com</p>
                </div>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>Download your past invoices and receipts</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No invoices yet</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            Invoice #{invoice.id.slice(-8)}
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatDate(invoice.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(invoice.amount, 'GBP')}
                          </p>
                          <Badge 
                            className={
                              invoice.status === 'paid' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                        {invoice.invoice_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(invoice.invoice_url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManageSubscriptionPage; 