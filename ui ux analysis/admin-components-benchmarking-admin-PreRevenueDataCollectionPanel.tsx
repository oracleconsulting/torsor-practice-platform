import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { AlertTriangle, Clock, CheckCircle, Send, FileText, SkipForward } from 'lucide-react';

interface DataGap {
  field: string;
  label: string;
  sourceTable: string;
  type: string;
  rationale: string;
  drives?: string[];
  severity: string;
}

interface PreRevenueDataCollectionPanelProps {
  engagementId: string;
  gaps?: DataGap[];
  onRefresh?: () => void;
}

const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string; icon: typeof Clock }> = {
  pending: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', icon: AlertTriangle },
  sent: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af', icon: Send },
  answered: { bg: '#f0fdf4', border: '#86efac', text: '#166534', icon: CheckCircle },
  skipped: { bg: '#f9fafb', border: '#d1d5db', text: '#6b7280', icon: SkipForward },
};

export function PreRevenueDataCollectionPanel({ engagementId, gaps, onRefresh }: PreRevenueDataCollectionPanelProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [engagementId]);

  const loadRequests = async () => {
    const { data } = await supabase
      .from('bm_client_data_requests')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('created_at', { ascending: true });
    setRequests(data || []);
    setLoading(false);
  };

  const handleMarkSent = async (requestId: string) => {
    await supabase
      .from('bm_client_data_requests')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    loadRequests();
  };

  const handleMarkAnswered = async (requestId: string) => {
    await supabase
      .from('bm_client_data_requests')
      .update({ status: 'answered', responded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', requestId);
    loadRequests();
    onRefresh?.();
  };

  const handleSkip = async (requestId: string) => {
    await supabase
      .from('bm_client_data_requests')
      .update({ status: 'skipped', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    loadRequests();
  };

  const pendingCount = requests.filter(r => r.status === 'pending' || r.status === 'sent').length;
  const answeredCount = requests.filter(r => r.status === 'answered').length;
  const totalCount = requests.length;
  const progressPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  const grouped = {
    pending: requests.filter(r => r.status === 'pending'),
    sent: requests.filter(r => r.status === 'sent'),
    answered: requests.filter(r => r.status === 'answered'),
    skipped: requests.filter(r => r.status === 'skipped'),
  };
  const orderedRequests = [...grouped.pending, ...grouped.sent, ...grouped.answered, ...grouped.skipped];

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        <Clock style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.4 }} />
        <p style={{ fontSize: 14 }}>Loading data requests...</p>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        <FileText style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.4 }} />
        <p style={{ fontSize: 14, fontWeight: 500 }}>No data requests yet</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>Data gap requests will appear here after analysis generation</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
      {/* Summary bar */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
            Data Collection Progress
          </span>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            {answeredCount} of {totalCount} data points collected
            {pendingCount > 0 && (
              <span style={{ marginLeft: 8, color: '#d97706', fontWeight: 500 }}>
                ({pendingCount} outstanding)
              </span>
            )}
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              borderRadius: 3,
              background: progressPct === 100 ? '#22c55e' : '#3b82f6',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Request cards */}
      <div style={{ padding: '12px 20px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orderedRequests.map((req) => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const drives = req.drives || req.metadata?.drives || [];

            return (
              <div
                key={req.id}
                style={{
                  border: `1px solid ${cfg.border}`,
                  borderRadius: 8,
                  background: cfg.bg,
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                        {req.label || req.field_name || req.field}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 500,
                          background: cfg.border,
                          color: cfg.text,
                        }}
                      >
                        <StatusIcon style={{ width: 12, height: 12 }} />
                        {req.status}
                      </span>
                    </div>

                    {req.rationale && (
                      <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
                        {req.rationale}
                      </p>
                    )}

                    {drives.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Drives:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                          {drives.map((d: string, i: number) => (
                            <span
                              key={i}
                              style={{
                                padding: '1px 8px',
                                borderRadius: 4,
                                fontSize: 11,
                                background: '#e2e8f0',
                                color: '#475569',
                              }}
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    {req.status === 'pending' && (
                      <button
                        onClick={() => handleMarkSent(req.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '5px 10px',
                          fontSize: 12,
                          fontWeight: 500,
                          borderRadius: 6,
                          border: '1px solid #93c5fd',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          cursor: 'pointer',
                        }}
                      >
                        <Send style={{ width: 12, height: 12 }} />
                        Mark Sent
                      </button>
                    )}
                    {(req.status === 'pending' || req.status === 'sent') && (
                      <>
                        <button
                          onClick={() => handleMarkAnswered(req.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 10px',
                            fontSize: 12,
                            fontWeight: 500,
                            borderRadius: 6,
                            border: '1px solid #86efac',
                            background: '#f0fdf4',
                            color: '#15803d',
                            cursor: 'pointer',
                          }}
                        >
                          <CheckCircle style={{ width: 12, height: 12 }} />
                          Mark Answered
                        </button>
                        <button
                          onClick={() => handleSkip(req.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 10px',
                            fontSize: 12,
                            fontWeight: 500,
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            background: '#f9fafb',
                            color: '#6b7280',
                            cursor: 'pointer',
                          }}
                        >
                          <SkipForward style={{ width: 12, height: 12 }} />
                          Skip
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
