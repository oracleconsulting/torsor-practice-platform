import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, Download, Check, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY!);

interface Invoice {
  id: string;
  number: string;
  date: string;
  due_date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  pdf_url: string;
}

interface PaymentPortalProps {
  clientId: string;
  portalId: string;
}

const PaymentForm: React.FC<{ invoice: Invoice; onSuccess: () => void }> = ({ 
  invoice, 
  onSuccess 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoice.id,
          amount: invoice.amount
        })
      });

      const { client_secret } = await response.json();

      // Confirm payment
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (err) {
      setError('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-700 rounded-lg p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': {
                  color: '#9ca3af',
                },
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Pay ${invoice.amount.toFixed(2)}
          </>
        )}
      </button>
    </form>
  );
};

export const PaymentPortal: React.FC<PaymentPortalProps> = ({ clientId, portalId }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`/api/invoices?client_id=${clientId}`);
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedInvoice(null);
    fetchInvoices(); // Refresh invoice list
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Outstanding</span>
            <DollarSign className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            ${invoices
              .filter(inv => inv.status !== 'paid')
              .reduce((sum, inv) => sum + inv.amount, 0)
              .toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Overdue</span>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {invoices.filter(inv => inv.status === 'overdue').length}
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Paid This Year</span>
            <Check className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            ${invoices
              .filter(inv => inv.status === 'paid')
              .reduce((sum, inv) => sum + inv.amount, 0)
              .toFixed(2)}
          </p>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-gray-800 rounded-xl">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Invoices</h3>
        </div>
        
        <div className="divide-y divide-gray-700">
          {invoices.map(invoice => (
            <div
              key={invoice.id}
              className="p-6 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <p className="text-white font-medium">
                      Invoice #{invoice.number}
                    </p>
                    <span className={`
                      px-2 py-1 rounded-full text-xs
                      ${invoice.status === 'paid' 
                        ? 'bg-green-500/20 text-green-400'
                        : invoice.status === 'overdue'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-orange-500/20 text-orange-400'
                      }
                    `}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {new Date(invoice.date).toLocaleDateString()}
                    </span>
                    <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-2xl font-bold text-white">
                    ${invoice.amount.toFixed(2)}
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(invoice.pdf_url, '_blank')}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    {invoice.status !== 'paid' && (
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowPaymentForm(true);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentForm && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Pay Invoice #{selectedInvoice.number}
            </h3>
            
            <Elements stripe={stripePromise}>
              <PaymentForm
                invoice={selectedInvoice}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
            
            <button
              onClick={() => setShowPaymentForm(false)}
              className="w-full mt-4 px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}; 