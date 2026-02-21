/**
 * Search and filter controls for the client list.
 */
import React from 'react';
import { Filter, Search } from 'lucide-react';

export interface ClientFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export function ClientFilters({
  searchQuery,
  onSearchChange,
  placeholder = 'Search clients...',
}: ClientFiltersProps): React.ReactElement {
  return (
    <div className="flex gap-4">
      <div className="flex-1 relative min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <button type="button" className="btn-secondary inline-flex items-center gap-2">
        <Filter className="w-4 h-4" />
        Filters
      </button>
    </div>
  );
}
