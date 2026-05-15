import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const humaniseIndustryCode = (code: string | undefined | null): string => {
  if (!code) return '';
  const overrides: Record<string, string> = {
    SAAS_REGTECH: 'SaaS RegTech',
    SAAS_FINTECH: 'SaaS FinTech',
    SAAS_HRTECH: 'SaaS HR Tech',
    SAAS_GENERIC: 'SaaS (Generic)',
    PROFESSIONAL_SERVICES: 'Professional Services',
    ECOMMERCE: 'E-commerce',
  };
  if (overrides[code]) return overrides[code];
  return code
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

interface BenchmarkAppendixProps {
  appendix: {
    generatedAt: string;
    stage: string;
    industryCode: string;
    methodology: { summary: string; valuationMethod: string; benchmarkSource: string };
    comparableTransactions?: Array<{
      company: string;
      stage: string;
      year: number;
      amountGbp?: number;
      preMoneyGbp?: number;
      relevanceNote?: string;
    }>;
    dataSources: string[];
    limitations: string[];
    confidenceNotes: string[];
    valuationLenses?: any;
  };
}

const S = {
  text: '#334155',
  muted: '#64748b',
  light: '#94a3b8',
  border: 'rgba(22,35,64,0.08)',
  bg: 'rgba(0,0,0,0.015)',
  headerBg: 'rgba(0,0,0,0.025)',
};

export function BenchmarkAppendix({ appendix }: BenchmarkAppendixProps) {
  const [open, setOpen] = useState(false);

  const fmtCurrency = (v?: number) =>
    v != null ? `£${v.toLocaleString('en-GB', { maximumFractionDigits: 0 })}` : '—';

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const hasComparables = appendix.comparableTransactions && appendix.comparableTransactions.length > 0;

  return (
    <div style={{ border: `1px solid ${S.border}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          border: 'none',
          background: S.headerBg,
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: S.text }}>Methodology &amp; Comparables</span>
        <ChevronDown
          style={{
            width: 16,
            height: 16,
            color: S.muted,
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div style={{ padding: '16px 20px', fontSize: 12, color: S.text, lineHeight: 1.6 }}>
          {/* Methodology */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: S.text, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Methodology
            </h4>
            <p style={{ margin: 0, color: S.muted }}>{appendix.methodology.summary}</p>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: S.light }}>
                Method: <strong style={{ color: S.muted }}>{appendix.methodology.valuationMethod}</strong>
              </span>
              <span style={{ fontSize: 11, color: S.light }}>
                Source: <strong style={{ color: S.muted }}>{appendix.methodology.benchmarkSource}</strong>
              </span>
            </div>
          </div>

          {/* Comparable Transactions */}
          {hasComparables && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: S.text, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Comparable Transactions
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                      {['Company', 'Stage', 'Year', 'Amount', 'Pre-Money', 'Relevance'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: S.light, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {appendix.comparableTransactions!.map((tx, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${S.border}` }}>
                        <td style={{ padding: '6px 8px', color: S.text, fontWeight: 500 }}>{tx.company}</td>
                        <td style={{ padding: '6px 8px', color: S.muted }}>{tx.stage}</td>
                        <td style={{ padding: '6px 8px', color: S.muted }}>{tx.year}</td>
                        <td style={{ padding: '6px 8px', color: S.muted, fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(tx.amountGbp)}</td>
                        <td style={{ padding: '6px 8px', color: S.muted, fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(tx.preMoneyGbp)}</td>
                        <td style={{ padding: '6px 8px', fontSize: 12, color: '#666', lineHeight: 1.5, maxWidth: 280, minWidth: 120, verticalAlign: 'top' }}>
                          {tx.relevanceNote || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Data Sources */}
          {appendix.dataSources.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: S.text, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Data Sources
              </h4>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {appendix.dataSources.map((src, i) => (
                  <li key={i} style={{ color: S.muted, marginBottom: 2 }}>{src}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Limitations & Confidence */}
          {(appendix.limitations.length > 0 || appendix.confidenceNotes.length > 0) && (
            <div style={{ marginBottom: 12 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: S.text, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Limitations &amp; Confidence
              </h4>
              {appendix.limitations.length > 0 && (
                <ul style={{ margin: '0 0 6px', paddingLeft: 18 }}>
                  {appendix.limitations.map((lim, i) => (
                    <li key={i} style={{ color: S.muted, marginBottom: 2 }}>{lim}</li>
                  ))}
                </ul>
              )}
              {appendix.confidenceNotes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {appendix.confidenceNotes.map((note, i) => (
                    <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: S.bg, color: S.light, border: `1px solid ${S.border}` }}>
                      {note}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <p style={{ margin: 0, fontSize: 10, color: S.light, borderTop: `1px solid ${S.border}`, paddingTop: 10 }}>
            Generated {fmtDate(appendix.generatedAt)} for industry {humaniseIndustryCode(appendix.industryCode)}
          </p>
        </div>
      )}
    </div>
  );
}
