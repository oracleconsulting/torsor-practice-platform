import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Calculator, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { ESGClient, ESGData, CarbonResults } from '../../../types/accountancy';
import { esgAPI } from '../../../services/accountancy/accountancyApiService';

interface DataCollectionPortalProps {
  selectedClient: ESGClient | null;
}

type DataTab = 'environmental' | 'social' | 'governance';

export const DataCollectionPortal: React.FC<DataCollectionPortalProps> = ({ selectedClient }) => {
  const [activeTab, setActiveTab] = useState<DataTab>('environmental');
  const [formData, setFormData] = useState<ESGData>({
    emissions: {
      scope1: { naturalGas: 0, companyVehicles: 0, refrigerants: 0 },
      scope2: { electricity: 0, source: 'grid' },
      scope3: { businessTravel: 0, commuting: 0, waste: 0, water: 0 }
    },
    social: {
      totalEmployees: 0,
      femaleEmployees: 0,
      femaleManagers: 0,
      genderPayGap: 0,
      trainingHours: 0,
      turnoverRate: 0,
      accidents: 0
    },
    governance: {
      boardMembers: 0,
      independentDirectors: 0,
      sustainabilityPolicy: false,
      codeOfConduct: false,
      whistleblowingPolicy: false,
      dataBreaches: 0
    }
  });
  const [carbonResults, setCarbonResults] = useState<CarbonResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const tabs = [
    { id: 'environmental', label: 'Environmental', icon: '🌱' },
    { id: 'social', label: 'Social', icon: '👥' },
    { id: 'governance', label: 'Governance', icon: '🏛️' }
  ];

  const handleInputChange = (section: keyof ESGData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = (section: keyof ESGData, subsection: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [field]: value
        }
      }
    }));
  };

  const calculateCarbon = async () => {
    if (!selectedClient) return;
    
    setIsCalculating(true);
    try {
      const results = await esgAPI.calculateCarbon(formData.emissions);
      setCarbonResults(results);
    } catch (error) {
      console.error('Carbon calculation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const saveData = async () => {
    if (!selectedClient) return;
    
    try {
      await esgAPI.saveEmissionsData(selectedClient.id, formData);
      // Show success message
    } catch (error) {
      console.error('Save data failed:', error);
    }
  };

  const renderEnvironmentalForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <h4 className="text-green-400 font-semibold mb-4">Scope 1 Emissions</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Natural Gas (kWh)</label>
              <input
                type="number"
                value={formData.emissions.scope1.naturalGas}
                onChange={(e) => handleNestedInputChange('emissions', 'scope1', 'naturalGas', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Company Vehicles (miles)</label>
              <input
                type="number"
                value={formData.emissions.scope1.companyVehicles}
                onChange={(e) => handleNestedInputChange('emissions', 'scope1', 'companyVehicles', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Refrigerants (kg)</label>
              <input
                type="number"
                value={formData.emissions.scope1.refrigerants}
                onChange={(e) => handleNestedInputChange('emissions', 'scope1', 'refrigerants', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-4">Scope 2 Emissions</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Electricity (kWh)</label>
              <input
                type="number"
                value={formData.emissions.scope2.electricity}
                onChange={(e) => handleNestedInputChange('emissions', 'scope2', 'electricity', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Energy Source</label>
              <select
                value={formData.emissions.scope2.source}
                onChange={(e) => handleNestedInputChange('emissions', 'scope2', 'source', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="grid">Grid</option>
                <option value="renewable">Renewable</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
        <h4 className="text-purple-400 font-semibold mb-4">Scope 3 Emissions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Business Travel (miles)</label>
            <input
              type="number"
              value={formData.emissions.scope3.businessTravel}
              onChange={(e) => handleNestedInputChange('emissions', 'scope3', 'businessTravel', Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Commuting (estimated miles)</label>
            <input
              type="number"
              value={formData.emissions.scope3.commuting}
              onChange={(e) => handleNestedInputChange('emissions', 'scope3', 'commuting', Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Waste (tonnes)</label>
            <input
              type="number"
              value={formData.emissions.scope3.waste}
              onChange={(e) => handleNestedInputChange('emissions', 'scope3', 'waste', Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Water (m³)</label>
            <input
              type="number"
              value={formData.emissions.scope3.water}
              onChange={(e) => handleNestedInputChange('emissions', 'scope3', 'water', Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
        </div>
      </div>

      {carbonResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
        >
          <h4 className="text-white font-semibold mb-3">Carbon Footprint Results</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{carbonResults.scope1.toFixed(1)}</div>
              <div className="text-sm text-gray-400">Scope 1 (tCO2e)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{carbonResults.scope2.toFixed(1)}</div>
              <div className="text-sm text-gray-400">Scope 2 (tCO2e)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{carbonResults.total.toFixed(1)}</div>
              <div className="text-sm text-gray-400">Total (tCO2e)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{carbonResults.intensity.toFixed(2)}</div>
              <div className="text-sm text-gray-400">Intensity (tCO2e/employee)</div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex gap-3">
        <button
          onClick={calculateCarbon}
          disabled={isCalculating}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Calculator className="w-4 h-4 mr-2" />
          {isCalculating ? 'Calculating...' : 'Calculate Carbon'}
        </button>
        <button
          onClick={saveData}
          className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Data
        </button>
      </div>
    </div>
  );

  const renderSocialForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-4">Workforce Metrics</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Total Employees</label>
              <input
                type="number"
                value={formData.social.totalEmployees}
                onChange={(e) => handleInputChange('social', 'totalEmployees', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Female Employees</label>
              <input
                type="number"
                value={formData.social.femaleEmployees}
                onChange={(e) => handleInputChange('social', 'femaleEmployees', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Female Managers</label>
              <input
                type="number"
                value={formData.social.femaleManagers}
                onChange={(e) => handleInputChange('social', 'femaleManagers', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <h4 className="text-purple-400 font-semibold mb-4">Performance Metrics</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Gender Pay Gap (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.social.genderPayGap}
                onChange={(e) => handleInputChange('social', 'genderPayGap', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Training Hours per Employee</label>
              <input
                type="number"
                value={formData.social.trainingHours}
                onChange={(e) => handleInputChange('social', 'trainingHours', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Turnover Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.social.turnoverRate}
                onChange={(e) => handleInputChange('social', 'turnoverRate', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Workplace Accidents</label>
              <input
                type="number"
                value={formData.social.accidents}
                onChange={(e) => handleInputChange('social', 'accidents', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGovernanceForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <h4 className="text-purple-400 font-semibold mb-4">Board Structure</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Board Members</label>
              <input
                type="number"
                value={formData.governance.boardMembers}
                onChange={(e) => handleInputChange('governance', 'boardMembers', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Independent Directors</label>
              <input
                type="number"
                value={formData.governance.independentDirectors}
                onChange={(e) => handleInputChange('governance', 'independentDirectors', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <h4 className="text-green-400 font-semibold mb-4">Policies & Compliance</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.governance.sustainabilityPolicy}
                onChange={(e) => handleInputChange('governance', 'sustainabilityPolicy', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-300">Sustainability Policy</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.governance.codeOfConduct}
                onChange={(e) => handleInputChange('governance', 'codeOfConduct', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-300">Code of Conduct</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.governance.whistleblowingPolicy}
                onChange={(e) => handleInputChange('governance', 'whistleblowingPolicy', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-300">Whistleblowing Policy</span>
            </label>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Data Breaches (last year)</label>
              <input
                type="number"
                value={formData.governance.dataBreaches}
                onChange={(e) => handleInputChange('governance', 'dataBreaches', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!selectedClient) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">No Client Selected</h3>
        <p className="text-gray-500">Please select a client from the scoping tab to collect ESG data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Data Collection Portal</h3>
          <p className="text-gray-400">Collecting ESG data for {selectedClient.name}</p>
        </div>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DataTab)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'environmental' && renderEnvironmentalForm()}
      {activeTab === 'social' && renderSocialForm()}
      {activeTab === 'governance' && renderGovernanceForm()}
    </div>
  );
}; 