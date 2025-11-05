import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Download, Search, Building2, Users, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { makeAuthenticatedRequest } from '@/services/accountancy/outreachService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://oracle-api-server-production.up.railway.app';

interface CompanyResearchResult {
  company_number: string;
  company_profile: {
    company_name: string;
    company_status: string;
    registered_office_address: any;
    date_of_creation: string;
    sic_codes: string[];
  };
  officers: Array<{
    name: string;
    officer_role: string;
    appointed_on: string;
    resigned_on?: string;
  }>;
  filings: Array<{
    type: string;
    date: string;
    description: string;
    category: string;
  }>;
  filing_summary: {
    total_filings: number;
    by_category: Record<string, number>;
    recent_accounts: any[];
    recent_confirmations: any[];
    recent_changes: any[];
  };
  parsed_filings?: Array<{
    date: string;
    type: string;
    identified_accountant: string | null;
    confidence_score: number;
  }>;
}

interface BulkResearchResponse {
  success: boolean;
  summary: {
    total_companies: number;
    successful: number;
    failed: number;
    total_officers: number;
    total_filings: number;
    processing_time_seconds: number;
  };
  results: CompanyResearchResult[];
}

export const BulkCompanyResearch: React.FC = () => {
  const [singleCompanyNumber, setSingleCompanyNumber] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseDocuments, setParseDocuments] = useState(false);
  const [maxFilings, setMaxFilings] = useState(20);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkResearchResponse | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyResearchResult | null>(null);

  // Single company research
  const handleSingleResearch = async () => {
    if (!singleCompanyNumber.trim()) {
      toast.error('Please enter a company number');
      return;
    }

    setLoading(true);
    setResults(null);
    setSelectedCompany(null);

    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/outreach/bulk-research/research-single?company_number=${singleCompanyNumber}&include_filings=true&max_filings=${maxFilings}&parse_documents=${parseDocuments}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.result) {
        // Convert single result to bulk response format
        setResults({
          success: true,
          summary: {
            total_companies: 1,
            successful: 1,
            failed: 0,
            total_officers: data.result.officers?.length || 0,
            total_filings: data.result.filings?.length || 0,
            processing_time_seconds: 0,
          },
          results: [data.result],
        });
        
        setSelectedCompany(data.result);
        
        toast.success(
          `Found company: ${data.result.company_profile?.company_name || singleCompanyNumber}`,
          { duration: 5000 }
        );
      } else {
        throw new Error(data.error || 'Research failed');
      }
    } catch (error: any) {
      console.error('Single research error:', error);
      toast.error(`Failed to research company: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Bulk CSV research
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      setUploadedFile(file);
      toast.success(`File uploaded: ${file.name}`);
    }
  };

  const handleBulkResearch = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a CSV file first');
      return;
    }

    setLoading(true);
    setResults(null);
    setSelectedCompany(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/outreach/bulk-research/research-from-csv?parse_documents=${parseDocuments}&max_filings=${maxFilings}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResults(data);
        
        toast.success(
          `Researched ${data.summary.successful}/${data.summary.total_companies} companies! Found ${data.summary.total_officers} officers and ${data.summary.total_filings} filings.`,
          { duration: 6000 }
        );
      } else {
        throw new Error(data.error || 'Bulk research failed');
      }
    } catch (error: any) {
      console.error('Bulk research error:', error);
      toast.error(`Failed to process CSV: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Export results to CSV
  const handleExport = () => {
    if (!results) return;

    const csvRows = [];
    
    // Header row - user's requested format
    csvRows.push([
      'company_number',
      'company_name',
      'Directors_names',
      'Registered_office_address',
      'Company_status',
      'company_type',
      'incorporation_date',
      'sic_code',
      'Number_of_Officers',
      'Number_of_Filings',
      'Accounts_Filed',
      'Recent_Changes',
      'Filing_Summary',
    ].join(','));

    // Data rows
    for (const company of results.results) {
      const profile = company.company_profile;
      
      csvRows.push([
        company.company_number || '',
        `"${profile?.company_name || ''}"`,
        `"${company.directors_formatted || 'No directors'}"`,
        `"${company.address_formatted || ''}"`,
        profile?.company_status || '',
        profile?.company_type || '',
        profile?.date_of_creation || '',
        `"${company.sic_codes_formatted || ''}"`,
        company.officers?.length || 0,
        company.filings?.length || 0,
        company.filing_summary?.recent_accounts?.length || 0,
        company.filing_summary?.recent_changes?.length || 0,
        `"${company.filing_summary_text || ''}"`,
      ].join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_research_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Results exported to CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Single Company Research */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Single Company Research
          </CardTitle>
          <CardDescription>
            Research a single company: get profile, directors, and filing history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="companyNumber">Company Number</Label>
              <Input
                id="companyNumber"
                placeholder="e.g., 09741758"
                value={singleCompanyNumber}
                onChange={(e) => setSingleCompanyNumber(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="maxFilings">Max Filings</Label>
              <Input
                id="maxFilings"
                type="number"
                min="1"
                max="100"
                value={maxFilings}
                onChange={(e) => setMaxFilings(parseInt(e.target.value) || 20)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={parseDocuments}
                onChange={(e) => setParseDocuments(e.target.checked)}
                disabled={loading}
                className="w-4 h-4"
              />
              <span className="text-sm">Parse documents (extract accountant info - slower)</span>
            </label>
          </div>

          <Button
            onClick={handleSingleResearch}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Research Company
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk CSV Research */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk CSV Research
          </CardTitle>
          <CardDescription>
            Upload a CSV with company numbers to research multiple companies at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>CSV Format:</strong> Must include a column named "company_number" or "Company Number"
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="csvFile">Upload CSV File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
            />
            {uploadedFile && (
              <p className="text-sm text-green-600 mt-2">
                ✓ File ready: {uploadedFile.name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={parseDocuments}
                onChange={(e) => setParseDocuments(e.target.checked)}
                disabled={loading}
                className="w-4 h-4"
              />
              <span className="text-sm">Parse documents (extract accountant info - slower)</span>
            </label>
          </div>

          <Button
            onClick={handleBulkResearch}
            disabled={loading || !uploadedFile}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Research All Companies
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {results && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Research Complete
                </span>
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.summary.total_companies}</div>
                  <div className="text-sm text-gray-600">Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.summary.successful}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{results.summary.total_officers}</div>
                  <div className="text-sm text-gray-600">Officers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{results.summary.total_filings}</div>
                  <div className="text-sm text-gray-600">Filings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{results.summary.processing_time_seconds}s</div>
                  <div className="text-sm text-gray-600">Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {results.results.map((company, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => setSelectedCompany(company)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">
                            {company.company_profile?.company_name || company.company_number}
                          </span>
                          <Badge variant="outline">
                            {company.company_number}
                          </Badge>
                          <Badge variant={company.company_profile?.company_status === 'active' ? 'default' : 'secondary'}>
                            {company.company_profile?.company_status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {company.company_profile?.registered_office_address ? 
                            Object.values(company.company_profile.registered_office_address).filter(Boolean).slice(0, 2).join(', ')
                            : 'No address'}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {company.officers?.length || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {company.filings?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Detailed Company View */}
      {selectedCompany && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCompany.company_profile?.company_name || selectedCompany.company_number}
            </CardTitle>
            <CardDescription>
              Company Number: {selectedCompany.company_number}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Profile */}
            <div>
              <h3 className="font-semibold mb-2">Company Profile</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Status:</strong> {selectedCompany.company_profile?.company_status}</div>
                <div><strong>Created:</strong> {selectedCompany.company_profile?.date_of_creation}</div>
                <div className="col-span-2">
                  <strong>Address:</strong>{' '}
                  {selectedCompany.company_profile?.registered_office_address ?
                    Object.values(selectedCompany.company_profile.registered_office_address).filter(Boolean).join(', ')
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* Officers/Directors */}
            <div>
              <h3 className="font-semibold mb-2">Directors & Officers ({selectedCompany.officers?.length || 0})</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {selectedCompany.officers?.slice(0, 10).map((officer, idx) => (
                  <div key={idx} className="border-l-2 border-blue-500 pl-3 py-1">
                    <div className="font-medium">{officer.name}</div>
                    <div className="text-sm text-gray-600">
                      {officer.officer_role} • Appointed: {officer.appointed_on}
                      {officer.resigned_on && ` • Resigned: ${officer.resigned_on}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filing Summary */}
            <div>
              <h3 className="font-semibold mb-2">Filing Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Total Filings:</strong> {selectedCompany.filing_summary?.total_filings || 0}
                </div>
                <div>
                  <strong>Accounts:</strong> {selectedCompany.filing_summary?.recent_accounts?.length || 0}
                </div>
                <div>
                  <strong>Changes:</strong> {selectedCompany.filing_summary?.recent_changes?.length || 0}
                </div>
              </div>
            </div>

            {/* Parsed Filings (if available) */}
            {selectedCompany.parsed_filings && selectedCompany.parsed_filings.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Parsed Account Filings</h3>
                <div className="space-y-2">
                  {selectedCompany.parsed_filings.map((filing, idx) => (
                    <div key={idx} className="border rounded p-3 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{filing.type}</div>
                          <div className="text-sm text-gray-600">{filing.date}</div>
                        </div>
                        {filing.identified_accountant && (
                          <div className="text-right">
                            <div className="font-medium text-green-700">{filing.identified_accountant}</div>
                            <div className="text-sm text-gray-600">{filing.confidence_score}% confidence</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Filings List */}
            <div>
              <h3 className="font-semibold mb-2">Recent Filings ({selectedCompany.filings?.length || 0})</h3>
              <div className="space-y-1 max-h-[300px] overflow-y-auto text-sm">
                {selectedCompany.filings?.map((filing, idx) => (
                  <div key={idx} className="border-l-2 border-gray-300 pl-3 py-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{filing.type}</span>
                      <span className="text-gray-600">{filing.date}</span>
                    </div>
                    <div className="text-gray-600 text-xs">{filing.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

