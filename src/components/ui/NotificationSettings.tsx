import React from 'react';

interface NotificationSettingsValue {
  email: boolean;
  sms: boolean;
  frequency: 'weekly' | 'monthly' | 'critical_only';
}

interface NotificationSettingsProps {
  value: NotificationSettingsValue;
  onChange: (v: NotificationSettingsValue) => void;
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ value, onChange, className }) => {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div className="flex items-center gap-4">
        <label className="text-white font-medium">Email</label>
        <input
          type="checkbox"
          checked={value.email}
          onChange={e => onChange({ ...value, email: e.target.checked })}
          className="w-5 h-5 accent-purple-600"
        />
        <label className="text-white font-medium ml-6">SMS</label>
        <input
          type="checkbox"
          checked={value.sms}
          onChange={e => onChange({ ...value, sms: e.target.checked })}
          className="w-5 h-5 accent-purple-600"
        />
      </div>
      <div>
        <label className="text-white font-medium mr-2">Frequency</label>
        <select
          value={value.frequency}
          onChange={e => onChange({ ...value, frequency: e.target.value as NotificationSettingsValue['frequency'] })}
          className="bg-white/10 text-white rounded px-3 py-2"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="critical_only">Critical Only</option>
        </select>
      </div>
    </div>
  );
}; 