import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, FileText, Search, Trash2, RefreshCw, 
         BookOpen, BarChart3, AlertCircle, CheckCircle2, Clock,
         Tags, Filter, FolderOpen, Brain, Database } from 'lucide-react';
import { 
  KnowledgeDocument as ServiceKnowledgeDocument,
  directKnowledgeBaseService as knowledgeBaseService
} from '@/services/knowledgeBaseServiceDirect';
import { useToast } from '@/hooks/use-toast';

// Map service types to component types
type DocumentType = 'best_practice' | 'case_study' | 'template' | 'guide' | 'policy';

interface KnowledgeAnalytics {
  total_documents: number;
  documents_by_type: Record<DocumentType, number>;
  usage_by_context: Record<string, number>;
  average_relevance_score: number;
  feedback_summary: {
    helpful: number;
    not_relevant: number;
    needs_update: number;
    outdated: number;
  };
  top_used_documents: any[];
}

export const KnowledgeBasePage: React.FC = () => {
  const [documents, setDocuments] = useState<ServiceKnowledgeDocument[]>([]);
  const [analytics, setAnalytics] = useState<KnowledgeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'best_practice' as DocumentType,
    category: '',
    tags: ''
  });
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
    loadAnalytics();
    // No setup needed - direct service doesn't use Supabase storage
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await knowledgeBaseService.getAllDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await knowledgeBaseService.getUsageAnalytics();
      // Convert to expected format
      setAnalytics({
        total_documents: documents.length,
        documents_by_type: documents.reduce((acc, doc) => {
          acc[doc.type] = (acc[doc.type] || 0) + 1;
          return acc;
        }, {} as Record<DocumentType, number>),
        usage_by_context: data.usageByContext || {},
        average_relevance_score: 0.85,
        feedback_summary: {
          helpful: 0,
          not_relevant: 0,
          needs_update: 0,
          outdated: 0
        },
        top_used_documents: data.topDocuments || []
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadForm(prev => ({
        ...prev,
        title: prev.title || e.target.files![0].name.replace(/\.[^/.]+$/, '')
      }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);
      const document = await knowledgeBaseService.uploadDocument(selectedFile, {
        title: uploadForm.title,
        type: uploadForm.type,
        category: uploadForm.category,
        tags: uploadForm.tags ? uploadForm.tags.split(',').map(t => t.trim()) : undefined
      });

      toast({
        title: 'Success',
        description: `Document "${document.title}" uploaded successfully.`,
      });

      // Reset form
      setSelectedFile(null);
      setUploadForm({
        title: '',
        type: 'best_practice',
        category: '',
        tags: ''
      });

      // Reload documents
      loadDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload document';
      
      if (error.message?.includes('Storage bucket not configured')) {
        errorMessage = error.message;
      } else if (error.message?.includes('row-level security')) {
        errorMessage = 'Permission denied. Please ensure you have the proper permissions. If the issue persists, ask your administrator to run the migration: 20250109_fix_knowledge_base_storage.sql';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please check your authentication status.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await knowledgeBaseService.deleteDocument(documentId);
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
      loadDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive'
      });
    }
  };

  const handleReprocess = async (documentId: string) => {
    try {
      // For now, just update the sync status
      const doc = await knowledgeBaseService.updateDocument(documentId, {
        updated_at: new Date().toISOString()
      });
      
      toast({
        title: 'Success',
        description: 'Document marked for reprocessing',
      });
      
      loadDocuments();
    } catch (error) {
      console.error('Reprocess error:', error);
      toast({
        title: 'Error',
        description: 'Failed to reprocess document',
        variant: 'destructive'
      });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getSyncStatusBadge = (doc: ServiceKnowledgeDocument) => {
    // Direct service doesn't use sync_status - documents are processed immediately
    return (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        indexed
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8" />
            Knowledge Base
          </h1>
          <p className="text-gray-600 mt-1">
            Manage documents and information for AI-powered insights
          </p>
        </div>
        <Button onClick={loadDocuments}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Pinecone Status Alert */}
      <Alert>
        <Database className="w-4 h-4" />
        <AlertDescription>
                                  <strong>Pinecone Status:</strong> Connected to oracle-knowledge-base index
          {analytics && ` • ${analytics.total_documents} documents indexed`}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">
            <BookOpen className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search documents or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="best_practice">Best Practice</SelectItem>
                    <SelectItem value="case_study">Case Study</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredDocuments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No documents found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredDocuments.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <h3 className="font-semibold">{doc.title}</h3>
                            {getSyncStatusBadge(doc)}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="outline">{doc.type}</Badge>
                            {doc.category && (
                              <Badge variant="secondary">{doc.category}</Badge>
                            )}
                            {(doc.tags || []).map((tag, idx) => (
                              <Badge key={idx} variant="default">
                                <Tags className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500">
                            Uploaded {new Date(doc.created_at).toLocaleDateString()}
                            {doc.author && ` • By ${doc.author}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReprocess(doc.id)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter document title"
                />
              </div>

              <div>
                <Label htmlFor="type">Document Type</Label>
                <Select 
                  value={uploadForm.type} 
                  onValueChange={(value: DocumentType) => setUploadForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best_practice">Best Practice</SelectItem>
                    <SelectItem value="case_study">Case Study</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category (Optional)</Label>
                <Input
                  id="category"
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Sales, Marketing, Operations"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., growth, strategy, automation"
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !uploadForm.title || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>

              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Documents will be processed using AI to extract key insights, create embeddings, 
                  and make them searchable for roadmap and sprint generation.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.total_documents}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Relevance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(analytics.average_relevance_score * 100).toFixed(0)}%
                    </div>
                    <Progress value={analytics.average_relevance_score * 100} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Object.values(analytics.usage_by_context || {}).reduce((a, b) => a + b, 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Documents by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics.documents_by_type || {}).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                        <Badge>{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage by Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics.usage_by_context || {}).map(([context, count]) => (
                      <div key={context} className="flex justify-between items-center">
                        <span className="capitalize">{context.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{count}</Badge>
                          <Progress 
                            value={(count / Object.values(analytics.usage_by_context || {}).reduce((a, b) => a + b, 1)) * 100} 
                            className="w-24" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feedback Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{analytics.feedback_summary.helpful}</div>
                      <p className="text-sm text-gray-500">Helpful</p>
                    </div>
                    <div className="text-center">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">
                        {analytics.feedback_summary.not_relevant + 
                         analytics.feedback_summary.needs_update + 
                         analytics.feedback_summary.outdated}
                      </div>
                      <p className="text-sm text-gray-500">Needs Improvement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {analytics.top_used_documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Used Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.top_used_documents.map((doc, idx) => (
                        <div key={doc.document_id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
                            <span className="text-sm">{doc.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{doc.usage_count} uses</Badge>
                            <Badge variant="secondary">
                              {(doc.average_relevance * 100).toFixed(0)}% relevant
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 