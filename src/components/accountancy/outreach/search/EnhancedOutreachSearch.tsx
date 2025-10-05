import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  History, 
  ArrowLeftRight, 
  Sparkles 
} from 'lucide-react';
import { DateRangeComparison } from './DateRangeComparison';
import { SearchHistoryPanel } from './SearchHistoryPanel';
import { LLMAddressVerification } from './LLMAddressVerification';

interface CompanySearchResult {
  company_number: string;
  company_name: string;
  company_status: string;
  company_type: string;
  date_of_creation?: string;
  registered_office_address: any;
  sic_codes?: string[];
}

/**
 * Enhanced Outreach Search component with date range comparison, 
 * search history, and LLM address verification features
 */
export const EnhancedOutreachSearch: React.FC = () => {
  const [activeTab, setActiveTab] = useState('date-comparison');
  const [selectedCompanies, setSelectedCompanies] = useState<CompanySearchResult[]>([]);

  const handleSearchHistoryLoad = (searchData: any) => {
    console.log('Loading search from history:', searchData);
    // Implementation will vary based on search type
    if (searchData.search_type === 'date_comparison') {
      setActiveTab('date-comparison');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enhanced Client Outreach</h1>
        <p className="text-gray-500">
          Track firm movements, compare date ranges, and verify addresses with AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="date-comparison" className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4" />
                Date Range Comparison
              </TabsTrigger>
              <TabsTrigger value="llm-verification" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Address Verification
              </TabsTrigger>
            </TabsList>

            <TabsContent value="date-comparison" className="mt-4">
              <DateRangeComparison />
            </TabsContent>

            <TabsContent value="llm-verification" className="mt-4">
              <LLMAddressVerification 
                companies={selectedCompanies}
                onVerificationComplete={(verifications) => {
                  console.log('Verifications complete:', verifications);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Search History */}
        <div className="lg:col-span-1">
          <SearchHistoryPanel onLoadSearch={handleSearchHistoryLoad} />
        </div>
      </div>
    </div>
  );
};

