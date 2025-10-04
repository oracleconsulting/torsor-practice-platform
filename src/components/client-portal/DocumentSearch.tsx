import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, X } from 'lucide-react';
import debounce from 'lodash/debounce';
import { DocumentCategory } from '../../types/clientPortal';

interface DocumentSearchProps {
  onSearch: (params: SearchParams) => void;
  categories: DocumentCategory[];
  fileTypes: string[];
  loading?: boolean;
}

interface SearchParams {
  query: string;
  category?: string;
  fileType?: string;
  dateFrom?: string;
  dateTo?: string;
  verified?: boolean;
}

export const DocumentSearch: React.FC<DocumentSearchProps> = ({
  onSearch,
  categories,
  fileTypes,
  loading = false
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [params, setParams] = useState<SearchParams>({ query: '' });

  const debouncedSearch = useCallback(
    debounce((searchParams: SearchParams) => {
      onSearch(searchParams);
    }, 300),
    [onSearch]
  );

  useEffect(() => {
    debouncedSearch(params);
    return () => debouncedSearch.cancel();
  }, [params, debouncedSearch]);

  const updateParam = (key: keyof SearchParams, value: any) => {
    setParams(prev => {
      const newParams = { ...prev, [key]: value };
      // Clear empty values
      Object.keys(newParams).forEach(k => {
        if (!newParams[k as keyof SearchParams]) {
          delete newParams[k as keyof SearchParams];
        }
      });
      return newParams;
    });
  };

  const clearFilters = () => {
    setParams({ query: params.query });
  };

  const hasActiveFilters = Object.keys(params).length > 1;

  return (
    <div className="relative space-y-4">
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className={`
            absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5
            ${loading ? 'text-purple-500 animate-pulse' : 'text-gray-400'}
          `} />
          <input
            type="text"
            placeholder="Search documents..."
            value={params.query}
            onChange={(e) => updateParam('query', e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {params.query && (
            <button
              onClick={() => updateParam('query', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`
            px-4 py-2 rounded-lg flex items-center gap-2 transition-colors
            ${showAdvanced || hasActiveFilters
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
            }
          `}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
              {Object.keys(params).length - 1}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-800 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Category
                  </label>
                  <select
                    value={params.category || ''}
                    onChange={(e) => updateParam('category', e.target.value || undefined)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* File Type Filter */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    File Type
                  </label>
                  <select
                    value={params.fileType || ''}
                    onChange={(e) => updateParam('fileType', e.target.value || undefined)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Types</option>
                    {fileTypes.map(type => (
                      <option key={type} value={type}>
                        {type.split('/')[1].toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verification Status */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Status
                  </label>
                  <select
                    value={params.verified === undefined ? '' : params.verified.toString()}
                    onChange={(e) => updateParam('verified', 
                      e.target.value === '' ? undefined : e.target.value === 'true'
                    )}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Documents</option>
                    <option value="true">Verified Only</option>
                    <option value="false">Unverified Only</option>
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    From Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={params.dateFrom || ''}
                      onChange={(e) => updateParam('dateFrom', e.target.value || undefined)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    To Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={params.dateTo || ''}
                      onChange={(e) => updateParam('dateTo', e.target.value || undefined)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-purple-400 hover:text-purple-300 text-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Summary */}
      {hasActiveFilters && !showAdvanced && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(params).map(([key, value]) => {
            if (key === 'query') return null;
            let label = '';
            switch (key) {
              case 'category':
                label = categories.find(c => c.id === value)?.name || value;
                break;
              case 'fileType':
                label = value.split('/')[1].toUpperCase();
                break;
              case 'verified':
                label = value ? 'Verified' : 'Unverified';
                break;
              case 'dateFrom':
                label = `From ${new Date(value).toLocaleDateString()}`;
                break;
              case 'dateTo':
                label = `To ${new Date(value).toLocaleDateString()}`;
                break;
              default:
                label = value;
            }
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm"
              >
                {label}
                <button
                  onClick={() => updateParam(key as keyof SearchParams, undefined)}
                  className="text-purple-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}; 