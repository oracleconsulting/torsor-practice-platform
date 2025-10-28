import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Building2, Network, Target, RefreshCw, Download, Zap, FileSearch } from 'lucide-react';
import { outreachService } from '@/services/accountancy/outreachService';
import { toast } from 'sonner';
import { EnhancedOutreachSearch } from '@/components/accountancy/outreach/search/EnhancedOutreachSearch';
import EnhancedCompaniesHouseSearch from '@/components/accountancy/outreach/search/EnhancedCompaniesHouseSearch';
import { DocumentParser } from '@/components/accountancy/outreach/DocumentParser';

const Research = () => {
  const [activeTab, setActiveTab] = useState('enhanced');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Basic search state
  const [basicSearchTerm, setBasicSearchTerm] = useState('');
  
  // Advanced search state
  const [advancedSearch, setAdvancedSearch] = useState({
    sicCodes: [] as string[],
    location: '',
    incorporatedFrom: '',
    incorporatedTo: '',
    status: ['active'],
  });
  
  // Network search state
  const [networkSearch, setNetworkSearch] = useState({
    maxFirms: 100,
    minScore: 6,
  });

  const handleBasicSearch = async () => {
    if (!basicSearchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setIsSearching(true);
    try {
      const results = await outreachService.searchCompaniesHouse(basicSearchTerm, 100);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdvancedSearch = async () => {
    setIsSearching(true);
    try {
      const results = await outreachService.advancedSearch(advancedSearch);
      setSearchResults(results.companies || []);
      
      toast.success(`Found ${results.companies_found} companies`, {
        description: `${results.qualified_prospects} qualified prospects`
      });
    } catch (error) {
      console.error('Advanced search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleNetworkSearch = async () => {
    setIsSearching(true);
    try {
      const results = await outreachService.accountingFirmNetworkSearch(networkSearch);
      setSearchResults(results.qualified_prospects || []);
      
      toast.success(`Found ${results.accounting_firms_found} accounting firms`, {
        description: `${results.qualified_prospects} potential clients identified`
      });
    } catch (error) {
      console.error('Network search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportCompany = async (company: any) => {
    try {
      await outreachService.importCompanyAsContact(company);
      toast.success('Company imported as contact');
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import company');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Companies House Research</h1>
        <p className="text-gray-500">Advanced company search and prospect discovery</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="enhanced" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Advanced Tools
          </TabsTrigger>
          <TabsTrigger value="document-parser" className="flex items-center gap-2">
            <FileSearch className="w-4 h-4" />
            Document Parser
          </TabsTrigger>
          <TabsTrigger value="companies-house">Companies House</TabsTrigger>
          <TabsTrigger value="basic">Basic Search</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Search</TabsTrigger>
          <TabsTrigger value="network">Network Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced">
          <EnhancedOutreachSearch />
        </TabsContent>

        <TabsContent value="document-parser">
          <DocumentParser />
        </TabsContent>

        <TabsContent value="companies-house">
          <EnhancedCompaniesHouseSearch />
        </TabsContent>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Company Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Search by company name or number..."
                  value={basicSearchTerm}
                  onChange={(e) => setBasicSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBasicSearch()}
                />
                <Button onClick={handleBasicSearch} disabled={isSearching}>
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">SIC Codes</label>
                    <Select
                      value={advancedSearch.sicCodes[0]}
                      onValueChange={(value) => 
                        setAdvancedSearch({...advancedSearch, sicCodes: [value]})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="69201">Accounting</SelectItem>
                        <SelectItem value="69202">Bookkeeping</SelectItem>
                        <SelectItem value="69203">Tax Consultancy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      placeholder="City or region..."
                      value={advancedSearch.location}
                      onChange={(e) => 
                        setAdvancedSearch({...advancedSearch, location: e.target.value})
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleAdvancedSearch} disabled={isSearching}>
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Target className="w-4 h-4 mr-2" />
                  )}
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Accounting Firm Network Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Max Firms to Check</label>
                    <Input
                      type="number"
                      value={networkSearch.maxFirms}
                      onChange={(e) => 
                        setNetworkSearch({...networkSearch, maxFirms: parseInt(e.target.value)})
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Minimum Score</label>
                    <Input
                      type="number"
                      value={networkSearch.minScore}
                      onChange={(e) => 
                        setNetworkSearch({...networkSearch, minScore: parseInt(e.target.value)})
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleNetworkSearch} disabled={isSearching}>
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Network className="w-4 h-4 mr-2" />
                  )}
                  Analyze Networks
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((company) => (
                <div 
                  key={company.company_number}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{company.company_name}</h3>
                      <p className="text-sm text-gray-500">
                        Company Number: {company.company_number}
                      </p>
                      {company.registered_office_address && (
                        <p className="text-sm text-gray-500">
                          {company.registered_office_address.locality}, {company.registered_office_address.postal_code}
                        </p>
                      )}
                      {company.prospect_score && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Score: {company.prospect_score}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImportCompany(company)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Research; 