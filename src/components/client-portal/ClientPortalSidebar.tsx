import React from 'react';
import { 
  FileText, 
  FolderOpen, 
  Activity, 
  Settings,
  ChevronRight,
  CheckCircle,
  Clock
} from 'lucide-react';
import { DocumentCategory, PortalDocument } from '../../types/clientPortal';

interface ClientPortalSidebarProps {
  activeTab: 'documents' | 'categories' | 'activity' | 'settings';
  onTabChange: (tab: 'documents' | 'categories' | 'activity' | 'settings') => void;
  categories: DocumentCategory[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  documents: PortalDocument[]; // Add this prop to get real document counts
}

export const ClientPortalSidebar: React.FC<ClientPortalSidebarProps> = ({
  activeTab,
  onTabChange,
  categories,
  selectedCategory,
  onCategoryChange,
  documents = [] // Default to empty array if not provided
}) => {
  const getCategoryIcon = (type: DocumentCategory['type']) => {
    switch (type) {
      case 'financial':
        return <FileText className="w-4 h-4 text-green-600" />;
      case 'legal':
        return <FileText className="w-4 h-4 text-yellow-600" />;
      case 'operational':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'compliance':
        return <FileText className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get real document count for a category
  const getCategoryStats = (categoryId: string) => {
    if (!documents || !Array.isArray(documents)) return 0;
    return documents.filter(doc => doc.category === categoryId).length;
  };

  // Calculate total documents (with safety check)
  const totalDocuments = documents?.length || 0;
  const verifiedDocuments = documents?.filter(doc => doc.verified).length || 0;
  const pendingDocuments = documents?.filter(doc => !doc.verified).length || 0;

  const navItems = [
    {
      id: 'documents' as const,
      label: 'Documents',
      icon: <FileText className="w-5 h-5" />,
      count: totalDocuments
    },
    {
      id: 'categories' as const,
      label: 'Categories',
      icon: <FolderOpen className="w-5 h-5" />,
      count: categories.length
    },
    {
      id: 'activity' as const,
      label: 'Activity',
      icon: <Activity className="w-5 h-5" />,
      count: 0 // This could come from an activity API
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      count: 0
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Navigation */}
      <div className="p-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </div>
              {item.count > 0 && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Category Filter (only show when documents tab is active) */}
      {activeTab === 'documents' && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Filter by Category</h3>
          
          {/* All Documents */}
          <button
            onClick={() => onCategoryChange('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2 text-gray-600" />
              All Documents
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Category List */}
          <div className="mt-2 space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className="mr-2">
                    {getCategoryIcon(category.type)}
                  </div>
                  <span className="truncate">{category.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getCategoryStats(category.id)}
                  </span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-auto border-t border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Documents</span>
            <span className="font-medium text-gray-900">{totalDocuments}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Verified</span>
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              <span className="font-medium">{verifiedDocuments}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Pending</span>
            <div className="flex items-center text-yellow-600">
              <Clock className="w-3 h-3 mr-1" />
              <span className="font-medium">{pendingDocuments}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};