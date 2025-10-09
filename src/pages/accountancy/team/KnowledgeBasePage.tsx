import React, { useState, useEffect } from 'react';
import { 
  BookOpen, FileText, Search, Plus, Tag, Clock, Eye, Loader2, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { 
  getKnowledgeDocuments, 
  createKnowledgeDocument,
  getCPDActivities,
  type KnowledgeDocument, 
  type CPDActivity 
} from '@/lib/api/cpd';
import { formatDate } from '@/lib/utils';

interface KnowledgeDocumentForm {
  title: string;
  summary: string;
  document_type: 'cpd_summary' | 'case_study' | 'guide' | 'template' | 'notes' | 'other';
  tags: string[];
  skill_categories: string[];
  cpd_activity_id?: string;
  is_public: boolean;
}

const KnowledgeBasePage: React.FC = () => {
  const accountancyContext = useAccountancyContext();
  const practice = accountancyContext?.practice;
  const practiceMember = accountancyContext?.practiceMember;

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [cpdActivities, setCpdActivities] = useState<CPDActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const [newDocument, setNewDocument] = useState<KnowledgeDocumentForm>({
    title: '',
    summary: '',
    document_type: 'cpd_summary',
    tags: [],
    skill_categories: [],
    is_public: true
  });

  const skillCategories = [
    'technical-accounting-audit',
    'taxation-advisory',
    'regulatory-compliance',
    'business-strategy-advisory',
    'digital-technology',
    'client-management',
    'leadership-people-management',
    'professional-ethics'
  ];

  useEffect(() => {
    async function loadData() {
      if (!practice?.id || !practiceMember?.id) return;

      try {
        setLoading(true);
        setError(null);

        const [docsData, activitiesData] = await Promise.all([
          getKnowledgeDocuments(practice.id),
          getCPDActivities(practice.id)
        ]);

        setDocuments(docsData);
        setCpdActivities(activitiesData);
      } catch (err) {
        console.error('Error loading knowledge base:', err);
        setError('Failed to load knowledge base. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [practice?.id, practiceMember?.id]);

  const handleSubmit = async () => {
    if (!newDocument.title || !newDocument.summary || !practiceMember?.id) {
      return;
    }

    try {
      const doc = await createKnowledgeDocument({
        ...newDocument,
        uploaded_by: practiceMember.id
      });

      setDocuments([doc, ...documents]);
      setNewDocument({
        title: '',
        summary: '',
        document_type: 'cpd_summary',
        tags: [],
        skill_categories: [],
        is_public: true
      });
      setShowUploadDialog(false);
    } catch (err) {
      console.error('Error creating document:', err);
      setError('Failed to upload document. Please try again.');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === '' || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesType = selectedType === 'all' || doc.document_type === selectedType;
    const matchesCategory = selectedCategory === 'all' || 
      (doc.skill_categories && doc.skill_categories.includes(selectedCategory));

    return matchesSearch && matchesType && matchesCategory;
  });

  // Group documents by type
  const documentsByType = filteredDocuments.reduce((acc, doc) => {
    const type = doc.document_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, KnowledgeDocument[]>);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cpd_summary': return FileText;
      case 'guide': return BookOpen;
      case 'case_study': return FileText;
      case 'template': return FileText;
      case 'notes': return FileText;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cpd_summary': return 'text-blue-500';
      case 'guide': return 'text-green-500';
      case 'case_study': return 'text-purple-500';
      case 'template': return 'text-orange-500';
      case 'notes': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <Button onClick={() => setShowUploadDialog(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </div>
        <p className="text-gray-400">
          Team knowledge, CPD summaries, and learning resources
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="cpd_summary">CPD Summary</SelectItem>
            <SelectItem value="case_study">Case Study</SelectItem>
            <SelectItem value="guide">Guide</SelectItem>
            <SelectItem value="template">Template</SelectItem>
            <SelectItem value="notes">Notes</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {skillCategories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-gray-400 mt-2">in knowledge base</p>
          </CardContent>
        </Card>

        <Card className="border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPD Summaries</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.document_type === 'cpd_summary').length}
            </div>
            <p className="text-xs text-gray-400 mt-2">learning documents</p>
          </CardContent>
        </Card>

        <Card className="border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.reduce((sum, d) => sum + d.download_count, 0)}
            </div>
            <p className="text-xs text-gray-400 mt-2">document views</p>
          </CardContent>
        </Card>

        <Card className="border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(documents.flatMap(d => d.skill_categories || [])).size}
            </div>
            <p className="text-xs text-gray-400 mt-2">skill areas</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card className="border-gray-700">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No documents found</p>
            <p className="text-sm text-gray-500">
              {documents.length === 0 
                ? 'Add your first knowledge document to get started'
                : 'Try adjusting your search or filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(documentsByType).map(([type, docs]) => {
            const Icon = getTypeIcon(type);
            const color = getTypeColor(type);

            return (
              <div key={type}>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${color}`} />
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  <Badge variant="secondary">{docs.length}</Badge>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docs.map(doc => (
                    <Card key={doc.id} className="border-gray-700 hover:border-gray-600 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${color}`} />
                          {doc.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">{doc.summary}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Tags */}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {doc.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{doc.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(new Date(doc.created_at))}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {doc.download_count} views
                          </span>
                        </div>

                        {/* Author */}
                        <p className="text-xs text-gray-500">
                          By {doc.uploader?.name || 'Unknown'}
                        </p>

                        {/* Linked CPD Activity */}
                        {doc.cpd_activity_id && (
                          <Badge variant="secondary" className="text-xs">
                            Linked to CPD Activity
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Knowledge Document</DialogTitle>
            <DialogDescription>
              Share your learning or knowledge with the team
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={newDocument.title}
                onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                placeholder="e.g., ACCA Tax Update Summary"
              />
            </div>

            <div>
              <Label>Summary *</Label>
              <Textarea
                value={newDocument.summary}
                onChange={(e) => setNewDocument({...newDocument, summary: e.target.value})}
                placeholder="Describe the key points and takeaways..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Document Type</Label>
                <Select 
                  value={newDocument.document_type} 
                  onValueChange={(value) => setNewDocument({...newDocument, document_type: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpd_summary">CPD Summary</SelectItem>
                    <SelectItem value="case_study">Case Study</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="notes">Notes</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Link to CPD Activity (Optional)</Label>
                <Select 
                  value={newDocument.cpd_activity_id || 'none'} 
                  onValueChange={(value) => setNewDocument({...newDocument, cpd_activity_id: value === 'none' ? undefined : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select CPD activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {cpdActivities.slice(0, 20).map(activity => (
                      <SelectItem key={activity.id} value={activity.id}>
                        {activity.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="e.g., tax, MTD, updates"
                onChange={(e) => setNewDocument({
                  ...newDocument, 
                  tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                })}
              />
            </div>

            <div>
              <Label>Skill Categories</Label>
              <Select 
                value={newDocument.skill_categories[0] || 'none'}
                onValueChange={(value) => setNewDocument({
                  ...newDocument, 
                  skill_categories: value === 'none' ? [] : [value]
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {skillCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newDocument.is_public}
                onChange={(e) => setNewDocument({...newDocument, is_public: e.target.checked})}
                className="rounded"
              />
              <Label className="mb-0">Make visible to all team members</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!newDocument.title || !newDocument.summary}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Add Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBasePage;
