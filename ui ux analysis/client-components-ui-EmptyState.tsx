import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
        {icon ?? <Inbox className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1 font-display">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm text-center">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
