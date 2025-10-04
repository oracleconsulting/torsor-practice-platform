import { supabase } from '@/lib/supabase/client';

// Optional Stripe import - will be undefined if package not installed
let stripePromise: any = null;
try {
  const { loadStripe } = require('@stripe/stripe-js');
  stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
} catch (error) {
  console.warn('Stripe package not available');
}

export const subscriptionService = {
  async createCheckoutSession(tier: string, priceId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await fetch('/api/accountancy/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, priceId }),
      });

      const { checkout_url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = checkout_url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  async checkFeatureAccess(feature: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/accountancy/subscription/check-access/${feature}`);
      const { has_access } = await response.json();
      return has_access;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  },

  async trackFeatureUsage(feature: string) {
    try {
      await fetch(`/api/accountancy/subscription/track-usage/${feature}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error tracking feature usage:', error);
    }
  },

  async getCurrentSubscription() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_tiers (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  },

  async cancelSubscription() {
    try {
      const response = await fetch('/api/accountancy/subscription/cancel', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to cancel subscription');
      
      return await response.json();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  },

  async getSubscriptionTiers() {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting subscription tiers:', error);
      return [];
    }
  },

  async getFeatureUsage() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('feature_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting feature usage:', error);
      return [];
    }
  }
}; 