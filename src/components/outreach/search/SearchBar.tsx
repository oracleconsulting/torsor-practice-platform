import React, { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  autoSearch?: boolean;
  debounceMs?: number;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search prospects, companies, or PE acquisitions...",
  autoSearch = true,
  debounceMs = 300,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce search for auto-search
  const debouncedSearch = useDebounce((term: string) => {
    if (term.trim()) {
      onSearch(term);
    }
  }, debounceMs);
  
  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (autoSearch) {
      debouncedSearch(value);
    }
  }, [autoSearch, debouncedSearch]);
  
  // Handle manual search
  const handleSearch = useCallback(() => {
    if (searchTerm.trim()) {
      onSearch(searchTerm);
    }
  }, [searchTerm, onSearch]);
  
  // Handle enter key
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !autoSearch) {
      handleSearch();
    }
  }, [handleSearch, autoSearch]);
  
  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="pl-10 pr-4 py-2 w-full"
        />
      </div>
      {!autoSearch && (
        <Button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Search
        </Button>
      )}
    </div>
  );
}; 