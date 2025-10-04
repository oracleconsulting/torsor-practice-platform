import { useState } from 'react';
import { 
  DocumentIcon, 
  ArrowUpTrayIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  version: number;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
  tags: string[];
  status: 'draft' | 'review' | 'final';
}

interface DocumentVersionControlProps {
  documents: DocumentItem[];
  clientId: string;
  clientName: string;
  onUpdate: () => void;
}

const DocumentVersionControl = ({ documents }: DocumentVersionControlProps) => {
  const [filter, setFilter] = useState<'all' | 'draft' | 'review' | 'final'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'final':
        return <Badge className="bg-green-100 text-green-800">Final</Badge>;
      case 'review':
        return <Badge className="bg-amber-100 text-amber-800">Review</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
    }
  };

  const filteredDocuments = documents.filter(d => {
    const matchesFilter = filter === 'all' || d.status === filter;
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Document Version Control</h2>
        <Button>
          <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'draft' ? 'default' : 'outline'}
            onClick={() => setFilter('draft')}
          >
            Draft
          </Button>
          <Button
            variant={filter === 'review' ? 'default' : 'outline'}
            onClick={() => setFilter('review')}
          >
            Review
          </Button>
          <Button
            variant={filter === 'final' ? 'default' : 'outline'}
            onClick={() => setFilter('final')}
          >
            Final
          </Button>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents found</p>
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <DocumentIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{doc.name}</h3>
                        {getStatusBadge(doc.status)}
                        <Badge variant="outline">v{doc.version}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span>{doc.type}</span>
                        <span>{formatFileSize(doc.size)}</span>
                        <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        <span>by {doc.uploadedBy}</span>
                      </div>
                      {doc.tags.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {doc.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentVersionControl;

