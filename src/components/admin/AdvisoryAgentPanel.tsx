// =============================================================================
// AdvisoryAgentPanel
// =============================================================================
// Slide-over chat panel for the in-platform advisory agent. Tokenises every
// outbound message, de-tokenises every inbound reply, persists embeddings
// for long-term memory, and renders structured agent output:
//
//   * `next_steps` blocks  -> clickable cards. Picking one sends a follow-up
//      message and stores both the chosen option and the alternatives offered
//      in the assistant message's metadata. Decision tree captured.
//
//   * `proposed_change` blocks -> approve/reject row, applies via the
//      apply_roadmap_change RPC.
//
// Mode toggle: Quick (Sonnet 4.5) for fast turn-around, Deep (Opus 4.7) for
// research-heavy strategic discussions. Auto-suggests Deep when the message
// looks like a research/strategy question.
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
  ArrowRight,
  Brain,
  Check,
  Loader2,
  MessageSquare,
  Send,
  Shield,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AgentMode = 'quick' | 'deep';

interface ProposedChange {
  stage_type: string;
  json_path: string;
  new_value: string;
  reason: string;
}

interface PendingChange extends ProposedChange {
  status: 'pending' | 'applying' | 'approved' | 'rejected' | 'failed';
  error?: string;
  messageId: string;
}

interface NextStepOption {
  id: string;
  title: string;
  description?: string;
  action_hint?: string;
}

interface NextSteps {
  context?: string;
  options: NextStepOption[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  displayContent: string;
  tokenisedContent: string;
  proposedChanges?: ProposedChange[];
  nextSteps?: NextSteps;
  /** Which option the user chose from this message's nextSteps (if any). */
  chosenOptionId?: string;
  /** Was this message generated automatically as a follow-up to a card click? */
  isAutoFollowUp?: boolean;
  /** Diagnostics: how many prior messages the agent referenced. */
  referenceCounts?: { sameClient: number; total: number };
  mode?: AgentMode;
  model?: string;
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

const DEEP_MODE_HINTS = [
  'why',
  'compare',
  'research',
  'analyse',
  'analyze',
  'deep dive',
  'strategy',
  'strategic',
  'trade-off',
  'evidence',
  'literature',
  'best practice',
  'walk me through',
  'reason about',
  'think through',
];

function suggestsDeepMode(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return DEEP_MODE_HINTS.some((h) => t.includes(h));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
  const [mode, setMode] = useState<AgentMode>('quick');
  const [autoSuggestedDeep, setAutoSuggestedDeep] = useState(false);
  const [activeServices, setActiveServices] = useState<string[]>([]);
  const [lastObservationsCount, setLastObservationsCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const tokeniserRef = useRef(tokeniser);
  tokeniserRef.current = tokeniser;

  // Auto-suggest deep mode when the user types research-y keywords
  useEffect(() => {
    if (mode === 'deep') {
      setAutoSuggestedDeep(false);
      return;
    }
    setAutoSuggestedDeep(suggestsDeepMode(input));
  }, [input, mode]);

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

        const { data: rows } = await supabase
          .from('client_chat_messages')
          .select('id, role, content, metadata, llm_model, created_at')
          .eq('thread_id', id)
          .order('created_at', { ascending: true });

        if (cancelled) return;
        if (rows && rows.length > 0) {
          const loaded: ChatMessage[] = rows.map((m: any) => ({
            id: m.id,
            role: m.role === 'assistant' ? 'assistant' : 'user',
            displayContent: m.metadata?.displayContent ?? tokeniserRef.current.detokenise(m.content),
            tokenisedContent: m.content,
            proposedChanges: m.metadata?.proposedChanges,
            nextSteps: m.metadata?.nextSteps,
            chosenOptionId: m.metadata?.chosenOptionId,
            isAutoFollowUp: m.metadata?.isAutoFollowUp,
            referenceCounts: m.metadata?.referenceCounts,
            mode: m.metadata?.mode,
            model: m.llm_model,
            createdAt: m.created_at,
          }));
          setMessages(loaded);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, sending]);

  // -------------------------------------------------------------------------
  // Send a message (used for both manual sends and card-click follow-ups)
  // -------------------------------------------------------------------------

  const sendMessageInternal = useCallback(
    async (
      realMessage: string,
      opts?: {
        autoFollowUp?: boolean;
        chosenOptionId?: string;
        alternativesOffered?: NextStepOption[];
        sourceMessageId?: string;
      },
    ) => {
      if (!realMessage.trim() || !threadId) return;

      setSending(true);
      setError(null);

      const tokenisedMessage = tokeniserRef.current.tokenise(realMessage);
      const tempId = `temp-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          role: 'user',
          displayContent: realMessage,
          tokenisedContent: tokenisedMessage,
          isAutoFollowUp: opts?.autoFollowUp,
          createdAt: new Date().toISOString(),
        },
      ]);

      // If this is a card-click follow-up, mark the source assistant message
      // as having a chosen option (in local state — we'll persist below).
      if (opts?.chosenOptionId && opts?.sourceMessageId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === opts.sourceMessageId ? { ...m, chosenOptionId: opts.chosenOptionId } : m,
          ),
        );
      }

      try {
        const { data: userResp } = await supabase.auth.getUser();
        const userId = userResp?.user?.id ?? null;

        const { data: memberRow } = await supabase
          .from('practice_members')
          .select('id')
          .eq('user_id', userId)
          .eq('practice_id', practiceId)
          .maybeSingle();
        const sentBy = memberRow?.id ?? null;

        // Persist the user message
        const userMetadata: Record<string, unknown> = {
          displayContent: realMessage,
          wasTokenised: true,
        };
        if (opts?.autoFollowUp) userMetadata.isAutoFollowUp = true;
        if (opts?.chosenOptionId) userMetadata.chosenOptionId = opts.chosenOptionId;
        if (opts?.alternativesOffered) {
          userMetadata.alternativesOffered = opts.alternativesOffered;
        }

        await supabase.from('client_chat_messages').insert({
          thread_id: threadId,
          role: 'user',
          content: tokenisedMessage,
          sent_by: sentBy,
          metadata: userMetadata,
        });

        // Patch source assistant message metadata with the choice
        if (opts?.chosenOptionId && opts?.sourceMessageId) {
          // Fetch existing metadata, merge, write back
          const { data: existing } = await supabase
            .from('client_chat_messages')
            .select('metadata')
            .eq('id', opts.sourceMessageId)
            .maybeSingle();
          const merged = {
            ...(existing?.metadata ?? {}),
            chosenOptionId: opts.chosenOptionId,
            chosenAt: new Date().toISOString(),
          };
          await supabase
            .from('client_chat_messages')
            .update({ metadata: merged })
            .eq('id', opts.sourceMessageId);
        }

        // Build context just-in-time
        const ctx = await buildAgentContext(supabase, clientId);
        const contextString = formatContextForPrompt(ctx);
        const tokenisedContext = tokeniserRef.current.tokenise(contextString);

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
              mode,
              practiceId,
              clientId,
            },
          },
        );
        if (invokeErr) throw invokeErr;
        if (agentResp?.ok === false && agentResp?.error) throw new Error(agentResp.error);

        const tokenisedReply = String(agentResp?.message ?? '');
        const displayReply = tokeniserRef.current.detokenise(tokenisedReply);
        const proposedChanges: ProposedChange[] = Array.isArray(agentResp?.proposedChanges)
          ? agentResp.proposedChanges
          : [];
        const nextSteps: NextSteps | undefined =
          agentResp?.nextSteps && Array.isArray(agentResp.nextSteps.options)
            ? agentResp.nextSteps
            : undefined;
        const referenceCounts = {
          sameClient: Number(agentResp?.retrievedSameClientCount ?? 0),
          total: Number(agentResp?.retrievedCount ?? 0),
        };
        if (Array.isArray(agentResp?.activeServiceLabels)) {
          setActiveServices(agentResp.activeServiceLabels);
        }
        if (typeof agentResp?.observationsRecorded === 'number') {
          setLastObservationsCount(agentResp.observationsRecorded);
        }

        // Strip the structured blocks from the displayed text — they're rendered
        // separately as cards / change rows below the bubble.
        const cleanedDisplay = displayReply
          .replace(/```next_steps\s*\n[\s\S]*?\n```/g, '')
          .replace(/```proposed_change\s*\n[\s\S]*?\n```/g, '')
          .trim();

        // Insert assistant message and capture the inserted id so we can wire
        // up next-step choices later.
        const { data: insertedAssistant } = await supabase
          .from('client_chat_messages')
          .insert({
            thread_id: threadId,
            role: 'assistant',
            content: tokenisedReply,
            llm_model: agentResp?.model ?? null,
            tokens_used: agentResp?.tokensUsed ?? null,
            generation_cost_cents: agentResp?.costCents ?? null,
            embedding: agentResp?.assistantMessageEmbedding ?? null,
            metadata: {
              displayContent: cleanedDisplay || displayReply,
              wasTokenised: true,
              proposedChanges,
              nextSteps,
              referenceCounts,
              mode: agentResp?.mode ?? mode,
            },
          })
          .select('id')
          .single();

        // Also persist the user-message embedding now that we have it
        if (agentResp?.userMessageEmbedding) {
          await supabase
            .from('client_chat_messages')
            .update({ embedding: agentResp.userMessageEmbedding })
            .eq('thread_id', threadId)
            .eq('role', 'user')
            .eq('content', tokenisedMessage)
            .order('created_at', { ascending: false })
            .limit(1);
        }

        const assistantId = insertedAssistant?.id ?? `assistant-${Date.now()}`;

        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            displayContent: cleanedDisplay || displayReply,
            tokenisedContent: tokenisedReply,
            proposedChanges,
            nextSteps,
            referenceCounts,
            mode: agentResp?.mode ?? mode,
            model: agentResp?.model,
            createdAt: new Date().toISOString(),
          },
        ]);

        if (proposedChanges.length > 0) {
          setPendingChanges((prev) => [
            ...prev,
            ...proposedChanges.map((c) => ({
              ...c,
              status: 'pending' as const,
              messageId: assistantId,
            })),
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
    },
    [threadId, messages, clientId, practiceId, mode],
  );

  const sendManualMessage = useCallback(async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    await sendMessageInternal(text);
  }, [input, sending, sendMessageInternal]);

  const sendOptionChoice = useCallback(
    async (
      sourceMessage: ChatMessage,
      option: NextStepOption,
    ) => {
      if (sending) return;
      const followUpText = option.description
        ? `I'll go with: ${option.title}. ${option.description}`
        : `I'll go with: ${option.title}.`;
      await sendMessageInternal(followUpText, {
        autoFollowUp: true,
        chosenOptionId: option.id,
        alternativesOffered: sourceMessage.nextSteps?.options ?? [],
        sourceMessageId: sourceMessage.id,
      });
    },
    [sending, sendMessageInternal],
  );

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

  const visiblePending = pendingChanges.filter(
    (c) => c.status === 'pending' || c.status === 'applying' || c.status === 'failed',
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label="Advisory Agent"
        className="fixed right-0 top-0 h-full w-full sm:w-[520px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col"
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
              {activeServices.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeServices.map((s) => (
                    <span
                      key={s}
                      className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] uppercase tracking-wide"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle mode={mode} onChange={setMode} />
            <span
              className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded"
              title="Names, company name, and financial figures are tokenised before being sent to the LLM."
            >
              <Shield className="w-3 h-3" />
              GDPR
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
                The agent will offer next-step options. Pick one to keep moving — every choice and
                its alternatives are stored so the conversation grows with you.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              tokeniser={tokeniserRef.current}
              pendingChanges={pendingChanges}
              onPickOption={(option) => void sendOptionChoice(msg, option)}
              onApplyChange={(c, i) => void applyChange(c, i)}
              onRejectChange={rejectChange}
            />
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-lg px-3 py-2 inline-flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Thinking{mode === 'deep' ? ' deeply' : ''}...
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

        {/* Pending changes (any messages still awaiting apply/reject) */}
        {visiblePending.length > 0 && (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 max-h-64 overflow-y-auto">
            <p className="text-xs font-semibold text-amber-900 mb-2">
              Pending edits ({visiblePending.length})
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
                      {tokeniserRef.current.detokenise(change.new_value)}
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
                        {isApplying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
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

        {/* Recently-recorded observations */}
        {lastObservationsCount > 0 && (
          <div className="border-t border-fuchsia-200 bg-fuchsia-50 px-4 py-2 text-xs text-fuchsia-900 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            Agent flagged {lastObservationsCount} system observation
            {lastObservationsCount === 1 ? '' : 's'} from this exchange.
            <a
              href="/practice/agent-observations"
              className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded bg-fuchsia-600 text-white hover:bg-fuchsia-700"
            >
              Review <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Auto-suggest deep mode when user is typing research-y stuff */}
        {autoSuggestedDeep && mode === 'quick' && (
          <div className="border-t border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800 flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 flex-shrink-0" />
            This looks like a research / strategy question.
            <button
              type="button"
              onClick={() => setMode('deep')}
              className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Switch to Deep <ArrowRight className="w-3 h-3" />
            </button>
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
                  void sendManualMessage();
                }
              }}
              placeholder={`Ask about ${clientName}'s roadmap... (${mode === 'deep' ? 'Opus 4.7' : 'Sonnet 4.5'})`}
              rows={2}
              className="flex-1 resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              disabled={sending || !threadId}
            />
            <button
              type="button"
              onClick={() => void sendManualMessage()}
              disabled={sending || !input.trim() || !threadId}
              className="inline-flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              aria-label="Send"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
            Names, company, and figures are tokenised before being sent. The agent has memory of
            past discussions for this client (and tokenised references across the practice). Edits
            apply only when you click Apply.
          </p>
        </div>
      </aside>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ModeToggle({ mode, onChange }: { mode: AgentMode; onChange: (m: AgentMode) => void }) {
  return (
    <div
      role="group"
      aria-label="Agent mode"
      className="inline-flex items-center bg-slate-100 rounded-lg p-0.5 text-xs"
    >
      <button
        type="button"
        onClick={() => onChange('quick')}
        title="Sonnet 4.5 — fast, for tightening copy and quick edits"
        className={`px-2 py-1 rounded inline-flex items-center gap-1 transition-colors ${
          mode === 'quick' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Zap className="w-3 h-3" />
        Quick
      </button>
      <button
        type="button"
        onClick={() => onChange('deep')}
        title="Opus 4.7 — for research and strategic discussions"
        className={`px-2 py-1 rounded inline-flex items-center gap-1 transition-colors ${
          mode === 'deep' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Brain className="w-3 h-3" />
        Deep
      </button>
    </div>
  );
}

interface MessageBubbleProps {
  msg: ChatMessage;
  tokeniser: GDPRTokeniser;
  pendingChanges: PendingChange[];
  onPickOption: (option: NextStepOption) => void;
  onApplyChange: (change: PendingChange, index: number) => void;
  onRejectChange: (index: number) => void;
}

function MessageBubble({ msg, onPickOption }: MessageBubbleProps) {
  const isUser = msg.role === 'user';
  const hasNextSteps = !isUser && msg.nextSteps && msg.nextSteps.options.length > 0;

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-2`}>
      <div
        className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
        }`}
      >
        {msg.displayContent || (isUser ? '' : '(empty response)')}
        {!isUser && msg.referenceCounts && msg.referenceCounts.total > 0 && (
          <p className="mt-2 text-[10px] italic opacity-70">
            Referenced {msg.referenceCounts.total} prior message
            {msg.referenceCounts.total === 1 ? '' : 's'}
            {msg.referenceCounts.total > msg.referenceCounts.sameClient
              ? ` (${msg.referenceCounts.sameClient} from this client, ${
                  msg.referenceCounts.total - msg.referenceCounts.sameClient
                } from other tokenised clients)`
              : ' from this client'}
            .
          </p>
        )}
        {!isUser && msg.model && (
          <p className="mt-1 text-[10px] italic opacity-60">
            {msg.model.includes('opus') ? 'Opus' : 'Sonnet'} · {msg.mode ?? 'quick'} mode
          </p>
        )}
      </div>

      {hasNextSteps && (
        <div className="w-[88%] space-y-1.5">
          {msg.nextSteps!.context && (
            <p className="text-xs text-slate-500 italic">{msg.nextSteps!.context}</p>
          )}
          {msg.nextSteps!.options.map((option) => {
            const isChosen = msg.chosenOptionId === option.id;
            const someoneChosen = !!msg.chosenOptionId;
            const dimmed = someoneChosen && !isChosen;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => !someoneChosen && onPickOption(option)}
                disabled={someoneChosen}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                  isChosen
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : dimmed
                    ? 'bg-slate-50 border-slate-200 text-slate-400'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  {isChosen ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold">{option.title}</p>
                    {option.description && (
                      <p className="text-slate-500 mt-0.5">{option.description}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {msg.chosenOptionId && (
            <p className="text-[10px] text-slate-400 italic">
              Choice recorded · alternatives kept for reference
            </p>
          )}
        </div>
      )}
    </div>
  );
}
