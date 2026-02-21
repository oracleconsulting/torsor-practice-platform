/**
 * Collapsible Test Mode panel with TestClientPanel for creating/resetting test clients.
 */
import React, { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { TestClientPanel } from '../../../components/admin/TestClientPanel';

export interface TestModePanelProps {
  practiceId: string;
  serviceLineCode: string;
  serviceLineName: string;
  onTestClientCreated?: (clientId: string) => void;
  onTestClientReset?: () => void;
}

export function TestModePanel({
  practiceId,
  serviceLineCode,
  serviceLineName,
  onTestClientCreated,
  onTestClientReset,
}: TestModePanelProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-amber-800"
      >
        <span className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Test Mode Controls
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-amber-200">
          <TestClientPanel
            practiceId={practiceId}
            serviceLineCode={serviceLineCode}
            serviceLineName={serviceLineName}
            onTestClientCreated={(clientId) => {
              onTestClientCreated?.(clientId);
            }}
            onTestClientReset={() => {
              onTestClientReset?.();
            }}
          />
        </div>
      )}
    </div>
  );
}
