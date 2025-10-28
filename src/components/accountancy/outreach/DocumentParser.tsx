import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Download, 
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileSearch
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://oracle-api-server-production.up.railway.app';

interface DocumentParseResult {
  company_number: string;
  company_name: string;
  current_auditor?: string;
  identified_accountant?: string;
  confidence_score: number;
  source_document?: string;
  filing_date?: string;
  notes: string;
  all_candidates?: Array<{
    firm_name: string;
    confidence: number;
    source_document: string;
    filing_date: string;
  }>;
}

export const DocumentParser: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  
  // Single company state
  const [companyNumber, setCompanyNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [currentAuditor, setCurrentAuditor] = useState('');
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<DocumentParseResult | null>(null);
  
  // Batch upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<DocumentParseResult[]>([]);
  const [batchSummary, setBatchSummary] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  const handleSingleParse = async () => {
    if (!companyNumber.trim()) {
      toast.error('Please enter a company number');
      return;
    }

    setSingleLoading(true);
    setSingleResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/outreach/document-parser/parse-single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_number: companyNumber,
          company_name: companyName,
          current_auditor: currentAuditor || null,
          max_filings: 3
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.result) {
        setSingleResult(data.result);
        
        if (data.result.identified_accountant) {
          toast.success(
            `Found accountant: ${data.result.identified_accountant} (${data.result.confidence_score}% confidence)`,
            { duration: 5000 }
          );
        } else {
          toast.warning('No accountant identified in filing documents');
        }
      } else {
        throw new Error(data.error || 'Parsing failed');
      }
    } catch (error: any) {
      console.error('Single parse error:', error);
      toast.error(`Failed to parse documents: ${error.message}`);
    } finally {
      setSingleLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      setUploadedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleBatchParse = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a CSV file first');
      return;
    }

    setBatchLoading(true);
    setBatchResults([]);
    setBatchSummary(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch(`${API_BASE_URL}/api/outreach/document-parser/parse-csv`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setBatchResults(data.results || []);
        setBatchSummary(data.summary);
        setProgress(100);
        
        toast.success(
          `Processed ${data.summary.total_companies} companies! Found ${data.summary.accountants_identified} accountants (${data.summary.high_confidence_matches} high confidence)`,
          { duration: 6000 }
        );
      } else {
        throw new Error(data.error || 'Batch parsing failed');
      }
    } catch (error: any) {
      console.error('Batch parse error:', error);
      toast.error(`Failed to process CSV: ${error.message}`);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleExport = () => {
    if (batchResults.length === 0 && !singleResult) {
      toast.error('No results to export');
      return;
    }

    const results = batchResults.length > 0 ? batchResults : (singleResult ? [singleResult] : []);
    
    // Create CSV content
    const headers = [
      'company_name',
      'company_number',
      'current_auditor',
      'identified_accountant',
      'confidence_score',
      'source_document',
      'filing_date',
      'notes'
    ];
    
    const csvContent = [
      headers.join(','),
      ...results.map(r => [
        `"${r.company_name || ''}"`,
        r.company_number || '',
        `"${r.current_auditor || ''}"`,
        `"${r.identified_accountant || ''}"`,
        r.confidence_score || 0,
        `"${r.source_document || ''}"`,
        r.filing_date || '',
        `"${r.notes || ''}"`,
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accountant_extraction_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Results exported successfully!');
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 70) {
      return <Badge className="bg-green-600">High Confidence ({score}%)</Badge>;
    } else if (score >= 40) {
      return <Badge className="bg-yellow-600">Medium Confidence ({score}%)</Badge>;
    } else if (score > 0) {
      return <Badge className="bg-orange-600">Low Confidence ({score}%)</Badge>;
    } else {
      return <Badge variant="outline">No Match</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileSearch className="w-8 h-8 text-purple-600" />
            <div>
              <CardTitle>Document Parser</CardTitle>
              <CardDescription>
                Extract accountant/agent information from Companies House filing documents
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'single' | 'batch')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Company</TabsTrigger>
              <TabsTrigger value="batch">Bulk Upload (CSV)</TabsTrigger>
            </TabsList>

            {/* Single Company Tab */}
            <TabsContent value="single" className="space-y-4">
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="company-number">Company Number *</Label>
                    <Input
                      id="company-number"
                      placeholder="e.g., 11411023"
                      value={companyNumber}
                      onChange={(e) => setCompanyNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company-name">Company Name (optional)</Label>
                    <Input
                      id="company-name"
                      placeholder="e.g., ABC Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="current-auditor">Current Auditor (to exclude from results)</Label>
                    <Input
                      id="current-auditor"
                      placeholder="e.g., PwC, Deloitte"
                      value={currentAuditor}
                      onChange={(e) => setCurrentAuditor(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      The parser will exclude this auditor from results
                    </p>
                  </div>

                  <Button 
                    onClick={handleSingleParse} 
                    disabled={singleLoading}
                    className="w-full"
                  >
                    {singleLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Parsing Documents...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Parse Documents
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Single Result Display */}
              {singleResult && (
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Parsing Result</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">Company</Label>
                        <p className="font-medium">{singleResult.company_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{singleResult.company_number}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Current Auditor</Label>
                        <p>{singleResult.current_auditor || 'Not specified'}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Label className="text-sm text-gray-600">Identified Accountant</Label>
                      <div className="mt-2 flex items-center gap-2">
                        {singleResult.identified_accountant ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-lg">{singleResult.identified_accountant}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-500">No accountant identified</span>
                          </>
                        )}
                      </div>
                      <div className="mt-2">
                        {getConfidenceBadge(singleResult.confidence_score)}
                      </div>
                    </div>

                    {singleResult.source_document && (
                      <div>
                        <Label className="text-sm text-gray-600">Source</Label>
                        <p className="text-sm">{singleResult.source_document}</p>
                        {singleResult.filing_date && (
                          <p className="text-xs text-gray-500">Filed: {singleResult.filing_date}</p>
                        )}
                      </div>
                    )}

                    {singleResult.notes && (
                      <div>
                        <Label className="text-sm text-gray-600">Notes</Label>
                        <p className="text-sm text-gray-700">{singleResult.notes}</p>
                      </div>
                    )}

                    {singleResult.all_candidates && singleResult.all_candidates.length > 1 && (
                      <div>
                        <Label className="text-sm text-gray-600">Other Candidates Found</Label>
                        <div className="mt-2 space-y-2">
                          {singleResult.all_candidates.slice(1, 4).map((candidate, idx) => (
                            <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                              <span className="font-medium">{candidate.firm_name}</span>
                              <span className="text-gray-500 ml-2">({candidate.confidence}% confidence)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Batch Upload Tab */}
            <TabsContent value="batch" className="space-y-4">
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="csv-upload">Upload CSV File</Label>
                    <div className="mt-2">
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      <p><strong>CSV Format:</strong> company_number, company_name, current_auditor</p>
                      <p><strong>Example:</strong></p>
                      <code className="block bg-white p-2 rounded mt-1">
                        company_number,company_name,current_auditor<br />
                        11411023,ABC Ltd,PwC<br />
                        12345678,XYZ Ltd,Deloitte
                      </code>
                    </div>
                  </div>

                  {uploadedFile && (
                    <div className="flex items-center gap-2 p-3 bg-white rounded border">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium">{uploadedFile.name}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  )}

                  <Button 
                    onClick={handleBatchParse} 
                    disabled={batchLoading || !uploadedFile}
                    className="w-full"
                  >
                    {batchLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing ({progress}%)...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Process All Companies
                      </>
                    )}
                  </Button>

                  {batchLoading && (
                    <Progress value={progress} className="w-full" />
                  )}
                </CardContent>
              </Card>

              {/* Batch Summary */}
              {batchSummary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">{batchSummary.total_companies}</p>
                        <p className="text-sm text-gray-600 mt-1">Total Companies</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{batchSummary.accountants_identified}</p>
                        <p className="text-sm text-gray-600 mt-1">Accountants Found</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-purple-600">{batchSummary.high_confidence_matches}</p>
                        <p className="text-sm text-gray-600 mt-1">High Confidence</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-orange-600">{batchSummary.success_rate}%</p>
                        <p className="text-sm text-gray-600 mt-1">Success Rate</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Batch Results Table */}
              {batchResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Results ({batchResults.length} companies)</CardTitle>
                      <Button onClick={handleExport} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Company</th>
                            <th className="px-4 py-2 text-left">Current Auditor</th>
                            <th className="px-4 py-2 text-left">Identified Accountant</th>
                            <th className="px-4 py-2 text-center">Confidence</th>
                            <th className="px-4 py-2 text-left">Source</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {batchResults.slice(0, 50).map((result, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium">{result.company_name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-500">{result.company_number}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">{result.current_auditor || '-'}</td>
                              <td className="px-4 py-3">
                                {result.identified_accountant ? (
                                  <span className="font-medium">{result.identified_accountant}</span>
                                ) : (
                                  <span className="text-gray-400">None</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {getConfidenceBadge(result.confidence_score)}
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-xs truncate max-w-xs" title={result.source_document}>
                                  {result.source_document || '-'}
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {batchResults.length > 50 && (
                        <p className="text-sm text-gray-500 mt-4 text-center">
                          Showing first 50 of {batchResults.length} results. Export to see all.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <CardTitle className="text-base text-blue-900">How It Works</CardTitle>
              <CardDescription className="text-blue-700">
                This tool analyzes Companies House filing documents to identify non-audit service providers
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• <strong>Single Mode:</strong> Parse one company at a time for quick checks</p>
          <p>• <strong>Bulk Mode:</strong> Upload a CSV with up to 1000 companies for batch processing</p>
          <p>• <strong>What it finds:</strong> Accounting firms listed as "Filed by", "Agent", or in accountant reports</p>
          <p>• <strong>Excludes:</strong> Formation agents (Inform Direct, etc.) and your specified auditors</p>
          <p>• <strong>Confidence scores:</strong> High (70%+), Medium (40-69%), Low (&lt;40%)</p>
        </CardContent>
      </Card>
    </div>
  );
};

