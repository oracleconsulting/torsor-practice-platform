import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  FileText, 
  Calendar, 
  User, 
  Tag,
  Download,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Star,
  Hash,
  Image,
  File,
  FileImage,
  FileText as FileTextIcon,
  FileSpreadsheet,
  FileArchive
} from 'lucide-react';
import { PortalDocument } from '../../types/clientPortal';
import { clientPortalApi } from '../../services/clientPortalApi';

interface SearchResult {
  document: PortalDocument;
  relevance: number;
  highlights: string[];
  matchedTerms: string[];
  context: string;
}

interface SearchFilters {
  dateFrom?: string;
  dateTo?: string;
  categories: string[];
  fileTypes: string[];
  uploadedBy: string[];
  tags: string[];
  sizeMin?: number;
  sizeMax?: number;
}

interface AdvancedSearchProps {
  portalId: string;
  onResultSelect: (document: PortalDocument) => void;
  onClose: () => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  portalId,
  onResultSelect,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    fileTypes: [],
    uploadedBy: [],
    tags: []
  });
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCategories();
    loadSearchHistory();
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      generateSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const loadCategories = async () => {
    try {
      const categoryList = await clientPortalApi.getCategories(portalId);
      setCategories(categoryList.map(cat => ({ id: cat.id, name: cat.name })));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadSearchHistory = () => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  };

  const saveSearchHistory = (searchTerm: string) => {
    const updatedHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 10);
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  const generateSuggestions = () => {
    // In a real implementation, this would call an API for search suggestions
    const mockSuggestions = [
      'financial report',
      'quarterly analysis',
      'budget planning',
      'risk assessment',
      'compliance document'
    ].filter(suggestion => 
      suggestion.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(mockSuggestions);
  };

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const results = await clientPortalApi.searchDocumentsOCR(portalId, query, {
        includeOCR: true,
        searchInContent: true,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      });

      const searchResults: SearchResult[] = results.documents.map((doc, index) => ({
        document: doc,
        relevance: Math.max(0.1, 1 - (index * 0.1)), // Mock relevance score
        highlights: results.highlights[doc.id] || [],
        matchedTerms: query.toLowerCase().split(' '),
        context: `Found in ${doc.name} - ${doc.description || 'No description available'}`
      }));

      setSearchResults(searchResults);
      saveSearchHistory(query);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      fileTypes: [],
      uploadedBy: [],
      tags: []
    });
  };

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="w-4 h-4" />;
    if (mimeType.includes('pdf')) return <FileTextIcon className="w-4 h-4" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-4 h-4" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileArchive className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const highlightText = (text: string, terms: string[]) => {
    let highlightedText = text;
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
    });
    return highlightedText;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Search className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Advanced Search</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Search Panel */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Search Input */}
            <div className="p-6 border-b border-gray-200">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search documents, content, or OCR text..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search Suggestions */}
                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-gray-50 rounded-lg p-2"
                    >
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setQuery(suggestion);
                            setSuggestions([]);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Filters */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                  >
                    <Filter className="w-4 h-4" />
                    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      {/* Date Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={filters.dateFrom || ''}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="date"
                            value={filters.dateTo || ''}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      {/* Categories */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {categories.map((category) => (
                            <label key={category.id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={filters.categories.includes(category.id)}
                                onChange={(e) => {
                                  const newCategories = e.target.checked
                                    ? [...filters.categories, category.id]
                                    : filters.categories.filter(c => c !== category.id);
                                  handleFilterChange('categories', newCategories);
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* File Types */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">File Types</label>
                        <div className="space-y-2">
                          {['PDF', 'DOC', 'XLS', 'JPG', 'PNG'].map((type) => (
                            <label key={type} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={filters.fileTypes.includes(type)}
                                onChange={(e) => {
                                  const newTypes = e.target.checked
                                    ? [...filters.fileTypes, type]
                                    : filters.fileTypes.filter(t => t !== type);
                                  handleFilterChange('fileTypes', newTypes);
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={clearFilters}
                        className="w-full text-sm text-gray-600 hover:text-gray-900 underline"
                      >
                        Clear all filters
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Search History */}
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Searches</h3>
              <div className="space-y-1">
                {searchHistory.slice(0, 5).map((term, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(term)}
                    className="block w-full text-left text-sm text-gray-600 hover:text-gray-900 py-1"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Search Results ({searchResults.length})
                </h3>
                {searchResults.length > 0 && (
                  <div className="text-sm text-gray-500">
                    Showing {searchResults.length} results
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Searching documents...</p>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="p-6 space-y-4">
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={result.document.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedResult?.document.id === result.document.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedResult(result)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {getFileTypeIcon(result.document.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-medium text-gray-900 truncate">
                              {result.document.name}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {Math.round(result.relevance * 100)}% match
                              </span>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onResultSelect(result.document);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="View document"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    clientPortalApi.downloadDocument(portalId, result.document.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-green-600"
                                  title="Download document"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            {result.document.description || 'No description available'}
                          </p>

                          {/* Highlights */}
                          {result.highlights.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500 mb-1">Found in content:</p>
                              <div className="space-y-1">
                                {result.highlights.slice(0, 2).map((highlight, idx) => (
                                  <p
                                    key={idx}
                                    className="text-sm text-gray-700 bg-yellow-50 p-2 rounded"
                                    dangerouslySetInnerHTML={{
                                      __html: highlightText(highlight, result.matchedTerms)
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(result.document.uploadedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{result.document.uploadedBy}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Hash className="w-3 h-3" />
                              <span>{formatFileSize(result.document.fileSize)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : query && !loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No results found for "{query}"</p>
                    <p className="text-sm text-gray-400 mt-2">Try adjusting your search terms or filters</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Enter a search term to find documents</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 