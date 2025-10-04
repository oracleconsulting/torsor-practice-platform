import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  CalendarIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  Cog6ToothIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  calendlyService,
  type CalendlyConfig
} from '../../services/alignmentEnhancementsService';

interface CalendlyConfigPanelProps {
  practiceId: string;
  oracleGroupId: string;
  userId: string;
}

export function CalendlyConfigPanel({ practiceId, oracleGroupId, userId }: CalendlyConfigPanelProps) {
  const [config, setConfig] = useState<CalendlyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    calendly_link: '',
    event_type: '',
    custom_message: '',
    meeting_types: [] as string[],
    auto_create_transcript: false,
    auto_add_to_sprint_notes: true,
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [newMeetingType, setNewMeetingType] = useState('');

  useEffect(() => {
    loadConfig();
  }, [oracleGroupId]);

  const loadConfig = async () => {
    setLoading(true);
    const data = await calendlyService.getConfig(oracleGroupId);
    setConfig(data);
    
    if (data) {
      setFormData({
        calendly_link: data.calendly_link,
        event_type: data.event_type || '',
        custom_message: data.custom_message || '',
        meeting_types: data.meeting_types || [],
        auto_create_transcript: data.auto_create_transcript,
        auto_add_to_sprint_notes: data.auto_add_to_sprint_notes,
        is_active: data.is_active
      });
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.calendly_link.trim()) {
      alert('Calendly link is required');
      return;
    }

    // Validate Calendly URL
    if (!formData.calendly_link.includes('calendly.com')) {
      alert('Please enter a valid Calendly URL');
      return;
    }

    setSaving(true);
    try {
      const result = await calendlyService.saveConfig(
        practiceId,
        oracleGroupId,
        formData.calendly_link,
        {
          event_type: formData.event_type,
          custom_message: formData.custom_message,
          meeting_types: formData.meeting_types,
          auto_create_transcript: formData.auto_create_transcript,
          auto_add_to_sprint_notes: formData.auto_add_to_sprint_notes,
          is_active: formData.is_active,
          configured_by: userId
        }
      );

      if (result) {
        setConfig(result);
        setEditing(false);
        alert('Calendly configuration saved successfully!');
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!config) return;

    const success = await calendlyService.deactivateConfig(oracleGroupId);
    if (success) {
      setConfig({ ...config, is_active: false });
    }
  };

  const handleAddMeetingType = () => {
    if (newMeetingType.trim() && !formData.meeting_types.includes(newMeetingType.trim())) {
      setFormData({
        ...formData,
        meeting_types: [...formData.meeting_types, newMeetingType.trim()]
      });
      setNewMeetingType('');
    }
  };

  const handleRemoveMeetingType = (type: string) => {
    setFormData({
      ...formData,
      meeting_types: formData.meeting_types.filter(t => t !== type)
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Calendly configuration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-6 h-6 mr-2 text-blue-600" />
                Calendly Integration
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Allow clients to book calls directly from the Oracle Method Portal
              </p>
            </div>
            {config && !editing && (
              <div className="flex items-center space-x-2">
                <Badge className={config.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {config.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Cog6ToothIcon className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!config && !editing ? (
            // No configuration yet
            <div className="text-center py-8">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Calendly Configuration
              </h3>
              <p className="text-gray-600 mb-4">
                Set up Calendly integration to allow clients to book calls with you
              </p>
              <Button onClick={() => setEditing(true)}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Configure Calendly
              </Button>
            </div>
          ) : editing ? (
            // Edit Mode
            <div className="space-y-6">
              {/* Calendly Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calendly Link <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <LinkIcon className="w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={formData.calendly_link}
                    onChange={(e) => setFormData({ ...formData, calendly_link: e.target.value })}
                    placeholder="https://calendly.com/your-name/30min"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Copy this from your Calendly event page
                </p>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <input
                  type="text"
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  placeholder="e.g., 30min, Advisory Call, Sprint Review"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message for Clients
                </label>
                <textarea
                  value={formData.custom_message}
                  onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
                  placeholder="Book a call to discuss your progress..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Meeting Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Types
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={newMeetingType}
                    onChange={(e) => setNewMeetingType(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMeetingType())}
                    placeholder="Add meeting type..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    onClick={handleAddMeetingType}
                    variant="outline"
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
                {formData.meeting_types.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.meeting_types.map((type) => (
                      <Badge
                        key={type}
                        className="bg-blue-100 text-blue-800 flex items-center space-x-1 px-3 py-1"
                      >
                        <span>{type}</span>
                        <button
                          onClick={() => handleRemoveMeetingType(type)}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Automation Options */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Automation Settings
                </label>
                
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="auto_transcript"
                    checked={formData.auto_create_transcript}
                    onChange={(e) => setFormData({ ...formData, auto_create_transcript: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="auto_transcript" className="text-sm font-medium text-gray-900 cursor-pointer">
                      Auto-create transcript after calls
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically create a transcript entry when a call is completed
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="auto_sprint_notes"
                    checked={formData.auto_add_to_sprint_notes}
                    onChange={(e) => setFormData({ ...formData, auto_add_to_sprint_notes: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="auto_sprint_notes" className="text-sm font-medium text-gray-900 cursor-pointer">
                      Add call notes to sprint progress
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically link call outcomes to the current sprint week
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-900 cursor-pointer">
                      Enable booking for this client
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Show Calendly widget in client's Oracle Method Portal
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    if (config) {
                      setFormData({
                        calendly_link: config.calendly_link,
                        event_type: config.event_type || '',
                        custom_message: config.custom_message || '',
                        meeting_types: config.meeting_types || [],
                        auto_create_transcript: config.auto_create_transcript,
                        auto_add_to_sprint_notes: config.auto_add_to_sprint_notes,
                        is_active: config.is_active
                      });
                    }
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="space-y-6">
              {/* Current Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calendly Link
                  </label>
                  <a
                    href={config!.calendly_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm break-all"
                  >
                    {config!.calendly_link}
                  </a>
                </div>

                {config!.event_type && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Type
                    </label>
                    <p className="text-sm text-gray-900">{config!.event_type}</p>
                  </div>
                )}
              </div>

              {config!.custom_message && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Message
                  </label>
                  <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
                    {config!.custom_message}
                  </p>
                </div>
              )}

              {config!.meeting_types && config!.meeting_types.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Meeting Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {config!.meeting_types.map((type) => (
                      <Badge key={type} className="bg-blue-100 text-blue-800">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Automation Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  {config!.auto_create_transcript ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700">Auto-create transcripts</span>
                </div>
                <div className="flex items-center space-x-2">
                  {config!.auto_add_to_sprint_notes ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700">Add to sprint notes</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => window.open(config!.calendly_link, '_blank')}
                  className="flex-1"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Preview Calendly
                </Button>
                {config!.is_active && (
                  <Button
                    variant="outline"
                    onClick={handleToggleActive}
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircleIcon className="w-4 h-4 mr-2" />
                    Deactivate
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Analytics */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChartBarIcon className="w-6 h-6 mr-2 text-purple-600" />
              Booking Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <CalendarIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{config.total_bookings}</div>
                <div className="text-sm text-gray-600">Total Bookings</div>
              </div>

              <div className="text-center p-6 bg-green-50 rounded-lg">
                <ClockIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">
                  {config.last_booking_date
                    ? new Date(config.last_booking_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Last Booking</div>
              </div>

              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <UserIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">
                  {config.is_active ? 'Active' : 'Inactive'}
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside text-sm text-gray-700">
            <li>Log in to your Calendly account and create or select an event type</li>
            <li>Copy the event link (e.g., https://calendly.com/your-name/30min)</li>
            <li>Paste the link in the configuration above</li>
            <li>Customize meeting types and automation settings</li>
            <li>Save - the booking widget will appear in the client's Oracle Method Portal</li>
            <li>Clients can book calls directly, and you'll receive notifications</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

