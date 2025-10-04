// src/components/integrations/XeroIntegration.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface XeroData {
  cash_position: number;
  monthly_revenue: number;
  monthly_expenses: number;
  bank_accounts: Array<{
    Name: string;
    AccountID: string;
    Status: string;
    BankAccountNumber: string;
  }>;
  last_updated: string;
}

export const XeroIntegration: React.FC = () => {
  const { user } = useAuth();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loadingGroupId, setLoadingGroupId] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [xeroData, setXeroData] = useState<XeroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch group_id from client_intake table
  useEffect(() => {
    const fetchGroupId = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email) {
          const { data, error } = await supabase
            .from('client_intake')
            .select('group_id')
            .eq('email', userData.user.email)
            .single();
          
          if (error) {
            console.error('Error fetching group_id:', error);
          } else if (data?.group_id) {
            setGroupId(data.group_id);
          }
        }
      } catch (error) {
        console.error('Error fetching group_id:', error);
      } finally {
        setLoadingGroupId(false);
      }
    };

    fetchGroupId();
  }, []);

  // Check connection status once we have group_id
  useEffect(() => {
    if (!loadingGroupId && groupId) {
      checkConnectionStatus();
    } else if (!loadingGroupId) {
      setLoading(false);
    }
  }, [loadingGroupId, groupId]);

  // Check URL params for callback status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('integration') === 'xero') {
      if (urlParams.get('status') === 'success') {
        setIsConnected(true);
        if (groupId) {
          fetchXeroData();
        }
      } else if (urlParams.get('status') === 'error') {
        setError(urlParams.get('message') || 'Failed to connect to Xero');
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [groupId]);

  const checkConnectionStatus = async () => {
    if (!groupId) return;
    
    try {
      const { data: integration, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('group_id', groupId)
        .eq('integration_type', 'xero')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking Xero connection:', error);
      }

      if (integration) {
        setIsConnected(true);
        fetchXeroData();
      }
    } catch (error) {
      console.error('Error checking Xero connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectToXero = async () => {
    if (!groupId) {
      setError('Unable to connect: User group not found');
      return;
    }

    setIsConnecting(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://oracle-api-server-production.up.railway.app/api/integrations/xero/connect?group_id=${groupId}`,
        {
          headers: {
            'X-API-Key': import.meta.env.VITE_API_KEY
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }
      
      const data = await response.json();
      if (data.auth_url) {
        // Redirect to Xero OAuth
        window.location.href = data.auth_url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Xero connection error:', error);
      setError('Failed to initiate Xero connection. Please try again.');
      setIsConnecting(false);
    }
  };

  const fetchXeroData = async () => {
    if (!groupId) return;
    
    try {
      const response = await fetch(
        `https://oracle-api-server-production.up.railway.app/api/integrations/xero/data/cashflow?group_id=${groupId}`,
        {
          headers: {
            'X-API-Key': import.meta.env.VITE_API_KEY
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setXeroData(data);
      }
    } catch (error) {
      console.error('Error fetching Xero data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  if (loading || loadingGroupId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="animate-spin h-6 w-6" />
        </CardContent>
      </Card>
    );
  }

  if (!groupId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img src="/xero-logo.png" alt="Xero" className="h-6 w-6" />
            Xero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-yellow-50 text-yellow-700 rounded-md">
            <p>Complete Part 1 of the assessment to enable integrations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img src="/xero-logo.png" alt="Xero" className="h-6 w-6" />
            Xero
          </CardTitle>
          <CardDescription>
            Sync your accounting data for real-time financial insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <Button 
            onClick={connectToXero} 
            disabled={isConnecting}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Xero Account'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="font-bold text-green-600 text-xl">XERO</span>
            </CardTitle>
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Financial Overview */}
      {xeroData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cash Position */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cash Position
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <span className="text-2xl font-bold">
                    {formatCurrency(xeroData.cash_position)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Revenue */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Monthly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-2xl font-bold">
                    {formatCurrency(xeroData.monthly_revenue)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Expenses */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Monthly Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-2xl font-bold">
                    {formatCurrency(xeroData.monthly_expenses)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bank Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Connected Bank Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {xeroData.bank_accounts.map((account) => (
                  <div key={account.AccountID} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{account.Name}</span>
                    <Badge variant="secondary">{account.Status}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Last updated: {new Date(xeroData.last_updated).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
