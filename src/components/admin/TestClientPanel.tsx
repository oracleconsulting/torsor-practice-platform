import { useState } from 'react';
import { 
  FlaskConical, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Play, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  User
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TestClientPanelProps {
  practiceId: string;
  serviceLineCode: string;
  serviceLineName: string;
  onTestClientCreated?: (clientId: string) => void;
  onTestClientReset?: () => void;
}

interface TestClient {
  id: string;
  name: string;
  email: string;
  company: string | null;
  created_at: string;
  engagement_status?: string;
  has_assessment?: boolean;
  has_report?: boolean;
}

interface AssessmentField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

// Assessment templates for each service line
const ASSESSMENT_TEMPLATES: Record<string, AssessmentField[]> = {
  benchmarking: [
    { key: 'bm_revenue_exact', label: 'Annual Revenue (£)', type: 'number', placeholder: '750000', required: true },
    { key: 'bm_employee_count', label: 'Number of Employees', type: 'number', placeholder: '8', required: true },
    { key: 'bm_sic_code', label: 'SIC Code', type: 'text', placeholder: '62020' },
    { key: 'bm_sub_sector', label: 'Sub-sector', type: 'text', placeholder: 'Software Development' },
    { key: 'business_description', label: 'Business Description', type: 'textarea', placeholder: 'Describe the business...' },
    { key: 'performance_perception', label: 'Performance Perception', type: 'select', options: ['Above average', 'Average', 'Below average', 'Not sure'] },
    { key: 'suspected_underperformance', label: 'Suspected Underperformance', type: 'textarea', placeholder: 'Where do you think you might be underperforming?' },
    { key: 'leaving_money', label: 'Where Leaving Money', type: 'textarea', placeholder: 'Where do you think you might be leaving money on the table?' },
    { key: 'benchmark_magic_fix', label: 'Magic Fix', type: 'textarea', placeholder: 'If you could fix one thing overnight, what would it be?' },
    { key: 'action_readiness', label: 'Action Readiness', type: 'select', options: ['Ready to act immediately', 'Need to plan first', 'Just exploring', 'Not ready'] },
  ],
  hidden_value_audit: [
    { key: 'top3_customer_revenue_percentage', label: 'Top 3 Customers (% of Revenue)', type: 'number', placeholder: '45' },
    { key: 'knowledge_dependency_percentage', label: 'Knowledge Dependency (%)', type: 'number', placeholder: '60' },
    { key: 'succession_your_role', label: 'Succession: Your Role', type: 'select', options: ['Ready now', 'Need 1 month', 'Need 6 months', 'Nobody'] },
    { key: 'succession_sales', label: 'Succession: Sales', type: 'select', options: ['Ready now', 'Need 1 month', 'Need 6 months', 'Nobody'] },
    { key: 'succession_technical', label: 'Succession: Technical', type: 'select', options: ['Ready now', 'Need 1 month', 'Need 6 months', 'Nobody'] },
    { key: 'autonomy_finance', label: 'Autonomy: Finance', type: 'select', options: ['Runs independently', 'Needs oversight', 'Would fail'] },
    { key: 'autonomy_strategy', label: 'Autonomy: Strategy', type: 'select', options: ['Runs independently', 'Needs oversight', 'Would fail'] },
    { key: 'team_advocacy_percentage', label: 'Team Advocacy (%)', type: 'number', placeholder: '70' },
  ],
  management_accounts: [
    { key: 'revenue', label: 'Annual Revenue (£)', type: 'number', placeholder: '1000000', required: true },
    { key: 'gross_profit', label: 'Gross Profit (£)', type: 'number', placeholder: '550000' },
    { key: 'net_profit', label: 'Net Profit (£)', type: 'number', placeholder: '120000' },
    { key: 'debtor_days', label: 'Debtor Days', type: 'number', placeholder: '45' },
    { key: 'creditor_days', label: 'Creditor Days', type: 'number', placeholder: '30' },
    { key: 'current_ratio', label: 'Current Ratio', type: 'number', placeholder: '1.5' },
    { key: 'revenue_growth', label: 'Revenue Growth (%)', type: 'number', placeholder: '15' },
  ],
  discovery: [
    { key: 'business_stage', label: 'Business Stage', type: 'select', options: ['Startup', 'Growth', 'Established', 'Mature', 'Turnaround'] },
    { key: 'primary_goal', label: 'Primary Goal', type: 'textarea', placeholder: 'What is your main business goal?' },
    { key: 'biggest_challenge', label: 'Biggest Challenge', type: 'textarea', placeholder: 'What is your biggest challenge right now?' },
    { key: 'timeline', label: 'Timeline', type: 'select', options: ['Urgent (1-3 months)', 'Soon (3-6 months)', 'Planning (6-12 months)', 'Long-term (1+ years)'] },
    { key: 'budget_range', label: 'Budget Range', type: 'select', options: ['Under £5k', '£5k-£15k', '£15k-£50k', '£50k+', 'Not sure'] },
  ],
};

export function TestClientPanel({
  practiceId,
  serviceLineCode,
  serviceLineName,
  onTestClientCreated,
  onTestClientReset
}: TestClientPanelProps) {
  const [testClient, setTestClient] = useState<TestClient | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [filling, setFilling] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [assessmentData, setAssessmentData] = useState<Record<string, string | number>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Get assessment template for this service line
  const assessmentFields = ASSESSMENT_TEMPLATES[serviceLineCode] || ASSESSMENT_TEMPLATES.discovery;
  
  // Create test client
  const handleCreateTestClient = async () => {
    setCreating(true);
    setMessage(null);
    
    try {
      // Create a test client
      const testClientData = {
        name: `Test Client - ${serviceLineName}`,
        email: `test-${serviceLineCode}-${Date.now()}@test.torsor.local`,
        company: `Test Company (${serviceLineName})`,
        is_test_client: true,
        created_at: new Date().toISOString()
      };
      
      // Insert into clients table (or practice_members with client type)
      const { data: newClient, error: clientError } = await supabase
        .from('practice_members')
        .insert({
          practice_id: practiceId,
          name: testClientData.name,
          email: testClientData.email,
          client_company: testClientData.company,  // Note: column is client_company not company
          member_type: 'client',
          status: 'active',
          is_test_client: true
        })
        .select()
        .single();
      
      if (clientError) throw clientError;
      
      setTestClient({
        id: newClient.id,
        name: newClient.name,
        email: newClient.email,
        company: newClient.client_company,  // Map from client_company
        created_at: newClient.created_at
      });
      
      setMessage({ type: 'success', text: 'Test client created successfully!' });
      
      if (onTestClientCreated) {
        onTestClientCreated(newClient.id);
      }
    } catch (error: any) {
      console.error('Error creating test client:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create test client' });
    } finally {
      setCreating(false);
    }
  };
  
  // Reset test client data
  const handleResetTestClient = async () => {
    if (!testClient) return;
    
    setResetting(true);
    setMessage(null);
    
    try {
      // Call the database function to reset test data
      const { data, error } = await supabase.rpc('reset_test_client_data', {
        p_client_id: testClient.id
      });
      
      if (error) throw error;
      
      setMessage({ 
        type: 'success', 
        text: `Test data reset! Deleted ${data?.total || 0} engagement(s).` 
      });
      
      // Reset local state
      setAssessmentData({});
      setShowAssessmentForm(false);
      
      if (onTestClientReset) {
        onTestClientReset();
      }
    } catch (error: any) {
      console.error('Error resetting test client:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to reset test client' });
    } finally {
      setResetting(false);
    }
  };
  
  // Submit assessment data
  const handleSubmitAssessment = async () => {
    if (!testClient) return;
    
    setFilling(true);
    setMessage(null);
    
    try {
      // Create engagement for this service line
      const engagementTable = getEngagementTable(serviceLineCode);
      const assessmentTable = getAssessmentTable(serviceLineCode);
      
      if (!engagementTable) {
        throw new Error(`Unknown service line: ${serviceLineCode}`);
      }
      
      // Create engagement
      const { data: engagement, error: engError } = await supabase
        .from(engagementTable)
        .insert({
          client_id: testClient.id,
          practice_id: practiceId,
          status: 'pending_assessment',
          is_test: true
        })
        .select()
        .single();
      
      if (engError) throw engError;
      
      // Create assessment response
      if (assessmentTable) {
        const { error: assError } = await supabase
          .from(assessmentTable)
          .insert({
            engagement_id: engagement.id,
            responses: assessmentData,
            status: 'completed',
            completed_at: new Date().toISOString()
          });
        
        if (assError) throw assError;
      }
      
      // Update engagement status
      await supabase
        .from(engagementTable)
        .update({ status: 'assessment_complete' })
        .eq('id', engagement.id);
      
      setMessage({ type: 'success', text: 'Assessment submitted successfully! Ready to run analysis.' });
      setShowAssessmentForm(false);
      
      // Update test client status
      setTestClient(prev => prev ? {
        ...prev,
        engagement_status: 'assessment_complete',
        has_assessment: true
      } : null);
      
    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to submit assessment' });
    } finally {
      setFilling(false);
    }
  };
  
  const handleFieldChange = (key: string, value: string | number) => {
    setAssessmentData(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-dashed border-purple-300 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-purple-900">Test Mode</h3>
          <p className="text-sm text-purple-600">
            Create a test client to demo the {serviceLineName} workflow
          </p>
        </div>
      </div>
      
      {/* Messages */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
        </div>
      )}
      
      {!testClient ? (
        // No test client - show create button
        <button
          onClick={handleCreateTestClient}
          disabled={creating}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Test Client...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Create Test Client
            </>
          )}
        </button>
      ) : (
        // Test client exists - show options
        <div className="space-y-4">
          {/* Test Client Info */}
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{testClient.name}</p>
                  <p className="text-sm text-slate-500">{testClient.email}</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                TEST
              </span>
            </div>
            
            {/* Status indicators */}
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className={`flex items-center gap-1 ${testClient.has_assessment ? 'text-emerald-600' : 'text-slate-400'}`}>
                <ClipboardList className="w-4 h-4" />
                {testClient.has_assessment ? 'Assessment Complete' : 'No Assessment'}
              </span>
              <span className={`flex items-center gap-1 ${testClient.has_report ? 'text-emerald-600' : 'text-slate-400'}`}>
                <FileText className="w-4 h-4" />
                {testClient.has_report ? 'Report Generated' : 'No Report'}
              </span>
            </div>
          </div>
          
          {/* Assessment Form */}
          <div className="bg-white rounded-lg border border-purple-200 overflow-hidden">
            <button
              onClick={() => setShowAssessmentForm(!showAssessmentForm)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-50"
            >
              <span className="font-medium text-slate-700 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Fill Assessment
              </span>
              {showAssessmentForm ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {showAssessmentForm && (
              <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
                {assessmentFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.type === 'select' ? (
                      <select
                        value={assessmentData[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select...</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={assessmentData[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={assessmentData[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    )}
                  </div>
                ))}
                
                <button
                  onClick={handleSubmitAssessment}
                  disabled={filling}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {filling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Submit Assessment
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleResetTestClient}
              disabled={resetting}
              className="flex-1 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {resetting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Reset Test Data
                </>
              )}
            </button>
            <button
              onClick={() => setTestClient(null)}
              className="flex-1 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove Test Client
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions to get table names for each service line
function getEngagementTable(serviceLineCode: string): string | null {
  const mapping: Record<string, string> = {
    benchmarking: 'bm_engagements',
    hidden_value_audit: 'hva_engagements',
    management_accounts: 'ma_engagements',
    discovery: 'discovery_engagements',
    systems_audit: 'sa_engagements',
    '365_method': 'goal_engagements',
    fractional_cfo: 'fcfo_engagements'
  };
  return mapping[serviceLineCode] || null;
}

function getAssessmentTable(serviceLineCode: string): string | null {
  const mapping: Record<string, string> = {
    benchmarking: 'bm_assessment_responses',
    hidden_value_audit: 'hva_assessment_responses',
    management_accounts: 'ma_assessment_responses',
    discovery: 'discovery_assessment_responses',
    systems_audit: 'sa_assessment_responses'
  };
  return mapping[serviceLineCode] || null;
}

