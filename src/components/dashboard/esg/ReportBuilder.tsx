import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye, FileText, TrendingUp, BarChart3 } from 'lucide-react';
import { ESGClient, ESGReport } from '../../../types/accountancy';
import { esgAPI } from '../../../services/accountancy/accountancyApiService';

interface ReportBuilderProps {
  clients: ESGClient[];
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({ clients }) => {
  const [selectedClient, setSelectedClient] = useState<ESGClient | null>(null);
  const [generatedReport, setGeneratedReport] = useState<ESGReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const mockReport: ESGReport = {
    id: '1',
    clientName: 'TechStart Ltd',
    period: '2024',
    status: 'draft',
    scores: {
      environmental: 78,
      social: 65,
      governance: 82,
      overall: 75
    },
    carbonFootprint: {
      total: 45.2,
      intensity: 0.6,
      change: -12.5
    },
    narrative: {
      executiveSummary: 'TechStart Ltd demonstrates strong ESG performance with notable achievements in governance and environmental management. The company has reduced its carbon footprint by 12.5% year-over-year and maintains robust policies for sustainability and ethical conduct.',
      materialityAssessment: 'Key material topics include carbon emissions, data privacy, and diversity & inclusion. These areas have been identified through stakeholder engagement and industry benchmarking.',
      performanceAnalysis: 'Environmental performance is strong with significant carbon reduction initiatives. Social metrics show room for improvement in gender diversity and pay equity. Governance practices are excellent with comprehensive policies and oversight.',
      targetsAndActions: 'Targets for 2025 include achieving carbon neutrality, increasing female representation in leadership to 40%, and implementing enhanced data privacy measures.'
    }
  };

  const generateReport = async (client: ESGClient) => {
    setIsGenerating(true);
    try {
      // Mock API call - in real implementation, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGeneratedReport(mockReport);
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!generatedReport) return;
    
    try {
      // Mock PDF generation - in real implementation, this would use jsPDF
      console.log('Generating PDF for:', generatedReport.clientName);
      // const doc = new jsPDF();
      // ... PDF generation logic
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  const ESGScoreRing: React.FC<{ score: number; category: string; color: string }> = ({ score, category, color }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    return (
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            className="text-gray-700"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${color} transition-all duration-1000`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{score}</span>
          <span className="text-xs text-gray-400 capitalize">{category}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">ESG Report Builder</h3>
        <div className="text-sm text-gray-400">
          {clients.filter(c => c.report).length} reports generated
        </div>
      </div>

      {/* Client Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <motion.div
            key={client.id}
            whileHover={{ scale: 1.02 }}
            className={`bg-gray-800/50 border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedClient?.id === client.id 
                ? 'border-green-500' 
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => setSelectedClient(client)}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white">{client.name}</h4>
              {client.report && (
                <FileText className="w-4 h-4 text-green-400" />
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-white capitalize">{client.status.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Revenue:</span>
                <span className="text-green-400">£{client.revenue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Deadline:</span>
                <span className="text-white">{new Date(client.deadline).toLocaleDateString()}</span>
              </div>
            </div>

            {!client.report && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  generateReport(client);
                }}
                disabled={isGenerating}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Generated Report Display */}
      {generatedReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-white">
              ESG Report - {generatedReport.clientName}
            </h4>
            <div className="flex gap-2">
              <button
                onClick={downloadPDF}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </button>
              <button className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>
            </div>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <ESGScoreRing 
                score={generatedReport.scores.environmental} 
                category="environmental" 
                color="text-green-400" 
              />
            </div>
            <div className="text-center">
              <ESGScoreRing 
                score={generatedReport.scores.social} 
                category="social" 
                color="text-blue-400" 
              />
            </div>
            <div className="text-center">
              <ESGScoreRing 
                score={generatedReport.scores.governance} 
                category="governance" 
                color="text-purple-400" 
              />
            </div>
            <div className="text-center">
              <ESGScoreRing 
                score={generatedReport.scores.overall} 
                category="overall" 
                color="text-yellow-400" 
              />
            </div>
          </div>

          {/* Carbon Footprint */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
            <h5 className="text-green-400 font-semibold mb-3">Carbon Footprint</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {generatedReport.carbonFootprint.total} tCO2e
                </div>
                <div className="text-sm text-gray-400">Total Emissions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {generatedReport.carbonFootprint.intensity} tCO2e/employee
                </div>
                <div className="text-sm text-gray-400">Carbon Intensity</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${generatedReport.carbonFootprint.change > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {generatedReport.carbonFootprint.change > 0 ? '+' : ''}{generatedReport.carbonFootprint.change}%
                </div>
                <div className="text-sm text-gray-400">Year-over-Year Change</div>
              </div>
            </div>
          </div>

          {/* Narrative Sections */}
          <div className="space-y-4">
            <div>
              <h5 className="text-white font-semibold mb-2">Executive Summary</h5>
              <p className="text-gray-300 text-sm leading-relaxed">
                {generatedReport.narrative.executiveSummary}
              </p>
            </div>
            
            <div>
              <h5 className="text-white font-semibold mb-2">Materiality Assessment</h5>
              <p className="text-gray-300 text-sm leading-relaxed">
                {generatedReport.narrative.materialityAssessment}
              </p>
            </div>
            
            <div>
              <h5 className="text-white font-semibold mb-2">Performance Analysis</h5>
              <p className="text-gray-300 text-sm leading-relaxed">
                {generatedReport.narrative.performanceAnalysis}
              </p>
            </div>
            
            <div>
              <h5 className="text-white font-semibold mb-2">Targets and Actions</h5>
              <p className="text-gray-300 text-sm leading-relaxed">
                {generatedReport.narrative.targetsAndActions}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Report Templates */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-bold text-white mb-4">Report Templates</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h5 className="text-blue-400 font-semibold mb-2">UK SDS Template</h5>
            <p className="text-gray-300 text-sm mb-3">
              Full compliance with UK Sustainability Disclosure Standards
            </p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
              Use Template
            </button>
          </div>
          
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h5 className="text-green-400 font-semibold mb-2">Simplified Template</h5>
            <p className="text-gray-300 text-sm mb-3">
              Streamlined template for voluntary reporting
            </p>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors">
              Use Template
            </button>
          </div>
          
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h5 className="text-purple-400 font-semibold mb-2">Custom Template</h5>
            <p className="text-gray-300 text-sm mb-3">
              Build your own custom ESG report template
            </p>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors">
              Create Custom
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 