import React, { useState, useEffect } from 'react';
import { 
  BookOpen, FileText, Search, Plus, Tag, Clock, Eye, Loader2, AlertCircle,
  Video, Newspaper, Globe, GraduationCap, BookMarked, Users, Star, ExternalLink,
  TrendingUp, Target, Award
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
import { 
  loadLeadershipLibrary, 
  getBookCoverUrl, 
  searchLeadershipBooks,
  type LeadershipBook 
} from '@/lib/leadership-library-data';

interface KnowledgeDocumentForm {
  title: string;
  summary: string;
  document_type: 'leadership_book' | 'knowledge_session' | 'article' | 'webinar' | 'cpd_summary' | 'case_study' | 'guide' | 'template' | 'notes' | 'other';
  tags: string[];
  skill_categories: string[];
  cpd_activity_id?: string;
  is_public: boolean;
  url?: string; // For webinars, articles, videos
  author?: string; // For books, articles
  duration_minutes?: number; // For videos, webinars
}

const KnowledgeBasePage: React.FC = () => {
  const accountancyContext = useAccountancyContext();
  const practice = accountancyContext?.practice;
  const practiceMember = accountancyContext?.practiceMember;

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [cpdActivities, setCpdActivities] = useState<CPDActivity[]>([]);
  const [leadershipBooks, setLeadershipBooks] = useState<LeadershipBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<LeadershipBook | null>(null);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const [newDocument, setNewDocument] = useState<KnowledgeDocumentForm>({
    title: '',
    summary: '',
    document_type: 'knowledge_session',
    tags: [],
    skill_categories: [],
    is_public: true,
    url: '',
    author: '',
    duration_minutes: undefined
  });

  const [activeTab, setActiveTab] = useState('all');

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
      try {
        setLoading(true);
        setError(null);

        // Load leadership library (public data)
        const booksData = await loadLeadershipLibrary();
        setLeadershipBooks(booksData);

        // If no practice, show empty state for practice-specific content
        if (!practice?.id || !practiceMember?.id) {
          console.log('[KnowledgeBase] No practice/member, showing library only');
          setDocuments([]);
          setCpdActivities([]);
          setLoading(false);
          return;
        }

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
    
    const matchesTab = activeTab === 'all' || doc.document_type === activeTab;
    const matchesType = selectedType === 'all' || doc.document_type === selectedType;
    const matchesCategory = selectedCategory === 'all' || 
      (doc.skill_categories && doc.skill_categories.includes(selectedCategory));

    return matchesSearch && matchesTab && matchesType && matchesCategory;
  });

  // Filter leadership books
  const filteredBooks = leadershipBooks.filter(book => {
    const matchesSearch = searchQuery === '' ||
      book.book_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.short_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.key_concepts.some(concept => concept.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDifficulty = selectedDifficulty === 'all' || book.difficulty_level === selectedDifficulty;

    return matchesSearch && matchesDifficulty;
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
      case 'leadership_book': return BookMarked;
      case 'knowledge_session': return Video;
      case 'article': return Newspaper;
      case 'webinar': return Globe;
      case 'cpd_summary': return FileText;
      case 'guide': return BookOpen;
      case 'case_study': return GraduationCap;
      case 'template': return FileText;
      case 'notes': return FileText;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'leadership_book': return 'text-amber-500';
      case 'knowledge_session': return 'text-purple-500';
      case 'article': return 'text-cyan-500';
      case 'webinar': return 'text-pink-500';
      case 'cpd_summary': return 'text-blue-500';
      case 'guide': return 'text-green-500';
      case 'case_study': return 'text-indigo-500';
      case 'template': return 'text-orange-500';
      case 'notes': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'leadership_book': return 'Leadership Library';
      case 'knowledge_session': return 'Knowledge Sharing';
      case 'article': return 'Article';
      case 'webinar': return 'Webinar';
      case 'cpd_summary': return 'CPD Summary';
      case 'guide': return 'Guide';
      case 'case_study': return 'Case Study';
      case 'template': return 'Template';
      case 'notes': return 'Notes';
      default: return 'Other';
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
          <div>
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
            <p className="text-muted-foreground mt-1">
              Team knowledge, learning resources, and professional development
            </p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="leadership_book">
            <BookMarked className="w-4 h-4 mr-2" />
            Books
          </TabsTrigger>
          <TabsTrigger value="knowledge_session">
            <Video className="w-4 h-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="article">
            <Newspaper className="w-4 h-4 mr-2" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="webinar">
            <Globe className="w-4 h-4 mr-2" />
            Webinars
          </TabsTrigger>
          <TabsTrigger value="cpd_summary">
            <FileText className="w-4 h-4 mr-2" />
            CPD
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white font-medium w-4 h-4" />
          <Input 
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="leadership_book">📚 Leadership Books</SelectItem>
            <SelectItem value="knowledge_session">🎥 Knowledge Sessions</SelectItem>
            <SelectItem value="article">📰 Articles</SelectItem>
            <SelectItem value="webinar">🌐 Webinars</SelectItem>
            <SelectItem value="cpd_summary">📄 CPD Summaries</SelectItem>
            <SelectItem value="case_study">🎓 Case Studies</SelectItem>
            <SelectItem value="guide">📖 Guides</SelectItem>
            <SelectItem value="template">📋 Templates</SelectItem>
            <SelectItem value="notes">📝 Notes</SelectItem>
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
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <Card className="bg-gray-50 border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-900">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-gray-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-900">Books</CardTitle>
            <BookMarked className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {leadershipBooks.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-900">Sessions</CardTitle>
            <Video className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {documents.filter(d => d.document_type === 'knowledge_session').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cyan-50 border-cyan-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-900">Articles</CardTitle>
            <Newspaper className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {documents.filter(d => d.document_type === 'article').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-pink-50 border-pink-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-900">Webinars</CardTitle>
            <Globe className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {documents.filter(d => d.document_type === 'webinar').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-900">CPD</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {documents.filter(d => d.document_type === 'cpd_summary').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leadership Books Tab - Special Handling */}
      {activeTab === 'leadership_book' ? (
        <div className="space-y-6">
          {/* Filters for Books */}
          <div className="flex gap-4 items-center">
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-gray-900">
              {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
            </Badge>
          </div>

          {/* Books Gallery */}
          {filteredBooks.length === 0 ? (
            <Card className="bg-gray-50 border-gray-300">
              <CardContent className="p-12 text-center">
                <BookMarked className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Books Found</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {filteredBooks.map(book => (
                <Card
                  key={book.book_id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-amber-200 hover:border-amber-400 group"
                  onClick={() => {
                    setSelectedBook(book);
                    setShowBookDialog(true);
                  }}
                >
                  <CardContent className="p-0">
                    {/* Book Cover */}
                    <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                      <img
                        src={getBookCoverUrl(book.cover_image_filename)}
                        alt={book.book_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://placehold.co/400x600/f59e0b/fff?text=' + encodeURIComponent(book.book_title.substring(0, 20));
                        }}
                      />
                      {/* Difficulty Badge */}
                      <div className="absolute top-1.5 right-1.5">
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] px-1.5 py-0.5 ${
                            book.difficulty_level === 'Beginner' ? 'bg-green-500/90' :
                            book.difficulty_level === 'Intermediate' ? 'bg-blue-500/90' :
                            'bg-purple-500/90'
                          } text-white`}
                        >
                          {book.difficulty_level.substring(0, 3)}
                        </Badge>
                      </div>
                      {/* Rating Badge */}
                      <div className="absolute bottom-1.5 left-1.5">
                        <Badge variant="secondary" className="bg-white/90 text-gray-900 flex items-center gap-0.5 text-[10px] px-1.5 py-0.5">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          {book.goodreads_rating.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                    {/* Book Info */}
                    <div className="p-2 space-y-0.5">
                      <h3 className="font-bold text-xs text-gray-900 line-clamp-2 group-hover:text-amber-600 leading-tight">
                        {book.book_title}
                      </h3>
                      <p className="text-[10px] text-gray-700 line-clamp-1">{book.author}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-600 pt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {book.estimated_read_time_hours}h
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Award className="h-2.5 w-2.5" />
                          {book.cpd_hours_value}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="bg-gray-50 border-gray-300">
          <CardContent className="p-12 text-center">
            {activeTab === 'knowledge_session' ? (
              <>
                <Video className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Knowledge Sharing Sessions</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Team members who complete CPD can create summarized videos or articles to share their learnings.
                  Great for multiplying the value of training across the team.
                </p>
              </>
            ) : activeTab === 'article' ? (
              <>
                <Newspaper className="h-12 w-12 text-cyan-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Articles of Interest</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Share industry news, thought leadership pieces, and relevant articles that keep the team informed.
                </p>
              </>
            ) : activeTab === 'webinar' ? (
              <>
                <Globe className="h-12 w-12 text-pink-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Webinars & Online Events</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Track webinars, online conferences, and virtual events relevant to your team's development.
                </p>
              </>
            ) : (
              <>
                <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Content Yet</h3>
                <p className="text-sm text-gray-700 mb-4">
                  {documents.length === 0 
                    ? 'Start building your knowledge base by adding your first piece of content'
                    : 'Try adjusting your search or filters'}
                </p>
              </>
            )}
            <Button onClick={() => setShowUploadDialog(true)} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Add {getTypeLabel(activeTab === 'all' ? 'other' : activeTab)}
            </Button>
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
                        <div className="flex items-center justify-between text-xs text-white font-medium">
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
                        <p className="text-xs text-gray-100 font-medium">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Content to Knowledge Base</DialogTitle>
            <DialogDescription>
              Share knowledge, resources, and learning with your team
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Content Type *</Label>
              <Select 
                value={newDocument.document_type} 
                onValueChange={(value) => setNewDocument({...newDocument, document_type: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leadership_book">📚 Leadership Book</SelectItem>
                  <SelectItem value="knowledge_session">🎥 Knowledge Session</SelectItem>
                  <SelectItem value="article">📰 Article</SelectItem>
                  <SelectItem value="webinar">🌐 Webinar</SelectItem>
                  <SelectItem value="cpd_summary">📄 CPD Summary</SelectItem>
                  <SelectItem value="case_study">🎓 Case Study</SelectItem>
                  <SelectItem value="guide">📖 Guide</SelectItem>
                  <SelectItem value="template">📋 Template</SelectItem>
                  <SelectItem value="notes">📝 Notes</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={newDocument.title}
                onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                placeholder={
                  newDocument.document_type === 'leadership_book' ? 'e.g., The Five Dysfunctions of a Team' :
                  newDocument.document_type === 'knowledge_session' ? 'e.g., MTD Implementation - Key Learnings' :
                  newDocument.document_type === 'article' ? 'e.g., Future of AI in Accounting' :
                  'e.g., ACCA Tax Update Summary'
                }
              />
            </div>

            {/* Author field for books and articles */}
            {(newDocument.document_type === 'leadership_book' || newDocument.document_type === 'article') && (
              <div>
                <Label>Author</Label>
                <Input
                  value={newDocument.author || ''}
                  onChange={(e) => setNewDocument({...newDocument, author: e.target.value})}
                  placeholder="e.g., Patrick Lencioni"
                />
              </div>
            )}

            {/* URL field for articles, webinars, and videos */}
            {(['article', 'webinar', 'knowledge_session'].includes(newDocument.document_type)) && (
              <div>
                <Label>URL / Link</Label>
                <Input
                  value={newDocument.url || ''}
                  onChange={(e) => setNewDocument({...newDocument, url: e.target.value})}
                  placeholder="https://..."
                  type="url"
                />
              </div>
            )}

            {/* Duration for videos and webinars */}
            {(['knowledge_session', 'webinar'].includes(newDocument.document_type)) && (
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  value={newDocument.duration_minutes || ''}
                  onChange={(e) => setNewDocument({...newDocument, duration_minutes: parseInt(e.target.value) || undefined})}
                  placeholder="e.g., 45"
                  type="number"
                />
              </div>
            )}

            <div>
              <Label>Summary / Key Takeaways *</Label>
              <Textarea
                value={newDocument.summary}
                onChange={(e) => setNewDocument({...newDocument, summary: e.target.value})}
                placeholder={
                  newDocument.document_type === 'leadership_book' ? 'What are the main concepts and how can they be applied?' :
                  newDocument.document_type === 'knowledge_session' ? 'Share the key learnings from your CPD...' :
                  'Describe the key points and takeaways...'
                }
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">

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

      {/* Book Detail Dialog */}
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedBook && (
            <div className="space-y-6">
              {/* Header */}
              <DialogHeader>
                <div className="flex gap-6">
                  {/* Book Cover */}
                  <div className="flex-shrink-0">
                    <img
                      src={getBookCoverUrl(selectedBook.cover_image_filename)}
                      alt={selectedBook.book_title}
                      className="w-48 h-72 object-cover rounded-lg shadow-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://placehold.co/400x600/f59e0b/fff?text=' + encodeURIComponent(selectedBook.book_title.substring(0, 20));
                      }}
                    />
                  </div>
                  
                  {/* Book Metadata */}
                  <div className="flex-1 space-y-3">
                    <DialogTitle className="text-2xl text-gray-900">{selectedBook.book_title}</DialogTitle>
                    <DialogDescription className="text-base text-gray-800 font-medium">
                      by {selectedBook.author} • {selectedBook.publication_year}
                    </DialogDescription>
                    
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${
                        selectedBook.difficulty_level === 'Beginner' ? 'bg-green-500' :
                        selectedBook.difficulty_level === 'Intermediate' ? 'bg-blue-500' :
                        'bg-purple-500'
                      } text-white`}>
                        {selectedBook.difficulty_level}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1 text-gray-900">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {selectedBook.goodreads_rating.toFixed(1)} Goodreads
                      </Badge>
                      <Badge variant="outline" className="text-gray-900">
                        <Clock className="h-3 w-3 mr-1" />
                        {selectedBook.estimated_read_time_hours}h read
                      </Badge>
                      <Badge variant="outline" className="text-gray-900 bg-orange-50">
                        <Award className="h-3 w-3 mr-1" />
                        {selectedBook.cpd_hours_value} CPD hours
                      </Badge>
                    </div>

                    {/* Short Summary */}
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {selectedBook.short_summary}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              {/* Full Summary */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Overview</h3>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {selectedBook.full_summary}
                </p>
              </div>

              {/* Key Concepts */}
              {selectedBook.key_concepts.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    Key Concepts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedBook.key_concepts.map((concept, idx) => (
                      <Badge key={idx} variant="outline" className="text-gray-900 bg-orange-50 border-orange-300">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Objectives */}
              {selectedBook.learning_objectives.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Learning Objectives
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                    {selectedBook.learning_objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable Takeaways */}
              {selectedBook.actionable_takeaways.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Actionable Takeaways
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                    {selectedBook.actionable_takeaways.map((takeaway, idx) => (
                      <li key={idx}>{takeaway}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills & Competencies */}
              <div className="grid grid-cols-2 gap-4">
                {selectedBook.leadership_competencies.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Leadership Competencies</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedBook.leadership_competencies.map((comp, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs text-gray-900">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedBook.soft_skills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Soft Skills</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedBook.soft_skills.slice(0, 6).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs text-gray-900">
                          {skill}
                        </Badge>
                      ))}
                      {selectedBook.soft_skills.length > 6 && (
                        <Badge variant="outline" className="text-xs text-gray-900">
                          +{selectedBook.soft_skills.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Best For */}
              {selectedBook.best_for_scenarios.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Best For</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedBook.best_for_scenarios.map((scenario, idx) => (
                      <Badge key={idx} variant="outline" className="text-gray-900 bg-blue-50 border-blue-300">
                        {scenario}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Books */}
              {selectedBook.related_books.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Related Reading</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedBook.related_books.map((book, idx) => (
                      <Badge key={idx} variant="outline" className="text-gray-900">
                        {book}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Quotes */}
              {selectedBook.quotes.length > 0 && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Notable Quotes</h3>
                  <div className="space-y-2">
                    {selectedBook.quotes.map((quote, idx) => (
                      <p key={idx} className="text-sm text-gray-800 italic">
                        "{quote}"
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowBookDialog(false)}>
                  Close
                </Button>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <BookMarked className="h-4 w-4 mr-2" />
                  Add to Reading List
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBasePage;
