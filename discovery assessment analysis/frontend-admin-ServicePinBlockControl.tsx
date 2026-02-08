/* COPY - Do not edit. Reference only. Source: src/components/discovery/ServicePinBlockControl.tsx */
/**
 * Service Pin/Block Control
 * Allows advisors to pin services (must include in Pass 3) or block services (exclude from Pass 3).
 */

import { useState, useEffect } from 'react';
import { Loader2, Pin, Ban } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ServicePinBlockControlProps {
  engagementId: string;
  pinnedServices: string[];
  blockedServices: string[];
  onUpdate: () => void;
}

export function ServicePinBlockControl({
  engagementId,
  pinnedServices = [],
  blockedServices = [],
  onUpdate
}: ServicePinBlockControlProps) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('code, name, category')
      .eq('status', 'active')
      .order('name');
    if (error) {
      console.error('Failed to load services:', error);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const togglePin = async (code: string) => {
    setUpdating(code);
    try {
      const newPinned = pinnedServices.includes(code)
        ? pinnedServices.filter(c => c !== code)
        : [...pinnedServices, code];
      const newBlocked = blockedServices.filter(c => c !== code);
      const { error } = await supabase
        .from('discovery_engagements')
        .update({
          pinned_services: newPinned,
          blocked_services: newBlocked,
          updated_at: new Date().toISOString()
        })
        .eq('id', engagementId);
      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      alert('Failed to update service preferences');
    } finally {
      setUpdating(null);
    }
  };

  const toggleBlock = async (code: string) => {
    setUpdating(code);
    try {
      const newBlocked = blockedServices.includes(code)
        ? blockedServices.filter(c => c !== code)
        : [...blockedServices, code];
      const newPinned = pinnedServices.filter(c => c !== code);
      const { error } = await supabase
        .from('discovery_engagements')
        .update({
          pinned_services: newPinned,
          blocked_services: newBlocked,
          updated_at: new Date().toISOString()
        })
        .eq('id', engagementId);
      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error('Failed to toggle block:', err);
      alert('Failed to update service preferences');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading services...</span>
      </div>
    );
  }

  if (services.length === 0) {
    return <p className="text-sm text-gray-500 italic">No active services found</p>;
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {services.map(service => {
        const isPinned = pinnedServices.includes(service.code);
        const isBlocked = blockedServices.includes(service.code);
        const isUpdating = updating === service.code;
        return (
          <div
            key={service.code}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              isPinned ? 'border-emerald-300 bg-emerald-50' :
              isBlocked ? 'border-red-300 bg-red-50' :
              'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{service.name}</p>
              <p className="text-xs text-gray-500">{service.category}</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => togglePin(service.code)}
                disabled={isUpdating}
                className={`p-2 rounded transition-colors disabled:opacity-50 ${
                  isPinned ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-emerald-100'
                }`}
                title={isPinned ? 'Unpin' : 'Pin (always include in Pass 3)'}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pin className="w-4 h-4" />}
              </button>
              <button
                onClick={() => toggleBlock(service.code)}
                disabled={isUpdating}
                className={`p-2 rounded transition-colors disabled:opacity-50 ${
                  isBlocked ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                }`}
                title={isBlocked ? 'Unblock' : 'Block (exclude from Pass 3)'}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              </button>
            </div>
          </div>
        );
      })}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Pin (📌)</strong>: Service will always appear in Pass 3 opportunities.
          <br />
          <strong>Block (🚫)</strong>: Service will be excluded from Pass 3 recommendations.
        </p>
      </div>
    </div>
  );
}
