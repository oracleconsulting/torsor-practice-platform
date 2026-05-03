// =============================================================================
// AgentLauncher
// =============================================================================
// Global "Advisory Agent" launcher available on every admin page. Clicking
// the floating button opens a tiny client picker; choosing a client opens
// the AdvisoryAgentPanel for them. If the user is already on a route with
// a clientId in the path, the picker pre-selects that client.
//
// Mounted once inside AdminLayout so it's available everywhere without each
// page having to wire it up.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { AdvisoryAgentPanel } from './AdvisoryAgentPanel';
import { Loader2, MessageSquare, Search, Sparkles, X } from 'lucide-react';

interface ClientLite {
  id: string;
  name: string;
  client_company: string | null;
  practice_id: string;
}

export function AgentLauncher() {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const location = useLocation();
  const [showPicker, setShowPicker] = useState(false);
  const [activeClient, setActiveClient] = useState<ClientLite | null>(null);
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const practiceId = currentMember?.practice_id ?? null;

  // Detect a client id in the URL (e.g. /goal-alignment/clients/<id>)
  const urlClientId = useMemo(() => {
    const m = location.pathname.match(/\/clients\/([0-9a-f-]{36})/i);
    return m?.[1] ?? null;
  }, [location.pathname]);

  // Load practice clients lazily when picker opens
  const loadClients = useCallback(async () => {
    if (!practiceId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('practice_members')
        .select('id, name, client_company, practice_id')
        .eq('practice_id', practiceId)
        .eq('member_type', 'client')
        .order('name', { ascending: true });
      setClients((data as ClientLite[] | null) ?? []);
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  useEffect(() => {
    if (!showPicker) return;
    if (clients.length === 0) void loadClients();
  }, [showPicker, clients.length, loadClients]);

  // If the URL has a client id and user clicks the launcher, pre-select that client
  const open = useCallback(async () => {
    if (urlClientId && practiceId) {
      // Try fetching the single record so we have the name for the panel
      const { data } = await supabase
        .from('practice_members')
        .select('id, name, client_company, practice_id')
        .eq('id', urlClientId)
        .maybeSingle();
      if (data) {
        setActiveClient(data as ClientLite);
        return;
      }
    }
    setShowPicker(true);
  }, [urlClientId, practiceId]);

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.client_company ?? '').toLowerCase().includes(q),
    );
  }, [clients, searchTerm]);

  if (!practiceId) return null;

  return (
    <>
      {/* Floating button (hidden when a panel is already open) */}
      {!activeClient && (
        <button
          type="button"
          onClick={() => void open()}
          aria-label="Open Advisory Agent"
          title="Open Advisory Agent"
          className="fixed right-5 bottom-5 z-30 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span className="font-medium text-sm">Agent</span>
        </button>
      )}

      {/* Client picker */}
      {showPicker && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowPicker(false)}
            aria-hidden
          />
          <div className="fixed right-5 bottom-20 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[60vh] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-sm text-slate-900">Pick a client</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
                aria-label="Close picker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-3 py-2 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or company..."
                  className="w-full pl-7 pr-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <MessageSquare className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                  No clients found.
                </div>
              ) : (
                <ul>
                  {filteredClients.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveClient(c);
                          setShowPicker(false);
                          setSearchTerm('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                        {c.client_company && (
                          <p className="text-xs text-slate-500 truncate">{c.client_company}</p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {/* Active panel */}
      {activeClient && (
        <AdvisoryAgentPanel
          clientId={activeClient.id}
          practiceId={activeClient.practice_id}
          clientName={activeClient.name}
          companyName={activeClient.client_company ?? ''}
          onClose={() => setActiveClient(null)}
          onChangeApplied={() => {
            // No parent to refresh from the launcher path; reload of the page
            // (or a route with a client view) will re-fetch independently.
          }}
        />
      )}
    </>
  );
}
