import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Tag, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Settings,
  TrendingUp,
  FileText,
  Folder,
  Zap,
  Lightbulb,
  Target,
  BarChart3
} from 'lucide-react';
import { PortalDocument, DocumentCategory } from '../types/clientPortal';
import { clientPortalApi } from '../services/clientPortalApi';

interface CategorizationResult {
  documentId: string;
  suggestedCategory: string;
  confidence: number;
  alternatives: Array<{
    categoryId: string;
    categoryName: string;
    confidence: number;
  }>;
  features: string[];
  reasoning: string;
}

interface CategoryStats {
  categoryId: string;
  categoryName: string;
  totalDocuments: number;
  accuracy: number;
  lastUpdated: string;
  autoCategorized: number;
  manuallyCorrected: number;
  learningRate: number;
}

interface AutomatedCategorizationProps {
  portalId: string;
  documents: PortalDocument[];
  categories: DocumentCategory[];
  onCategoryUpdate: (documentId: string, categoryId: string) => void;
  onClose: () => void;
}

export const AutomatedCategorization: React.FC<AutomatedCategorizationProps> = ({
  portalId,
  documents,
  categories,
  onCategoryUpdate,
  onClose
}) => {
  const [categorizationResults, setCategorizationResults] = useState<CategorizationResult[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<PortalDocument | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [autoCategorizeEnabled, setAutoCategorizeEnabled] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.8);
  const [learningEnabled, setLearningEnabled] = useState(true);

  useEffect(() => {
    loadCategoryStats();
    if (documents.length > 0) {
      categorizeDocuments();
    }
  }, [documents]);

  const loadCategoryStats = async () => {
    // In a real implementation, this would load from the API
    const mockStats: CategoryStats[] = categories.map(category => ({
      categoryId: category.id,
      categoryName: category.name,
      totalDocuments: Math.floor(Math.random() * 100) + 10,
      accuracy: Math.random() * 0.3 + 0.7, // 70-100%
      lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      autoCategorized: Math.floor(Math.random() * 50) + 5,
      manuallyCorrected: Math.floor(Math.random() * 10) + 1,
      learningRate: Math.random() * 0.2 + 0.8 // 80-100%
    }));
    setCategoryStats(mockStats);
  };

  const categorizeDocuments = async () => {
    setLoading(true);
    try {
      const results: CategorizationResult[] = [];
      
      for (const document of documents) {
        if (processing === document.id) continue;
        
        setProcessing(document.id);
        
        try {
          const result = await clientPortalApi.categorizeDocument(portalId, document.id);
          
          results.push({
            documentId: document.id,
            suggestedCategory: result.suggestedCategory,
            confidence: result.confidence,
            alternatives: result.alternatives.map(alt => ({
              categoryId: alt.categoryId,
              categoryName: categories.find(c => c.id === alt.categoryId)?.name || 'Unknown',
              confidence: alt.confidence
            })),
            features: generateMockFeatures(document),
            reasoning: generateMockReasoning(document, result.suggestedCategory)
          });
        } catch (error) {
          console.error(`Failed to categorize document ${document.id}:`, error);
        }
      }
      
      setCategorizationResults(results);
    } catch (error) {
      console.error('Failed to categorize documents:', error);
    } finally {
      setLoading(false);
      setProcessing(null);
    }
  };

  const generateMockFeatures = (document: PortalDocument): string[] => {
    const features = [
      'financial_terms',
      'legal_language',
      'technical_specifications',
      'contract_terms',
      'report_format',
      'invoice_pattern',
      'receipt_format',
      'proposal_structure'
    ];
    
    return features.slice(0, Math.floor(Math.random() * 4) + 2);
  };

  const generateMockReasoning = (document: PortalDocument, category: string): string => {
    const reasons = [
      `Document contains financial terminology and numerical data typical of ${category}`,
      `File name and content structure match patterns commonly found in ${category}`,
      `Document format and layout are consistent with ${category} standards`,
      `Keywords and phrases detected align with ${category} classification criteria`
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  const handleAcceptCategorization = async (documentId: string, categoryId: string) => {
    try {
      await clientPortalApi.updateDocument(portalId, documentId, { categoryId });
      onCategoryUpdate(documentId, categoryId);
      
      // Update stats
      setCategoryStats(prev => prev.map(stat => 
        stat.categoryId === categoryId
          ? { ...stat, autoCategorized: stat.autoCategorized + 1 }
          : stat
      ));
    } catch (error) {
      console.error('Failed to accept categorization:', error);
    }
  };

  const handleRejectCategorization = async (documentId: string, correctCategoryId: string) => {
    try {
      await clientPortalApi.updateDocument(portalId, documentId, { categoryId: correctCategoryId });
      onCategoryUpdate(documentId, correctCategoryId);
      
      // Update stats for learning
      setCategoryStats(prev => prev.map(stat => 
        stat.categoryId === correctCategoryId
          ? { ...stat, manuallyCorrected: stat.manuallyCorrected + 1 }
          : stat
      ));
    } catch (error) {
      console.error('Failed to reject categorization:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-50';
    if (confidence >= 0.5) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return 'text-green-600';
    if (accuracy >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Automated Categorization</h2>
              <p className="text-sm text-gray-500">AI-powered document classification</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Statistics Overview */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Documents</p>
                      <p className="text-2xl font-bold text-blue-900">{documents.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Auto Categorized</p>
                      <p className="text-2xl font-bold text-green-900">
                        {categorizationResults.filter(r => r.confidence >= confidenceThreshold).length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">Needs Review</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {categorizationResults.filter(r => r.confidence < confidenceThreshold).length}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Avg Accuracy</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {categoryStats.length > 0 
                          ? Math.round(categoryStats.reduce((acc, stat) => acc + stat.accuracy, 0) / categoryStats.length * 100)
                          : 0}%
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Categorization Results */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Categorization Results</h3>
                  <button
                    onClick={categorizeDocuments}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Processing...' : 'Re-categorize'}
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
                      <p className="text-gray-500">Analyzing documents...</p>
                    </div>
                  </div>
                ) : categorizationResults.length > 0 ? (
                  <div className="space-y-4">
                    {categorizationResults.map((result) => {
                      const document = documents.find(d => d.id === result.documentId);
                      if (!document) return null;
                      
                      const suggestedCategory = categories.find(c => c.name === result.suggestedCategory);
                      const needsReview = result.confidence < confidenceThreshold;
                      
                      return (
                        <motion.div
                          key={result.documentId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-6 border rounded-lg ${
                            needsReview ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-medium text-gray-900">{document.name}</h4>
                                  <p className="text-sm text-gray-500">{document.description}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(result.confidence)}`}>
                                    {Math.round(result.confidence * 100)}% confidence
                                  </span>
                                  {needsReview && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                      Needs Review
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Suggested Category */}
                                <div>
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">Suggested Category</h5>
                                  <div className="flex items-center space-x-2">
                                    <Tag className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {result.suggestedCategory}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">{result.reasoning}</p>
                                </div>

                                {/* Alternative Categories */}
                                <div>
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">Alternative Categories</h5>
                                  <div className="space-y-1">
                                    {result.alternatives.slice(0, 3).map((alt, index) => (
                                      <div key={index} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">{alt.categoryName}</span>
                                        <span className="text-gray-500">{Math.round(alt.confidence * 100)}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Features */}
                              <div className="mt-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Detected Features</h5>
                                <div className="flex flex-wrap gap-1">
                                  {result.features.map((feature, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                                    >
                                      {feature.replace('_', ' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                                <button
                                  onClick={() => handleAcceptCategorization(result.documentId, suggestedCategory?.id || '')}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Accept
                                </button>
                                
                                <select
                                  onChange={(e) => handleRejectCategorization(result.documentId, e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  defaultValue=""
                                >
                                  <option value="" disabled>Select correct category</option>
                                  {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                      {category.name}
                                    </option>
                                  ))}
                                </select>
                                
                                <button
                                  onClick={() => setSelectedDocument(document)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No documents to categorize</p>
                      <p className="text-sm text-gray-400 mt-2">Upload documents to start automated categorization</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Performance */}
          <div className="w-96 border-l border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Category Performance</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {categoryStats.map((stat) => (
                  <div key={stat.categoryId} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{stat.categoryName}</h4>
                      <span className={`text-sm font-medium ${getAccuracyColor(stat.accuracy)}`}>
                        {Math.round(stat.accuracy * 100)}% accuracy
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Documents</span>
                        <span className="text-gray-900">{stat.totalDocuments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Auto Categorized</span>
                        <span className="text-green-600">{stat.autoCategorized}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Manually Corrected</span>
                        <span className="text-blue-600">{stat.manuallyCorrected}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Learning Rate</span>
                        <span className="text-purple-600">{Math.round(stat.learningRate * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Last updated</span>
                        <span>{new Date(stat.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Categorization Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={autoCategorizeEnabled}
                        onChange={(e) => setAutoCategorizeEnabled(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable automatic categorization</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confidence Threshold ({Math.round(confidenceThreshold * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.05"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Documents below this threshold will require manual review
                    </p>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={learningEnabled}
                        onChange={(e) => setLearningEnabled(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable learning from corrections</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                  >
                    Save Settings
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}; 