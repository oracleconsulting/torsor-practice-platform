import React, { useState, useEffect } from 'react';
import { 
  BookOpen, FileText, Video, Download, Search, Plus,
  Folder, Tag, Clock, Eye, Heart, Share2, Filter,
  ChevronRight, Star, TrendingUp, Users, Award, Upload
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  count: number;
}

interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'template' | 'guide' | 'script' | 'case-study' | 'checklist' | 'video';
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  likes: number;
  downloads: number;
  content?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  duration?: string; // for videos
  pages?: number; // for documents
  isFavorite?: boolean;
}

interface SuccessStory {
  id: string;
  title: string;
  client: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string[];
  keyTakeaways: string[];
  author: string;
  date: Date;
  metrics: {
    revenue?: string;
    efficiency?: string;
    satisfaction?: string;
  };
}

const KnowledgeBasePage: React.FC = () => {
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // In real implementation, fetch from API
      setCategories(getMockCategories());
      setItems(getMockKnowledgeItems());
      setSuccessStories(getMockSuccessStories());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockCategories = (): KnowledgeCategory[] => {
    return [
      {
        id: 'advisory',
        name: 'Advisory Templates',
        description: 'Strategic planning and advisory document templates',
        icon: FileText,
        color: 'text-blue-500',
        count: 24
      },
      {
        id: 'client',
        name: 'Client Scripts',
        description: 'Conversation scripts and communication templates',
        icon: Users,
        color: 'text-purple-500',
        count: 18
      },
      {
        id: 'compliance',
        name: 'Compliance Guides',
        description: 'Regulatory compliance checklists and guides',
        icon: Award,
        color: 'text-green-500',
        count: 32
      },
      {
        id: 'training',
        name: 'Training Materials',
        description: 'Team training videos and documentation',
        icon: Video,
        color: 'text-orange-500',
        count: 15
      }
    ];
  };

  const getMockKnowledgeItems = (): KnowledgeItem[] => {
    return [
      {
        id: '1',
        title: 'Strategic Planning Template',
        description: 'Comprehensive template for developing client strategic plans',
        category: 'advisory',
        type: 'template',
        tags: ['strategy', 'planning', 'advisory'],
        author: 'Sarah Johnson',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        views: 156,
        likes: 42,
        downloads: 89,
        pages: 12,
        isFavorite: true
      },
      {
        id: '2',
        title: 'Client Onboarding Script',
        description: 'Step-by-step script for onboarding new advisory clients',
        category: 'client',
        type: 'script',
        tags: ['onboarding', 'client', 'communication'],
        author: 'Michael Chen',
        createdAt: new Date('2023-12-15'),
        updatedAt: new Date('2024-01-10'),
        views: 203,
        likes: 58,
        downloads: 124,
        pages: 8
      },
      {
        id: '3',
        title: 'MTD Compliance Checklist',
        description: 'Complete checklist for Making Tax Digital compliance',
        category: 'compliance',
        type: 'checklist',
        tags: ['mtd', 'tax', 'compliance'],
        author: 'Emma Wilson',
        createdAt: new Date('2023-11-20'),
        updatedAt: new Date('2024-01-05'),
        views: 342,
        likes: 87,
        downloads: 215,
        pages: 6
      },
      {
        id: '4',
        title: 'Advisory Skills Training',
        description: 'Video series on developing advisory skills',
        category: 'training',
        type: 'video',
        tags: ['training', 'skills', 'advisory'],
        author: 'David Brown',
        createdAt: new Date('2023-10-10'),
        updatedAt: new Date('2023-12-20'),
        views: 567,
        likes: 123,
        downloads: 0,
        duration: '45 min',
        thumbnailUrl: '/api/placeholder/400/225'
      },
      {
        id: '5',
        title: 'Financial Analysis Framework',
        description: 'Framework for conducting comprehensive financial analysis',
        category: 'advisory',
        type: 'guide',
        tags: ['finance', 'analysis', 'framework'],
        author: 'Lisa Anderson',
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-20'),
        views: 189,
        likes: 51,
        downloads: 97,
        pages: 15,
        isFavorite: true
      }
    ];
  };

  const getMockSuccessStories = (): SuccessStory[] => {
    return [
      {
        id: '1',
        title: 'Digital Transformation Success',
        client: 'TechStart Ltd',
        industry: 'Technology',
        challenge: 'Manual processes causing inefficiencies and errors',
        solution: 'Implemented cloud-based accounting and automated workflows',
        results: [
          '60% reduction in processing time',
          '95% accuracy improvement',
          '£50,000 annual cost savings'
        ],
        keyTakeaways: [
          'Start with process mapping',
          'Engage team early in transformation',
          'Phase implementation for smooth transition'
        ],
        author: 'Sarah Johnson',
        date: new Date('2024-01-10'),
        metrics: {
          efficiency: '+60%',
          satisfaction: '9.2/10',
          revenue: '+25%'
        }
      },
      {
        id: '2',
        title: 'ESG Reporting Excellence',
        client: 'GreenCo Manufacturing',
        industry: 'Manufacturing',
        challenge: 'Complex ESG reporting requirements',
        solution: 'Developed comprehensive ESG framework and reporting system',
        results: [
          'Full compliance achieved',
          'Improved investor confidence',
          'Industry recognition award'
        ],
        keyTakeaways: [
          'Align ESG with business strategy',
          'Automate data collection',
          'Regular stakeholder communication'
        ],
        author: 'Michael Chen',
        date: new Date('2023-12-15'),
        metrics: {
          efficiency: '+45%',
          satisfaction: '9.5/10'
        }
      }
    ];
  };

  const typeConfig = {
    template: { icon: FileText, color: 'text-blue-500' },
    guide: { icon: BookOpen, color: 'text-green-500' },
    script: { icon: FileText, color: 'text-purple-500' },
    'case-study': { icon: Award, color: 'text-orange-500' },
    checklist: { icon: FileText, color: 'text-pink-500' },
    video: { icon: Video, color: 'text-red-500' }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesType && matchesSearch;
  });

  const renderItemCard = (item: KnowledgeItem) => {
    const config = typeConfig[item.type];
    const Icon = config.icon;

    return (
      <Card 
        key={item.id}
        className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
        onClick={() => setSelectedItem(item)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white/5`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  {item.title}
                  {item.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                </CardTitle>
                <CardDescription className="text-sm">{item.description}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {item.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-400">
              <Eye className="w-4 h-4" />
              {item.views}
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <Heart className="w-4 h-4" />
              {item.likes}
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <Download className="w-4 h-4" />
              {item.downloads}
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>By {item.author}</span>
            <span>{item.duration || `${item.pages} pages`}</span>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
            {item.type !== 'video' && (
              <Button size="sm" variant="default" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSuccessStory = (story: SuccessStory) => {
    return (
      <Card key={story.id} className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg text-white">{story.title}</CardTitle>
              <CardDescription>
                {story.client} • {story.industry}
              </CardDescription>
            </div>
            <Badge variant="outline">Case Study</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Challenge</p>
            <p className="text-sm text-white">{story.challenge}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Solution</p>
            <p className="text-sm text-white">{story.solution}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-400 mb-2">Key Results</p>
            <div className="grid grid-cols-3 gap-2">
              {story.metrics.efficiency && (
                <div className="text-center p-2 bg-white/5 rounded">
                  <p className="text-lg font-bold text-green-500">{story.metrics.efficiency}</p>
                  <p className="text-xs text-gray-400">Efficiency</p>
                </div>
              )}
              {story.metrics.satisfaction && (
                <div className="text-center p-2 bg-white/5 rounded">
                  <p className="text-lg font-bold text-blue-500">{story.metrics.satisfaction}</p>
                  <p className="text-xs text-gray-400">Satisfaction</p>
                </div>
              )}
              {story.metrics.revenue && (
                <div className="text-center p-2 bg-white/5 rounded">
                  <p className="text-lg font-bold text-purple-500">{story.metrics.revenue}</p>
                  <p className="text-xs text-gray-400">Revenue</p>
                </div>
              )}
            </div>
          </div>

          <Button size="sm" variant="outline" className="w-full">
            Read Full Story
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading Knowledge Base...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Knowledge Base
          </h1>
          <p className="text-gray-400">
            Best practice templates, conversation scripts, and success stories
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search templates, guides, scripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="template">Templates</SelectItem>
            <SelectItem value="guide">Guides</SelectItem>
            <SelectItem value="script">Scripts</SelectItem>
            <SelectItem value="checklist">Checklists</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="resources" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="success-stories">Success Stories</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="resources">
          {/* Category Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <Card 
                  key={category.id}
                  className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/5`}>
                          <Icon className={`w-5 h-5 ${category.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{category.name}</p>
                          <p className="text-sm text-gray-400">{category.count} items</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map(item => renderItemCard(item))}
          </div>

          {filteredItems.length === 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">No resources found matching your criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="success-stories">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {successStories.map(story => renderSuccessStory(story))}
          </div>
        </TabsContent>

        <TabsContent value="favorites">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.filter(item => item.isFavorite).map(item => renderItemCard(item))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Resource Details Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedItem.title}</DialogTitle>
              <DialogDescription>
                {selectedItem.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>By {selectedItem.author}</span>
                <span>•</span>
                <span>Updated {selectedItem.updatedAt.toLocaleDateString()}</span>
                <span>•</span>
                <span>{selectedItem.views} views</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedItem.tags.map(tag => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              {selectedItem.type === 'video' ? (
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                  <Video className="w-16 h-16 text-gray-600" />
                  <p className="text-gray-400 ml-4">Video preview</p>
                </div>
              ) : (
                <Alert>
                  <FileText className="w-4 h-4" />
                  <AlertDescription>
                    This {selectedItem.type} contains {selectedItem.pages} pages of valuable content.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                {selectedItem.type !== 'video' && (
                  <Button className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    // Toggle favorite
                    const updatedItems = items.map(item => 
                      item.id === selectedItem.id 
                        ? { ...item, isFavorite: !item.isFavorite }
                        : item
                    );
                    setItems(updatedItems);
                    setSelectedItem({ ...selectedItem, isFavorite: !selectedItem.isFavorite });
                  }}
                >
                  <Star className={`w-4 h-4 ${selectedItem.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Resource</DialogTitle>
            <DialogDescription>
              Share your knowledge with the team
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="Enter resource title" />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe what this resource contains" rows={3} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="script">Script</SelectItem>
                    <SelectItem value="checklist">Checklist</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input placeholder="Enter tags separated by commas" />
            </div>
            
            <div className="space-y-2">
              <Label>Upload File</Label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-400">Drop file here or click to browse</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button>Upload Resource</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBasePage; 