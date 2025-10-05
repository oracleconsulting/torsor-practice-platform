import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Download,
  ArrowLeftRight,
  Building2
} from 'lucide-react';
import { outreachService } from '@/services/accountancy/outreachService';
import { toast } from 'sonner';

interface CompanySearchResult {
  company_number: string;
  company_name: string;
  company_status: string;
  company_type: string;
  date_of_creation?: string;
  registered_office_address: any;
  sic_codes?: string[];
}

interface ComparisonResults {
  range1_only: CompanySearchResult[];
  range2_only: CompanySearchResult[];
  in_both: CompanySearchResult[];
  left_firms: CompanySearchResult[];
  new_firms: CompanySearchResult[];
}

export const DateRangeComparison: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [targetAddress, setTargetAddress] = useState('');
  
  // Date Range 1
  const [dateRange1Start, setDateRange1Start] = useState('');
  const [dateRange1End, setDateRange1End] = useState('');
  
  // Date Range 2
  const [dateRange2Start, setDateRange2Start] = useState('');
  const [dateRange2End, setDateRange2End] = useState('');
  
  const [comparisonResults, setComparisonResults] = useState<ComparisonResults | null>(null);

  const handleComparison = async () => {
    if (!targetAddress.trim()) {
      toast.error('Please enter a registered office address');
      return;
    }

    if (!dateRange1Start || !dateRange1End || !dateRange2Start || !dateRange2End) {
      toast.error('Please enter both date ranges');
      return;
    }

    setLoading(true);
    try {
      const results = await outreachService.compareDateRanges(
        targetAddress,
        { start: dateRange1Start, end: dateRange1End },
        { start: dateRange2Start, end: dateRange2End }
      );

      setComparisonResults(results);
      
      toast.success(
        `Found ${results.new_firms.length} new firms and ${results.left_firms.length} firms that left`
      );
    } catch (error: any) {
      console.error('Date range comparison failed:', error);
      toast.error('Comparison failed. Please try again.');
      setComparisonResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportResults = () => {
    if (!comparisonResults) return;

    const exportData = {
      address: targetAddress,
      date_range_1: { start: dateRange1Start, end: dateRange1End },
      date_range_2: { start: dateRange2Start, end: dateRange2End },
      summary: {
        new_firms: comparisonResults.new_firms.length,
        left_firms: comparisonResults.left_firms.length,
        unchanged_firms: comparisonResults.in_both.length
      },
      new_firms: comparisonResults.new_firms,
      left_firms: comparisonResults.left_firms,
      unchanged_firms: comparisonResults.in_both
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `date_range_comparison_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Comparison results exported successfully');
  };

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;
    
    const parts = [
      address.premises,
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.postal_code
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-purple-600" />
            Date Range Comparison
          </CardTitle>
          <p className="text-sm text-gray-600">
            Compare two date ranges to track client registrations, identify firms that have left, or find new acquisitions
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Address Input */}
            <div>
              <Label htmlFor="address">Registered Office Address</Label>
              <Textarea
                id="address"
                placeholder="Enter the accounting firm's registered office address..."
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Date Ranges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Range 1 */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Period 1 (Earlier)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="range1-start">Start Date</Label>
                    <Input
                      id="range1-start"
                      type="date"
                      value={dateRange1Start}
                      onChange={(e) => setDateRange1Start(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="range1-end">End Date</Label>
                    <Input
                      id="range1-end"
                      type="date"
                      value={dateRange1End}
                      onChange={(e) => setDateRange1End(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Date Range 2 */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Period 2 (Later)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="range2-start">Start Date</Label>
                    <Input
                      id="range2-start"
                      type="date"
                      value={dateRange2Start}
                      onChange={(e) => setDateRange2Start(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="range2-end">End Date</Label>
                    <Input
                      id="range2-end"
                      type="date"
                      value={dateRange2End}
                      onChange={(e) => setDateRange2End(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleComparison} 
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                )}
                Compare Periods
              </Button>
              
              {comparisonResults && (
                <Button 
                  onClick={handleExportResults}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonResults && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">New Firms</p>
                    <p className="text-xs text-green-600 mt-1">Registered in Period 2</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-3xl font-bold text-green-900">
                      {comparisonResults.new_firms.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">Firms That Left</p>
                    <p className="text-xs text-red-600 mt-1">Not in Period 2</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <span className="text-3xl font-bold text-red-900">
                      {comparisonResults.left_firms.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Unchanged</p>
                    <p className="text-xs text-blue-600 mt-1">In both periods</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span className="text-3xl font-bold text-blue-900">
                      {comparisonResults.in_both.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results Tabs */}
          <Tabs defaultValue="new-firms">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="new-firms" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                New Firms ({comparisonResults.new_firms.length})
              </TabsTrigger>
              <TabsTrigger value="left-firms" className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Left Firms ({comparisonResults.left_firms.length})
              </TabsTrigger>
              <TabsTrigger value="unchanged" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Unchanged ({comparisonResults.in_both.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new-firms">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-green-800">
                    New Firms - Potential Acquisition Targets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {comparisonResults.new_firms.map((company) => (
                      <div key={company.company_number} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-green-900">{company.company_name}</h4>
                            <p className="text-sm text-green-700">Company #{company.company_number}</p>
                            <p className="text-xs text-green-600 mt-1">
                              {formatAddress(company.registered_office_address)}
                            </p>
                          </div>
                          <Badge className="bg-green-600 text-white">
                            {company.company_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {comparisonResults.new_firms.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No new firms found in Period 2</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="left-firms">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-red-800">
                    Firms That Left - Potential Clients Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {comparisonResults.left_firms.map((company) => (
                      <div key={company.company_number} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-red-900">{company.company_name}</h4>
                            <p className="text-sm text-red-700">Company #{company.company_number}</p>
                            <p className="text-xs text-red-600 mt-1">
                              {formatAddress(company.registered_office_address)}
                            </p>
                          </div>
                          <Badge className="bg-red-600 text-white">
                            {company.company_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {comparisonResults.left_firms.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No firms left between periods</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="unchanged">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-blue-800">
                    Unchanged Firms - Stable Client Base
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {comparisonResults.in_both.slice(0, 50).map((company) => (
                      <div key={company.company_number} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-blue-900">{company.company_name}</h4>
                            <p className="text-sm text-blue-700">Company #{company.company_number}</p>
                            <p className="text-xs text-blue-600 mt-1">
                              {formatAddress(company.registered_office_address)}
                            </p>
                          </div>
                          <Badge className="bg-blue-600 text-white">
                            {company.company_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {comparisonResults.in_both.length > 50 && (
                      <p className="text-center text-blue-600 py-4">
                        Showing 50 of {comparisonResults.in_both.length} unchanged firms. Export for full list.
                      </p>
                    )}
                    {comparisonResults.in_both.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No unchanged firms found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

