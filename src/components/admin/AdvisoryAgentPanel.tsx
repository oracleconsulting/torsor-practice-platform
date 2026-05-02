// =============================================================================
// AdvisoryAgentPanel
// =============================================================================
// Slide-over chat panel that lets an advisor talk to the in-platform AI
// advisory agent for a single client. Tokenises every outbound message,
// de-tokenises every inbound reply, and surfaces any "proposed change" blocks
// from the agent as one-click approve/reject cards.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { GDPRTokeniser } from '../../utils/gdprTokeniser';
import {
  buildAgentContext,
  buildContextSnapshot,
  formatContextForPrompt,
} from '../../utils/agentContextBuilder';
import {
  Check,
  Loader2,
  MessageSquare,
  Send,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';

interface ProposedChange {
  stage_type: string;
  json_path: string;
  new_value: string;
  reason: string;
}

interface PendingChange extends ProposedChange {
  status: 'pending' | 'applying' | 'approved' | 'rejected' | 'failed';
  error?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  /** What the advisor sees in the bubble (de-tokenised). */
  displayContent: string;
  /** What was sent to / received from the LLM (tokenised). */
  tokenisedContent: string;
  proposedChanges?: ProposedChange[];
  createdAt: string;
}

export interface AdvisoryAgentPanelProps {
  clientId: string;
  practiceId: string;
  clientName: string;
  companyName: string;
  directors?: Array<{ name: string; role?: string }>;
  staffNames?: string[];
  financials?: Record<string, number | string>;
  onClose: () => void;
  onChangeApplied: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  fit_assessment: 'Fit Profile',
  five_year_vision: '5-Year Vision',
  six_month_shift: '6-Month Shift',
  sprint_plan: 'Sprint Plan',
  sprint_plan_part1: 'Sprint Plan (Wks 1-6)',
  sprint_plan_part2: 'Sprint Plan (Wks 7-12)',
  value_analysis: 'Value Analysis',
  advisory_brief: 'Advisory Brief',
  insight_report: 'Insight Report',
  director_alignment: 'Director Alignment',
};

export function AdvisoryAgentPanel(props: AdvisoryAgentPanelProps) {
  const {
    clientId,
    practiceId,
    clientName,
    companyName,
    directors,
    staffNames,
    financials,
    onClose,
    onChangeApplied,
  } = props;

  const tokeniser = useMemo(
    () =>
      new GDPRTokeniser({
        clientName,
        companyName,
        directors,
        staffNames,
        financials,
      }),
    [clientName, companyName, directors, staffNames, financials],
  );

  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const tokeniserRef = useRef(tokeniser);
  tokeniserRef.current = tokeniser;

  // -------------------------------------------------------------------------
  // Thread bootstrap
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: existing } = await supabase
          .from('client_chat_threads')
          .select('id')
          .eq('client_id', clientId)
          .eq('practice_id', practiceId)
          .eq('thread_type', 'advisory_agent')
          .eq('status', 'active')
          .maybeSingle();

        let id = existing?.id ?? null;

        if (!id) {
          const snapshot = buildContextSnapshot({
            name: clientName,
            client_company: companyName,
          });
          const { data: created, error: createErr } = await supabase
            .from('client_chat_threads')
            .insert({
              client_id: clientId,
              practice_id: practiceId,
              title: `Advisory Agent — ${clientName}`,
              thread_type: 'advisory_agent',
              status: 'active',
              context_snapshot: snapshot,
            })
            .select('id')
            .single();
          if (createErr) throw createErr;
          id = created?.id ?? null;
        }

        if (!id || cancelled) return;
        setThreadId(id);

        // Load history
        const { data: rows } = await supabase
          .from('client_chat_messages')
          .select('id, role, content, metadata, created_at')
          .eq('thread_id', id)
          .order('created_at', { ascending: true });

        if (cancelled) return;
        if (rows && rows.length > 0) {
          setMessages(
            rows.map((m: any) => ({
              id: m.id,
              role: m.role === 'assistant' ? 'assistant' : 'user',
              displayContent:
                m.metadata?.displayContent ?? tokeniserRef.current.detokenise(m.content),
              tokenisedContent: m.content,
              proposedChanges: m.metadata?.proposedChanges,
              createdAt: m.created_at,
            })),
          );
        }
      } catch (err) {
        console.error('[AdvisoryAgentPanel] bootstrap error:', err);
        setError(
          err instanceof Error
            ? `Couldn't load advisor agent: ${err.message}`
            : "Couldn't load advisor agent",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, practiceId, clientName, companyName]);

  // -------------------------------------------------------------------------
  // Auto-scroll
  // -------------------------------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, sending]);

  // -------------------------------------------------------------------------
  // Send message
  // -------------------------------------------------------------------------

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !threadId || sending) return;

    const realMessage = input.trim();
    setInput('');
    setSending(true);
    setError(null);

    const tokenisedMessage = tokeniser.tokenise(realMessage);
    const tempId = `temp-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        role: 'user',
        displayContent: realMessage,
        tokenisedContent: tokenisedMessage,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const { data: userResp } = await supabase.auth.getUser();
      const userId = userResp?.user?.id ?? null;

      // Resolve the practice_member id for the current auth user (used for sent_by).
      const { data: memberRow } = await supabase
        .from('practice_members')
        .select('id')
        .eq('user_id', userId)
        .eq('practice_id', practiceId)
        .maybeSingle();
      const sentBy = memberRow?.id ?? null;

      // Persist the user message (tokenised content + display copy in metadata)
      await supabase.from('client_chat_messages').insert({
        thread_id: threadId,
        role: 'user',
        content: tokenisedMessage,
        sent_by: sentBy,
        metadata: { displayContent: realMessage, wasTokenised: true },
      });

      // Build and tokenise the client context just-in-time.
      const ctx = await buildAgentContext(supabase, clientId);
      const contextString = formatContextForPrompt(ctx);
      const tokenisedContext = tokeniser.tokenise(contextString);

      // Build the conversation history for the LLM (tokenised content only).
      const history = messages.map((m) => ({
        role: m.role,
        content: m.tokenisedContent,
      }));

      const { data: agentResp, error: invokeErr } = await supabase.functions.invoke(
        'advisory-agent',
        {
          body: {
            threadId,
            message: tokenisedMessage,
            context: tokenisedContext,
            conversationHistory: history,
          },
        },
      );
      if (invokeErr) throw invokeErr;
      if (!agentResp?.ok && agentResp?.error) throw new Error(agentResp.error);

      const tokenisedReply = String(agentResp?.message ?? '');
      const displayReply = tokeniser.detokenise(tokenisedReply);
      const proposedChanges: ProposedChange[] = Array.isArray(agentResp?.proposedChanges)
        ? agentResp.proposedChanges
        : [];

      await supabase.from('client_chat_messages').insert({
        thread_id: threadId,
        role: 'assistant',
        content: tokenisedReply,
        llm_model: agentResp?.model ?? null,
        tokens_used: agentResp?.tokensUsed ?? null,
        generation_cost_cents: agentResp?.costCents ?? null,
        metadata: {
          displayContent: displayReply,
          wasTokenised: true,
          proposedChanges,
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          displayContent: displayReply,
          tokenisedContent: tokenisedReply,
          proposedChanges,
          createdAt: new Date().toISOString(),
        },
      ]);

      if (proposedChanges.length > 0) {
        setPendingChanges((prev) => [
          ...prev,
          ...proposedChanges.map((c) => ({ ...c, status: 'pending' as const })),
        ]);
      }

      await supabase
        .from('client_chat_threads')
        .update({
          last_message_at: new Date().toISOString(),
          message_count: messages.length + 2,
        })
        .eq('id', threadId);
    } catch (err) {
      console.error('[AdvisoryAgentPanel] send error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong sending the message.');
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          displayContent:
            err instanceof Error
              ? `Sorry — couldn't reach the agent: ${err.message}`
              : "Sorry — couldn't reach the agent.",
          tokenisedContent: '',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, threadId, sending, tokeniser, messages, clientId, practiceId]);

  // -------------------------------------------------------------------------
  // Apply / reject proposed changes
  // -------------------------------------------------------------------------

  const applyChange = useCallback(
    async (change: PendingChange, index: number) => {
      setPendingChanges((prev) =>
        prev.map((c, i) => (i === index ? { ...c, status: 'applying' } : c)),
      );

      try {
        const { data, error: rpcErr } = await supabase.rpc('apply_roadmap_change', {
          p_client_id: clientId,
          p_stage_type: change.stage_type,
          p_json_path: change.json_path,
          p_new_value: change.new_value,
        });
        if (rpcErr) throw rpcErr;
        if (data && typeof data === 'object' && (data as any).ok === false) {
          throw new Error((data as any).error ?? 'apply_roadmap_change returned ok=false');
        }

        setPendingChanges((prev) =>
          prev.map((c, i) => (i === index ? { ...c, status: 'approved' } : c)),
        );
        onChangeApplied();
      } catch (err) {
        console.error('[AdvisoryAgentPanel] apply change failed:', err);
        setPendingChanges((prev) =>
          prev.map((c, i) =>
            i === index
              ? { ...c, status: 'failed', error: err instanceof Error ? err.message : 'Failed' }
              : c,
          ),
        );
      }
    },
    [clientId, onChangeApplied],
  );

  const rejectChange = useCallback((index: number) => {
    setPendingChanges((prev) =>
      prev.map((c, i) => (i === index ? { ...c, status: 'rejected' } : c)),
    );
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const visiblePending = pendingChanges.filter((c) => c.status === 'pending' || c.status === 'applying' || c.status === 'failed');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-over */}
      <aside
        role="dialog"
        aria-label="Advisory Agent"
        className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-slate-900 truncate">Advisory Agent</h3>
              <p className="text-xs text-slate-500 truncate">
                {clientName} {companyName ? `· ${companyName}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded"
              title="Names, company name, and financial figures are tokenised before being sent to the LLM."
            >
              <Shield className="w-3 h-3" />
              GDPR Safe
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              aria-label="Close advisor agent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && !error && (
            <div className="text-center text-slate-400 text-sm mt-8 px-6">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 text-slate-300" />
              <p>
                Ask about <strong>{clientName}</strong>'s roadmap, sprint, or value analysis.
              </p>
              <p className="mt-2 text-xs">
                Suggest a tone change, propose a new task, ask "is this aligned with their North
                Star?". Any content edit can be applied with one click.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {msg.displayContent}
                {msg.proposedChanges && msg.proposedChanges.length > 0 && (
                  <p className="mt-2 text-xs italic opacity-80">
                    {msg.proposedChanges.length} change suggestion
                    {msg.proposedChanges.length === 1 ? '' : 's'} below.
                  </p>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-lg px-3 py-2 inline-flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-800">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Pending changes */}
        {visiblePending.length > 0 && (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 max-h-64 overflow-y-auto">
            <p className="text-xs font-semibold text-amber-900 mb-2">
              Suggested changes ({visiblePending.length})
            </p>
            <div className="space-y-2">
              {pendingChanges.map((change, i) => {
                if (change.status === 'rejected' || change.status === 'approved') return null;
                const stageLabel = STAGE_LABELS[change.stage_type] ?? change.stage_type;
                const isApplying = change.status === 'applying';
                const isFailed = change.status === 'failed';
                return (
                  <div
                    key={`${change.stage_type}-${i}`}
                    className={`bg-white rounded border p-2 text-xs ${
                      isFailed ? 'border-red-300' : 'border-amber-200'
                    }`}
                  >
                    <p className="font-medium text-slate-900">
                      {stageLabel} <span className="text-slate-400">·</span>{' '}
                      <code className="text-slate-500">{change.json_path}</code>
                    </p>
                    <p className="text-slate-600 mt-1 line-clamp-3">
                      {tokeniser.detokenise(change.new_value)}
                    </p>
                    {change.reason && (
                      <p className="text-slate-500 mt-1 italic line-clamp-2">{change.reason}</p>
                    )}
                    {isFailed && change.error && (
                      <p className="text-red-700 mt-1">Failed: {change.error}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => applyChange(change, i)}
                        disabled={isApplying}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isApplying ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        {isApplying ? 'Applying' : isFailed ? 'Retry' : 'Apply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectChange(i)}
                        disabled={isApplying}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-300 disabled:opacity-50"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-slate-200 p-3 bg-white">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder={`Ask about ${clientName}'s roadmap...`}
              rows={2}
              className="flex-1 resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              disabled={sending || !threadId}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={sending || !input.trim() || !threadId}
              className="inline-flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              aria-label="Send"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
            Names, company name, and financial figures are tokenised before being sent. Suggested
            edits are reviewed and applied through this panel only — nothing changes without your
            explicit Apply.
          </p>
        </div>
      </aside>
    </>
  );
}
