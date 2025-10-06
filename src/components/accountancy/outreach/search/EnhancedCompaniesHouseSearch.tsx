import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Building2, 
  MapPin, 
  Users, 
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  ExternalLink,
  Filter,
  Target,
  Zap,
  Eye,
  Shield,
  Save
} from 'lucide-react';
import { outreachService } from '@/services/accountancy/outreachService';
import { savedProspectsService } from '@/services/accountancy/savedProspectsService';
import { ProspectDetailsModal } from '../ProspectDetailsModal';
import { toast } from 'sonner';

interface CompanySearchResult {
  company_number: string;
  company_name: string;
  company_status: string;
  company_type: string;
  date_of_creation?: string;
  registered_office_address: {
    premises?: string;
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    postal_code?: string;
  };
  sic_codes?: string[];
  officers?: any[];
  filing_history?: any[];
  charges?: any[];
  persons_with_significant_control?: any[];
  address_validation?: {
    address: string;
    postcode_valid: boolean;
    address_exists: boolean;
    confidence_score: number;
    validation_sources: string[];
    alternative_addresses: string[];
  };
  address_similarity?: number;
}

const EnhancedCompaniesHouseSearch: React.FC = () => {
  const [activeTab, setActiveTab] = useState('basic-search');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Company Number Search
  const [companyNumber, setCompanyNumber] = useState('');
  
  // Basic Search
  const [basicSearchQuery, setBasicSearchQuery] = useState('');
  const [basicSearchMaxResults, setBasicSearchMaxResults] = useState(20);
  
  // Registered Office Search
  const [targetAddress, setTargetAddress] = useState('');
  const [similarityThreshold, setSimilarityThreshold] = useState(0.8);
  const [maxResults, setMaxResults] = useState(1000);
  const [exactMatch, setExactMatch] = useState(false); // Default to non-exact for more results
  
  // Advanced Filter Search
  const [advancedFilters, setAdvancedFilters] = useState({
    company_status: [] as string[],
    company_type: [] as string[],
    sic_codes: [] as string[],
    incorporated_from: '',
    incorporated_to: '',
    location: '',
    officer_name: '',
    has_charges: undefined as boolean | undefined,
    max_results: 100
  });
  
  // Filter options
  const [sicCodes, setSicCodes] = useState<Record<string, Record<string, string>>>({});
  const [companyTypes, setCompanyTypes] = useState<Record<string, string>>({});
  const [companyStatuses, setCompanyStatuses] = useState<Record<string, string>>({});

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [sicData, typesData, statusesData] = await Promise.all([
          outreachService.getSicCodes(),
          outreachService.getCompanyTypes(),
          outreachService.getCompanyStatuses()
        ]);
        
        setSicCodes(sicData);
        setCompanyTypes(typesData);
        setCompanyStatuses(statusesData);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    
    loadFilterOptions();
  }, []);

  // Company Number Search
  const handleCompanyNumberSearch = async () => {
    if (!companyNumber.trim()) {
      toast.error('Please enter a company number');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting company search for:', companyNumber);
      const result = await outreachService.searchByCompanyNumber(companyNumber);
      console.log('Search result:', result);
      setResults([result]);
      setSelectedCompany(result);
      toast.success('Company found successfully');
    } catch (error: any) {
      console.error('Company search failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      let errorMessage = 'Search failed. ';
      if (error.message?.includes('Failed to search company')) {
        errorMessage += 'Company not found. Please check the company number and try again.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage += 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('500')) {
        errorMessage += 'Server error. The API may be temporarily unavailable.';
      } else {
        errorMessage += 'Please contact support if the issue persists.';
      }
      
      toast.error(errorMessage);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Basic Search
  const handleBasicSearch = async () => {
    if (!basicSearchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting basic search for:', basicSearchQuery);
      const results = await outreachService.basicCompanySearch(basicSearchQuery, basicSearchMaxResults);
      console.log('Basic search results:', results);
      setResults(results);
      toast.success(`Found ${results.length} companies`);
    } catch (error: any) {
      console.error('Basic search failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      let errorMessage = 'Search failed. ';
      if (error.message?.includes('Failed to search')) {
        errorMessage += 'No companies found matching your search. Please try different keywords.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage += 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('500')) {
        errorMessage += 'Server error. The API may be temporarily unavailable.';
      } else {
        errorMessage += 'Please contact support if the issue persists.';
      }
      
      toast.error(errorMessage);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Registered Office Search
  const handleRegisteredOfficeSearch = async () => {
    if (!targetAddress.trim()) {
      toast.error('Please enter a registered office address');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting address matching search for:', targetAddress);
      console.log('Max results setting:', maxResults);
      console.log('Similarity threshold:', similarityThreshold);
      console.log('Exact match setting:', exactMatch);
      const results = await outreachService.searchByRegisteredOffice(
        targetAddress,
        similarityThreshold,
        maxResults,
        exactMatch
      );
      console.log('Address matching results:', results);
      setResults(results);
      toast.success(`Found ${results.length} companies with ${exactMatch ? 'exact' : 'similar'} address match`);
    } catch (error: any) {
      console.error('Address matching search failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      let errorMessage = 'Address search failed. ';
      if (error.message?.includes('Failed to search')) {
        errorMessage += 'No companies found with exact address match. Please try a different address.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage += 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('500')) {
        errorMessage += 'Server error. The API may be temporarily unavailable.';
      } else {
        errorMessage += 'Please contact support if the issue persists.';
      }
      
      toast.error(errorMessage);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Advanced Filter Search
  const handleAdvancedSearch = async () => {
    setLoading(true);
    try {
      const result = await outreachService.advancedFilterSearch(advancedFilters);
      setResults(result.companies);
      toast.success(`Found ${result.total_found} companies matching your criteria`);
    } catch (error) {
      console.error('Advanced search failed:', error);
      toast.error('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Accounting Firm Clients Search
  const handleAccountingFirmClientsSearch = async () => {
    if (!targetAddress.trim()) {
      toast.error('Please enter the accounting firm\'s registered office address');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting accounting firm clients search for:', targetAddress);
      const results = await outreachService.searchByRegisteredOffice(
        targetAddress,
        similarityThreshold,
        maxResults,
        exactMatch
      );
      
      // Filter out accounting firms to show only potential clients
      const filteredResults = results.filter(company => {
        const name = company.company_name?.toLowerCase() || '';
        const sicCodes = company.sic_codes || [];
        
        // Exclude companies that are clearly accounting firms
        const isAccountingFirm = name.includes('accounting') || 
                                 name.includes('accountant') || 
                                 name.includes('audit') ||
                                 sicCodes.some(code => code.startsWith('69201')); // SIC code for accounting
        
        return !isAccountingFirm;
      });
      
      console.log('Accounting firm clients results:', filteredResults);
      setResults(filteredResults);
      toast.success(`Found ${filteredResults.length} potential clients (${results.length - filteredResults.length} accounting firms filtered out)`);
    } catch (error: any) {
      console.error('Accounting firm clients search failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      let errorMessage = 'Client search failed. ';
      if (error.message?.includes('Failed to search')) {
        errorMessage += 'No potential clients found. Please try a different address.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage += 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('500')) {
        errorMessage += 'Server error. The API may be temporarily unavailable.';
      } else {
        errorMessage += 'Please contact support if the issue persists.';
      }
      
      toast.error(errorMessage);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Comprehensive Export Handler
  const handleComprehensiveExport = async () => {
    if (!targetAddress.trim()) {
      toast.error('Please enter an address to export');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting comprehensive export for:', targetAddress);
      const exportData = await outreachService.comprehensiveExport(targetAddress);
      console.log('Export data:', exportData);
      
      // Create downloadable JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `companies_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported comprehensive data for ${exportData.total_companies} companies`);
    } catch (error: any) {
      console.error('Comprehensive export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Address Matching from Search Result
  const handleAddressMatchingFromResult = async (company: CompanySearchResult) => {
    // Check for address in multiple possible fields
    const address = company.address || company.registered_office_address || company.address_snippet;
    
    if (!address) {
      toast.error('No registered office address available for this company');
      return;
    }

    // Format the address for search - handle both object and string formats
    let formattedAddress: string;
    if (typeof address === 'string') {
      formattedAddress = address;
    } else {
      formattedAddress = formatAddress(address);
    }
    
    // Set the address in the address matching tab
    setTargetAddress(formattedAddress);
    
    // Switch to address matching tab
    setActiveTab('registered-office');
    
    // Automatically trigger the search
    setLoading(true);
    try {
      const results = await outreachService.searchByRegisteredOffice(
        formattedAddress, 
        similarityThreshold, 
        maxResults,
        exactMatch
      );
      setResults(results);
      toast.success(`Found ${results.length} companies with ${exactMatch ? 'exact' : 'similar'} address match`);
    } catch (error: any) {
      console.error('Address matching from result failed:', error);
      toast.error('Address matching failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Format address for display
  const formatAddress = (address: any) => {
    if (!address) return 'Address not available';
    
    const parts = [
      address.premises,
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.postal_code
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'dissolved': return 'bg-red-100 text-red-800';
      case 'liquidation': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enhanced Companies House Search</h1>
        <p className="text-gray-500">Advanced company search with live data, address matching, and external validation</p>
        
        {/* Live Data Notice */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Live Data Active</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Connected to Companies House API. All searches will return real, up-to-date company data.
            Rate limited to 600 requests per 5 minutes as per Companies House guidelines.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="basic-search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Basic Search
          </TabsTrigger>
          <TabsTrigger value="company-number" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Company Number
          </TabsTrigger>
          <TabsTrigger value="registered-office" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Address Matching
          </TabsTrigger>
          <TabsTrigger value="advanced-filter" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Advanced Filters
          </TabsTrigger>
          <TabsTrigger value="accounting-clients" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Find Clients
          </TabsTrigger>
          <TabsTrigger value="officer-network" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Officer Network
          </TabsTrigger>
          <TabsTrigger value="dissolved-companies" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Dissolved Companies
          </TabsTrigger>
        </TabsList>

        {/* Basic Search */}
        <TabsContent value="basic-search">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Basic Company Search
              </CardTitle>
              <p className="text-sm text-gray-600">
                Search for companies by name, number, or any other identifier
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Enter company name, number, or any search term"
                    value={basicSearchQuery}
                    onChange={(e) => setBasicSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBasicSearch()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleBasicSearch} 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Search
                  </Button>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="max-results">Max Results:</Label>
                    <Select value={basicSearchMaxResults.toString()} onValueChange={(value) => setBasicSearchMaxResults(parseInt(value))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Number Search */}
        <TabsContent value="company-number">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Live Company Number Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Enter company number (e.g., 12345678)"
                    value={companyNumber}
                    onChange={(e) => setCompanyNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCompanyNumberSearch()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleCompanyNumberSearch} 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Search
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Get instant, comprehensive company data including officers, filing history, charges, and address validation.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registered Office Search */}
        <TabsContent value="registered-office">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                Registered Office Address Matching
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter the registered office address to match against..."
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  rows={3}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="similarity">Similarity Threshold</Label>
                    <Select value={similarityThreshold.toString()} onValueChange={(v) => setSimilarityThreshold(parseFloat(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.6">60% - Loose matching</SelectItem>
                        <SelectItem value="0.7">70% - Moderate matching</SelectItem>
                        <SelectItem value="0.8">80% - Strict matching</SelectItem>
                        <SelectItem value="0.9">90% - Very strict matching</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="maxResults">Max Results</Label>
                    <Select value={maxResults.toString()} onValueChange={(v) => setMaxResults(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 results</SelectItem>
                        <SelectItem value="50">50 results</SelectItem>
                        <SelectItem value="100">100 results</SelectItem>
                        <SelectItem value="200">200 results</SelectItem>
                        <SelectItem value="500">500 results</SelectItem>
                        <SelectItem value="1000">1000 results</SelectItem>
                        <SelectItem value="0">ALL RESULTS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="exactMatch">Match Type</Label>
                    <Select value={exactMatch.toString()} onValueChange={(v) => setExactMatch(v === 'true')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Similar Addresses (More Results)</SelectItem>
                        <SelectItem value="true">Exact Address Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleRegisteredOfficeSearch} 
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4 mr-2" />
                    )}
                    Find Matching Companies
                  </Button>
                  
                  <Button 
                    onClick={handleAccountingFirmClientsSearch} 
                    disabled={loading}
                    variant="outline"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Find Accounting Clients
                  </Button>
                  
                  <Button 
                    onClick={handleComprehensiveExport} 
                    disabled={loading}
                    variant="outline"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export All Data
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500">
                  Perfect for finding clients of accounting firms by matching registered office addresses.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Filter Search */}
        <TabsContent value="advanced-filter">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-600" />
                Advanced Filtering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Company Status & Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company Status</Label>
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                      {Object.entries(companyStatuses).map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${key}`}
                            checked={advancedFilters.company_status.includes(key)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  company_status: [...prev.company_status, key]
                                }));
                              } else {
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  company_status: prev.company_status.filter(s => s !== key)
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={`status-${key}`} className="text-sm">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Company Type</Label>
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                      {Object.entries(companyTypes).slice(0, 8).map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${key}`}
                            checked={advancedFilters.company_type.includes(key)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  company_type: [...prev.company_type, key]
                                }));
                              } else {
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  company_type: prev.company_type.filter(t => t !== key)
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={`type-${key}`} className="text-sm">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* SIC Codes */}
                <div>
                  <Label>Industry (SIC Codes)</Label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(sicCodes).map(([category, codes]) => (
                      <div key={category}>
                        <h4 className="font-medium text-sm mb-2 capitalize">
                          {category.replace(/_/g, ' ')}
                        </h4>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {Object.entries(codes).slice(0, 5).map(([code, description]) => (
                            <div key={code} className="flex items-center space-x-2">
                              <Checkbox
                                id={`sic-${code}`}
                                checked={advancedFilters.sic_codes.includes(code)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setAdvancedFilters(prev => ({
                                      ...prev,
                                      sic_codes: [...prev.sic_codes, code]
                                    }));
                                  } else {
                                    setAdvancedFilters(prev => ({
                                      ...prev,
                                      sic_codes: prev.sic_codes.filter(s => s !== code)
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={`sic-${code}`} className="text-xs">
                                {code}: {description}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Date Ranges & Other Filters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="incorporated-from">Incorporated From</Label>
                    <Input
                      id="incorporated-from"
                      type="date"
                      value={advancedFilters.incorporated_from}
                      onChange={(e) => setAdvancedFilters(prev => ({
                        ...prev,
                        incorporated_from: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="incorporated-to">Incorporated To</Label>
                    <Input
                      id="incorporated-to"
                      type="date"
                      value={advancedFilters.incorporated_to}
                      onChange={(e) => setAdvancedFilters(prev => ({
                        ...prev,
                        incorporated_to: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, county, or postcode"
                      value={advancedFilters.location}
                      onChange={(e) => setAdvancedFilters(prev => ({
                        ...prev,
                        location: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="officer-name">Officer Name</Label>
                    <Input
                      id="officer-name"
                      placeholder="Director or secretary name"
                      value={advancedFilters.officer_name}
                      onChange={(e) => setAdvancedFilters(prev => ({
                        ...prev,
                        officer_name: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-charges"
                    checked={advancedFilters.has_charges === true}
                    onCheckedChange={(checked) => {
                      setAdvancedFilters(prev => ({
                        ...prev,
                        has_charges: checked ? true : undefined
                      }));
                    }}
                  />
                  <Label htmlFor="has-charges">Only companies with charges/mortgages</Label>
                </div>

                <Button 
                  onClick={handleAdvancedSearch} 
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Filter className="w-4 h-4 mr-2" />
                  )}
                  Search with Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounting Clients Tab */}
        <TabsContent value="accounting-clients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Find Accounting Firm Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter the accounting firm's registered office address..."
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  rows={3}
                />
                
                <div>
                  <Label htmlFor="client-max-results">Max Results</Label>
                  <Select value={maxResults.toString()} onValueChange={(v) => setMaxResults(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 results</SelectItem>
                      <SelectItem value="50">50 results</SelectItem>
                      <SelectItem value="100">100 results</SelectItem>
                      <SelectItem value="200">200 results</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleAccountingFirmClientsSearch} 
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Target className="w-4 h-4 mr-2" />
                  )}
                  Find Potential Clients
                </Button>
                
                <p className="text-sm text-gray-500">
                  Automatically finds companies that share the same registered office as the accounting firm, 
                  filtering out accounting firms themselves to show only potential clients.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Officer Network Tab */}
        <TabsContent value="officer-network">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Officer Network Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Enter officer name (e.g., John Smith)"
                  value={advancedFilters.officer_name}
                  onChange={(e) => setAdvancedFilters(prev => ({
                    ...prev,
                    officer_name: e.target.value
                  }))}
                />
                
                <div>
                  <Label htmlFor="network-max-results">Max Companies</Label>
                  <Select 
                    value={maxResults.toString()} 
                    onValueChange={(v) => setMaxResults(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 companies</SelectItem>
                      <SelectItem value="50">50 companies</SelectItem>
                      <SelectItem value="100">100 companies</SelectItem>
                      <SelectItem value="200">200 companies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={async () => {
                    if (!advancedFilters.officer_name.trim()) {
                      toast.error('Please enter an officer name');
                      return;
                    }
                    
                    setLoading(true);
                    try {
                      // This would call a new service method for officer network search
                      toast.success('Officer network search functionality coming soon!');
                    } catch (error) {
                      toast.error('Search failed. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Users className="w-4 h-4 mr-2" />
                  )}
                  Search Officer Network
                </Button>
                
                <p className="text-sm text-gray-500">
                  Find all companies where a specific officer has appointments. Perfect for due diligence 
                  and understanding business networks.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dissolved Companies Tab */}
        <TabsContent value="dissolved-companies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                Dissolved Companies Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search for dissolved companies..."
                  value={companyNumber}
                  onChange={(e) => setCompanyNumber(e.target.value)}
                />
                
                <div>
                  <Label htmlFor="dissolved-max-results">Max Results</Label>
                  <Select value={maxResults.toString()} onValueChange={(v) => setMaxResults(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20 results</SelectItem>
                      <SelectItem value="50">50 results</SelectItem>
                      <SelectItem value="100">100 results</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={async () => {
                    if (!companyNumber.trim()) {
                      toast.error('Please enter a search term');
                      return;
                    }
                    
                    setLoading(true);
                    try {
                      // This would call the dissolved companies search
                      toast.success('Dissolved companies search functionality coming soon!');
                    } catch (error) {
                      toast.error('Search failed. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Search Dissolved Companies
                </Button>
                
                <p className="text-sm text-gray-500">
                  Search for companies that have been dissolved or are no longer active. 
                  Useful for historical research and due diligence.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Section */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Search Results ({results.length})</span>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((company) => (
                <div 
                  key={company.company_number} 
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedCompany(company)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{company.company_name || company.title}</h3>
                        <Badge className={getStatusColor(company.company_status)}>
                          {company.company_status}
                        </Badge>
                        {company.address_similarity && (
                          <Badge variant="outline">
                            {Math.round(company.address_similarity * 100)}% match
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Company Number:</strong> {company.company_number}</p>
                          <p><strong>Type:</strong> {company.company_type}</p>
                          {company.date_of_creation && (
                            <p><strong>Incorporated:</strong> {new Date(company.date_of_creation).toLocaleDateString()}</p>
                          )}
                        </div>
                        
                        <div>
                          <p><strong>Address:</strong></p>
                          <p className="text-xs">{company.address_snippet || formatAddress(company.registered_office_address) || 'Address not available'}</p>
                          {company.address_validation && (
                            <div className="flex items-center gap-1 mt-1">
                              {company.address_validation.address_exists ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-orange-600" />
                              )}
                              <span className="text-xs">
                                {company.address_validation.confidence_score > 0.8 ? 'Verified' : 'Unverified'} address
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {company.sic_codes && company.sic_codes.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {company.sic_codes.slice(0, 3).map((code) => (
                              <Badge key={code} variant="secondary" className="text-xs">
                                {code}
                              </Badge>
                            ))}
                            {company.sic_codes.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{company.sic_codes.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await savedProspectsService.saveProspect(company);
                            toast.success(`Saved ${company.company_name}`);
                          } catch (error: any) {
                            if (error.message.includes('already exists')) {
                              toast.info('Company already saved');
                            } else {
                              console.error(error);
                              toast.error('Failed to save company');
                            }
                          }
                        }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompany(company);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`, '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Companies House
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddressMatchingFromResult(company);
                        }}
                      >
                        <MapPin className="w-4 h-4 mr-1" />
                        Address Matching
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Company View */}
      {selectedCompany && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Company Details: {selectedCompany.company_name}</span>
              <Button variant="outline" onClick={() => setSelectedCompany(null)}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="officers">Officers ({selectedCompany.officers?.length || 0})</TabsTrigger>
                <TabsTrigger value="filings">Filings ({selectedCompany.filing_history?.length || 0})</TabsTrigger>
                <TabsTrigger value="charges">Charges ({selectedCompany.charges?.length || 0})</TabsTrigger>
                <TabsTrigger value="validation">Address Validation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Company Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Number:</strong> {selectedCompany.company_number}</p>
                      <p><strong>Status:</strong> {selectedCompany.company_status}</p>
                      <p><strong>Type:</strong> {selectedCompany.company_type}</p>
                      {selectedCompany.date_of_creation && (
                        <p><strong>Incorporated:</strong> {new Date(selectedCompany.date_of_creation).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Registered Office</h4>
                    <p className="text-sm">{formatAddress(selectedCompany.registered_office_address)}</p>
                  </div>
                </div>
                
                {selectedCompany.sic_codes && selectedCompany.sic_codes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">SIC Codes</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedCompany.sic_codes.map((code) => (
                        <Badge key={code} variant="secondary">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="officers">
                <div className="space-y-3">
                  {selectedCompany.officers?.map((officer, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{officer.name}</h5>
                        <Badge variant="outline">{officer.role}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {officer.appointed_on && (
                          <p><strong>Appointed:</strong> {new Date(officer.appointed_on).toLocaleDateString()}</p>
                        )}
                        {officer.nationality && (
                          <p><strong>Nationality:</strong> {officer.nationality}</p>
                        )}
                        {officer.occupation && (
                          <p><strong>Occupation:</strong> {officer.occupation}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="filings">
                <div className="space-y-2">
                  {selectedCompany.filing_history?.map((filing, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{filing.description}</p>
                        <p className="text-xs text-gray-500">{filing.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{new Date(filing.date).toLocaleDateString()}</p>
                        <Badge variant="outline" className="text-xs">{filing.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="charges">
                <div className="space-y-3">
                  {selectedCompany.charges?.map((charge, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{charge.charge_type}</h5>
                        <Badge className={charge.status === 'outstanding' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                          {charge.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Created:</strong> {new Date(charge.created).toLocaleDateString()}</p>
                        {charge.amount && <p><strong>Amount:</strong> {charge.amount}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="validation">
                {selectedCompany.address_validation ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {selectedCompany.address_validation.address_exists ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      )}
                      <span className="font-medium">
                        Address Validation Score: {Math.round(selectedCompany.address_validation.confidence_score * 100)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2">Validation Results</h5>
                        <div className="space-y-1 text-sm">
                          <p><strong>Postcode Valid:</strong> {selectedCompany.address_validation.postcode_valid ? 'Yes' : 'No'}</p>
                          <p><strong>Address Exists:</strong> {selectedCompany.address_validation.address_exists ? 'Yes' : 'No'}</p>
                          <p><strong>Sources:</strong> {selectedCompany.address_validation.validation_sources.join(', ')}</p>
                        </div>
                      </div>
                      
                      {selectedCompany.address_validation.alternative_addresses.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Alternative Addresses</h5>
                          <div className="space-y-1 text-sm">
                            {selectedCompany.address_validation.alternative_addresses.slice(0, 3).map((addr, index) => (
                              <p key={index} className="text-gray-600">{addr}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No address validation data available</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Prospect Details Modal */}
      {showDetailsModal && selectedCompany && (
        <ProspectDetailsModal
          prospectId={null}
          companyData={selectedCompany}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCompany(null);
          }}
          onResearchComplete={(results) => {
            console.log('Research completed:', results);
            // Optionally refresh the results
          }}
        />
      )}
    </div>
  );
};

export default EnhancedCompaniesHouseSearch;
