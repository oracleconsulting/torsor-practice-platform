import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Building2, RefreshCw } from 'lucide-react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import { Contact } from '@/types/outreach';
import { toast } from 'sonner';

export const ContactPage = () => {
  const navigate = useNavigate();
  const { practice } = useAccountancyContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [companyResults, setCompanyResults] = useState<any[]>([]);

  // Handle Companies House search
  const handleCompanySearch = async () => {
    if (!companySearchTerm.trim()) {
      toast.error('Please enter a company name or number');
      return;
    }

    setIsSearching(true);
    try {
      const results = await outreachService.searchCompaniesHouse(companySearchTerm);
      setCompanyResults(results);
    } catch (error) {
      console.error('Companies House search failed:', error);
      toast.error('Failed to search Companies House');
    } finally {
      setIsSearching(false);
    }
  };

  // Import company as contact
  const handleImportCompany = async (company: any) => {
    try {
      await outreachService.importCompanyAsContact(practice.id, company);
      toast.success('Company imported as contact');
      // Refresh contacts list
    } catch (error) {
      console.error('Failed to import company:', error);
      toast.error('Failed to import company');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500">Manage your contact database</p>
        </div>
        <Button onClick={() => navigate('new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Companies House Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Companies House Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by company name or number..."
                value={companySearchTerm}
                onChange={(e) => setCompanySearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCompanySearch()}
              />
            </div>
            <Button 
              onClick={handleCompanySearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </Button>
          </div>

          {/* Search Results */}
          {companyResults.length > 0 && (
            <div className="mt-4 space-y-4">
              <h3 className="font-medium">Search Results</h3>
              <div className="divide-y">
                {companyResults.map((company) => (
                  <div 
                    key={company.company_number}
                    className="py-3 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-medium">{company.title}</h4>
                      <p className="text-sm text-gray-500">
                        Company Number: {company.company_number}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleImportCompany(company)}
                    >
                      Import
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regular contact search and list will go here */}
    </div>
  );
}; 