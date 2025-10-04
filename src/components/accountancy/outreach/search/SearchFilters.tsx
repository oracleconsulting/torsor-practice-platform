import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

export interface SearchFilters {
  type?: string[];
  industry?: string[];
  location?: string;
  minScore?: number;
  status?: string[];
  hasResearch?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onReset: () => void;
  className?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  className = ""
}) => {
  // Handle individual filter changes
  const handleTypeChange = (types: string[]) => {
    onFilterChange({ ...filters, type: types });
  };

  const handleIndustryChange = (industries: string[]) => {
    onFilterChange({ ...filters, industry: industries });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, location: e.target.value });
  };

  const handleMinScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onFilterChange({ ...filters, minScore: isNaN(value) ? undefined : value });
  };

  const handleStatusChange = (statuses: string[]) => {
    onFilterChange({ ...filters, status: statuses });
  };

  const handleHasResearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, hasResearch: e.target.checked });
  };

  const handleDateRangeChange = (range: { from: string; to: string }) => {
    onFilterChange({ ...filters, dateRange: range });
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Filters</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 px-2 lg:px-3"
        >
          <X className="h-4 w-4" />
          <span className="ml-2 hidden lg:inline">Reset</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Type Filter */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {['prospect', 'company', 'pe_acquisition'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.type?.includes(type)}
                    onCheckedChange={(checked) => {
                      const types = filters.type || [];
                      handleTypeChange(
                        checked
                          ? [...types, type]
                          : types.filter((t) => t !== type)
                      );
                    }}
                  />
                  <Label htmlFor={`type-${type}`}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Filter */}
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select
              value={filters.industry?.[0] || ''}
              onValueChange={(value) => handleIndustryChange([value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={filters.location || ''}
              onChange={handleLocationChange}
              placeholder="Enter location"
            />
          </div>

          {/* Min Score Filter */}
          <div className="space-y-2">
            <Label>Minimum Score</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={filters.minScore || ''}
              onChange={handleMinScoreChange}
              placeholder="Enter minimum score"
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {['new', 'contacted', 'responded', 'converted'].map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.status?.includes(status)}
                    onCheckedChange={(checked) => {
                      const statuses = filters.status || [];
                      handleStatusChange(
                        checked
                          ? [...statuses, status]
                          : statuses.filter((s) => s !== status)
                      );
                    }}
                  />
                  <Label htmlFor={`status-${status}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Research Filter */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-research"
              checked={filters.hasResearch}
              onCheckedChange={(checked) => {
                onFilterChange({ ...filters, hasResearch: checked as boolean });
              }}
            />
            <Label htmlFor="has-research">Has Research</Label>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={filters.dateRange?.from || ''}
                onChange={(e) => handleDateRangeChange({
                  from: e.target.value,
                  to: filters.dateRange?.to || ''
                })}
              />
              <Input
                type="date"
                value={filters.dateRange?.to || ''}
                onChange={(e) => handleDateRangeChange({
                  from: filters.dateRange?.from || '',
                  to: e.target.value
                })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 