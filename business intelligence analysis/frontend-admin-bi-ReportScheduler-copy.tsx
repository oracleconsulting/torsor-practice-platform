/**
 * Report Scheduler Component
 * Configure automated report delivery schedules
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar,
  Clock,
  Mail,
  Bell,
  Send,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  X,
  FileText,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface Recipient {
  type: 'email' | 'slack';
  address: string;
  name?: string;
}

interface ReportSchedule {
  id?: string;
  engagement_id: string;
  schedule_name: string;
  schedule_type: 'monthly' | 'weekly' | 'quarterly' | 'on_completion';
  report_types: string[];
  include_pdf: boolean;
  include_dashboard_link: boolean;
  delivery_method: 'email' | 'slack' | 'webhook';
  recipients: Recipient[];
  delivery_day?: number;
  delivery_time: string;
  timezone: string;
  is_active: boolean;
  last_sent_at?: string;
  next_scheduled_at?: string;
  send_count?: number;
}

interface ReportSchedulerProps {
  engagementId: string;
  clientName?: string;
  onScheduleSaved?: (schedule: ReportSchedule) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCHEDULE_TYPES = [
  { value: 'monthly', label: 'Monthly', description: 'First Monday of each month' },
  { value: 'weekly', label: 'Weekly', description: 'Same day each week' },
  { value: 'quarterly', label: 'Quarterly', description: 'Start of each quarter' },
  { value: 'on_completion', label: 'On Completion', description: 'When period is finalized' }
];

const REPORT_TYPES = [
  { value: 'summary', label: 'Executive Summary', description: 'High-level overview' },
  { value: 'full', label: 'Full Report', description: 'Complete analysis with all sections' },
  { value: 'kpi_only', label: 'KPI Dashboard', description: 'Just KPIs and trends' },
  { value: 'insights', label: 'Insights Only', description: 'AI insights and recommendations' }
];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' }
];

const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}${getOrdinal(i + 1)}`
}));

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-2 text-sm"
    >
      {enabled ? (
        <ToggleRight className="w-6 h-6 text-blue-600" />
      ) : (
        <ToggleLeft className="w-6 h-6 text-slate-400" />
      )}
      <span className={enabled ? 'text-slate-800' : 'text-slate-500'}>{label}</span>
    </button>
  );
}

// ============================================================================
// SCHEDULE CARD
// ============================================================================

function ScheduleCard({ 
  schedule, 
  onEdit, 
  onDelete, 
  onToggle 
}: { 
  schedule: ReportSchedule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const scheduleTypeLabel = SCHEDULE_TYPES.find(t => t.value === schedule.schedule_type)?.label || schedule.schedule_type;
  
  return (
    <div className={`p-4 rounded-lg border ${schedule.is_active ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-slate-800">{schedule.schedule_name}</h4>
          <p className="text-sm text-slate-500 mt-0.5">
            {scheduleTypeLabel} • {schedule.recipients.length} recipient{schedule.recipients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`p-1.5 rounded ${schedule.is_active ? 'text-blue-600 hover:bg-blue-100' : 'text-slate-400 hover:bg-slate-100'}`}
            title={schedule.is_active ? 'Disable schedule' : 'Enable schedule'}
          >
            {schedule.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          </button>
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Clock className="w-4 h-4 text-slate-400" />
          {schedule.delivery_time}
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <FileText className="w-4 h-4 text-slate-400" />
          {schedule.report_types.length} report type{schedule.report_types.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {schedule.next_scheduled_at && schedule.is_active && (
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3 h-3" />
          Next: {new Date(schedule.next_scheduled_at).toLocaleDateString('en-GB', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      )}
      
      {schedule.last_sent_at && (
        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600">
          <CheckCircle2 className="w-3 h-3" />
          Last sent: {new Date(schedule.last_sent_at).toLocaleDateString('en-GB')}
          {schedule.send_count && ` (${schedule.send_count} total)`}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SCHEDULE FORM
// ============================================================================

function ScheduleForm({ 
  schedule, 
  engagementId,
  onSave, 
  onCancel 
}: { 
  schedule: ReportSchedule | null;
  engagementId: string;
  onSave: (schedule: ReportSchedule) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ReportSchedule>(() => schedule || {
    engagement_id: engagementId,
    schedule_name: '',
    schedule_type: 'monthly',
    report_types: ['summary'],
    include_pdf: true,
    include_dashboard_link: true,
    delivery_method: 'email',
    recipients: [],
    delivery_day: 1,
    delivery_time: '09:00',
    timezone: 'Europe/London',
    is_active: true
  });
  
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [saving, setSaving] = useState(false);
  
  const handleAddRecipient = () => {
    if (!newRecipientEmail.trim() || !newRecipientEmail.includes('@')) return;
    
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, { type: 'email', address: newRecipientEmail.trim() }]
    }));
    setNewRecipientEmail('');
  };
  
  const handleRemoveRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };
  
  const handleToggleReportType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      report_types: prev.report_types.includes(type)
        ? prev.report_types.filter(t => t !== type)
        : [...prev.report_types, type]
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      onSave(formData);
    } finally {
      setSaving(false);
    }
  };
  
  const showDaySelector = formData.schedule_type === 'weekly' || formData.schedule_type === 'monthly';
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Schedule Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Schedule Name
        </label>
        <input
          type="text"
          value={formData.schedule_name}
          onChange={(e) => setFormData(prev => ({ ...prev, schedule_name: e.target.value }))}
          placeholder="e.g., Monthly Management Report"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      {/* Schedule Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Frequency
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SCHEDULE_TYPES.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, schedule_type: type.value as any }))}
              className={`p-3 rounded-lg border text-left transition-colors ${
                formData.schedule_type === type.value
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-medium text-slate-800">{type.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{type.description}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Delivery Day & Time */}
      {showDaySelector && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {formData.schedule_type === 'weekly' ? 'Day of Week' : 'Day of Month'}
            </label>
            <select
              value={formData.delivery_day || 1}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_day: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {(formData.schedule_type === 'weekly' ? DAYS_OF_WEEK : DAYS_OF_MONTH).map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Time
            </label>
            <input
              type="time"
              value={formData.delivery_time}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
      
      {/* Report Types */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Report Content
        </label>
        <div className="space-y-2">
          {REPORT_TYPES.map(type => (
            <label
              key={type.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                formData.report_types.includes(type.value)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.report_types.includes(type.value)}
                onChange={() => handleToggleReportType(type.value)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-slate-800">{type.label}</div>
                <div className="text-xs text-slate-500">{type.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Delivery Options */}
      <div className="flex items-center gap-6">
        <Toggle
          enabled={formData.include_pdf}
          onChange={(v) => setFormData(prev => ({ ...prev, include_pdf: v }))}
          label="Attach PDF"
        />
        <Toggle
          enabled={formData.include_dashboard_link}
          onChange={(v) => setFormData(prev => ({ ...prev, include_dashboard_link: v }))}
          label="Include Dashboard Link"
        />
      </div>
      
      {/* Recipients */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Recipients
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="email"
            value={newRecipientEmail}
            onChange={(e) => setNewRecipientEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRecipient())}
          />
          <button
            type="button"
            onClick={handleAddRecipient}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {formData.recipients.length > 0 ? (
          <div className="space-y-2">
            {formData.recipients.map((recipient, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{recipient.address}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRecipient(idx)}
                  className="p-1 text-slate-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">No recipients added</p>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !formData.schedule_name || formData.recipients.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {schedule?.id ? 'Update Schedule' : 'Create Schedule'}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ReportScheduler({ 
  engagementId, 
  clientName,
  onScheduleSaved 
}: ReportSchedulerProps) {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('bi_report_schedules')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setSchedules(data || []);
    } catch (err) {
      console.error('[ReportScheduler] Error:', err);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, [engagementId]);
  
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);
  
  const handleSave = async (schedule: ReportSchedule) => {
    try {
      if (schedule.id) {
        const { error: updateError } = await supabase
          .from('bi_report_schedules')
          .update({
            ...schedule,
            updated_at: new Date().toISOString()
          })
          .eq('id', schedule.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('bi_report_schedules')
          .insert([schedule]);
        
        if (insertError) throw insertError;
      }
      
      setShowForm(false);
      setEditingSchedule(null);
      fetchSchedules();
      onScheduleSaved?.(schedule);
    } catch (err) {
      console.error('[ReportScheduler] Save error:', err);
      setError('Failed to save schedule');
    }
  };
  
  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('bi_report_schedules')
        .delete()
        .eq('id', scheduleId);
      
      if (deleteError) throw deleteError;
      fetchSchedules();
    } catch (err) {
      console.error('[ReportScheduler] Delete error:', err);
      setError('Failed to delete schedule');
    }
  };
  
  const handleToggle = async (schedule: ReportSchedule) => {
    try {
      const { error: updateError } = await supabase
        .from('bi_report_schedules')
        .update({ is_active: !schedule.is_active })
        .eq('id', schedule.id);
      
      if (updateError) throw updateError;
      fetchSchedules();
    } catch (err) {
      console.error('[ReportScheduler] Toggle error:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-600" />
              Report Schedules
            </h3>
            {clientName && (
              <p className="text-sm text-slate-500 mt-0.5">{clientName}</p>
            )}
          </div>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setEditingSchedule(null); }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Schedule
            </button>
          )}
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {/* Content */}
      <div className="p-6">
        {showForm ? (
          <ScheduleForm
            schedule={editingSchedule}
            engagementId={engagementId}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingSchedule(null); }}
          />
        ) : schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.map(schedule => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onEdit={() => { setEditingSchedule(schedule); setShowForm(true); }}
                onDelete={() => handleDelete(schedule.id!)}
                onToggle={() => handleToggle(schedule)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Send className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No report schedules configured</p>
            <p className="text-sm text-slate-400 mt-1">
              Set up automated report delivery to keep stakeholders informed
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium"
            >
              Create your first schedule
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportScheduler;

