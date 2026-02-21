// ============================================================================
// KNOWLEDGE BASE PAGE
// ============================================================================
// Manage practice methodology, examples, and AI guidance
// ============================================================================

import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { 
  Plus, Search, FileText, Lightbulb, 
  AlertTriangle, CheckCircle, Edit2, Trash2, Eye,
  Tag, Clock, User, Sparkles, ChevronRight
} from 'lucide-react';
import { StatCard, StatusBadge, EmptyState } from '../../components/ui';

interface KnowledgeEntry {
  id: string;
  category: 'methodology' | 'example' | 'correction' | 'objection' | 'template';
  title: string;
  content: string;
  tags: string[];
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  approved: boolean;
}

const CATEGORIES = [
  { id: 'methodology', name: 'Methodology', icon: FileText, color: 'blue', description: 'Core processes and frameworks' },
  { id: 'example', name: 'Examples', icon: Lightbulb, color: 'amber', description: 'Real-world case studies' },
  { id: 'correction', name: 'Corrections', icon: AlertTriangle, color: 'red', description: 'AI output corrections' },
  { id: 'objection', name: 'Objection Handling', icon: CheckCircle, color: 'emerald', description: 'Common objections and responses' },
  { id: 'template', name: 'Templates', icon: FileText, color: 'purple', description: 'Reusable templates' },
];

export function KnowledgeBasePage() {
  const { user } = useAuth();
  const { data: _currentMember } = useCurrentMember(user?.id);
  
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [_loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [_showAddModal, setShowAddModal] = useState(false);
  
  // Silence unused warnings
  void _currentMember;
  void _loading;
  void _showAddModal;

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = () => {
    // Sample knowledge entries
    const sampleEntries: KnowledgeEntry[] = [
      {
        id: '1',
        category: 'methodology',
        title: 'Goal Alignment Programme - Core Framework',
        content: `The Goal Alignment Programme is a comprehensive client transformation methodology:

**Phase 1: Discovery (Part 1 Assessment)**
- Tuesday Test: Understanding daily pain points
- Secret Pride: Identifying hidden strengths
- Danger Zone: Recognizing risks and fears
- Family Feedback: External perspective on the founder

**Phase 2: Deep Dive (Part 2 Assessment)**
- Revenue & Expenses analysis
- Team structure and capabilities
- Systems and technology audit
- Growth bottlenecks identification

**Phase 3: Roadmap Generation**
- 5-Year Vision: Long-term transformation narrative
- 6-Month Shift: Immediate action plan
- 12-Week Sprint: Weekly tactical tasks

**Phase 4: Value Discovery (Part 3 Assessment)**
- Hidden value identification
- Business valuation baseline
- Risk register creation
- ROI opportunity mapping`,
        tags: ['365', 'methodology', 'framework', 'core'],
        usage_count: 156,
        created_by: 'James Howard',
        created_at: '2024-06-15',
        updated_at: '2024-11-20',
        approved: true
      },
      {
        id: '2',
        category: 'correction',
        title: 'Revenue Growth Assumptions',
        content: `**Correction for AI Output**

When generating growth projections, the AI sometimes assumes linear 20% year-on-year growth without considering:

1. Industry-specific growth rates (use industry benchmarks)
2. Seasonality factors
3. Economic cycle position
4. Client's actual capacity constraints

**Correct Approach:**
- Always reference the client's stated growth ambitions from Part 2
- Cross-check against industry benchmarks in our database
- Apply a conservative multiplier (0.7x stated goals) for projections
- Include capacity constraints in feasibility assessment`,
        tags: ['ai-correction', 'growth', 'projections'],
        usage_count: 42,
        created_by: 'James Howard',
        created_at: '2024-10-01',
        updated_at: '2024-11-15',
        approved: true
      },
      {
        id: '3',
        category: 'objection',
        title: 'Too Expensive Response',
        content: `**Common Objection:** "Your fees are too high / I can get this cheaper elsewhere"

**Response Framework:**

1. **Acknowledge**: "I understand budget is important..."

2. **Reframe Value**: 
   - "What would it cost you to NOT address [specific pain point from assessment]?"
   - "Based on your current [revenue/overhead], the ROI on our engagement is..."

3. **Differentiate**:
   - "Unlike generic accounting services, we're focusing on..."
   - "The 365 Programme includes ongoing strategic support, not just compliance"

4. **Proof Points**:
   - Reference similar client transformations
   - Share specific metrics improvements

5. **Flexible Options**:
   - Phased implementation
   - Priority focus areas
   - Payment terms`,
        tags: ['objection', 'pricing', 'sales'],
        usage_count: 89,
        created_by: 'Wes Thompson',
        created_at: '2024-08-20',
        updated_at: '2024-11-01',
        approved: true
      },
      {
        id: '4',
        category: 'example',
        title: 'Case Study: Tom Clark - Rowgear',
        content: `**Client Profile:**
- Business: Fitness equipment retail
- Revenue: £800k
- Challenge: Working 70+ hours, no clear growth path

**Discovery Insights:**
- Tuesday Test revealed constant firefighting
- Secret Pride: Deep product knowledge, customer relationships
- Danger Zone: Fear of delegation, perfectionism

**Roadmap Delivered:**
- 5-Year Vision: £3m revenue, 4-day week, management team
- 6-Month Shift: Hire ops manager, systematize key processes
- 12-Week Sprint: Focus on delegation and time tracking

**Results (6 months in):**
- Reduced working hours by 15 hours/week
- Hired first employee outside family
- On track for 20% revenue growth`,
        tags: ['case-study', 'retail', 'transformation'],
        usage_count: 34,
        created_by: 'James Howard',
        created_at: '2024-11-01',
        updated_at: '2024-12-01',
        approved: true
      },
    ];

    setEntries(sampleEntries);
    setLoading(false);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || entry.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout
      title="Knowledge Base"
      subtitle="AI guidance, methodology, and best practices"
      headerActions={
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      }
    >
      <div className="max-w-7xl mx-auto">

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge base..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Categories */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = entries.filter(e => e.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className={`p-4 rounded-xl border transition-all ${
                  isSelected 
                    ? `bg-${cat.color}-50 border-${cat.color}-200` 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`w-5 h-5 text-${cat.color}-600`} />
                  <span className="font-medium text-gray-900">{cat.name}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-500">{cat.description}</div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="AI References" value={entries.reduce((sum, e) => sum + e.usage_count, 0)} accent="blue" icon={<Sparkles className="w-5 h-5" />} />
          <StatCard label="Total Entries" value={entries.length} accent="blue" icon={<FileText className="w-5 h-5" />} />
          <StatCard label="Approved" value={entries.filter(e => e.approved).length} accent="teal" icon={<CheckCircle className="w-5 h-5" />} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card">
          <div className="card-body space-y-4">
            {filteredEntries.length === 0 ? (
              <EmptyState title="No articles yet" description="Add methodology, examples, or templates to your knowledge base." />
            ) : filteredEntries.map((entry) => {
              const category = CATEGORIES.find(c => c.id === entry.category);
              const Icon = category?.icon || FileText;
              
              return (
                <div 
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    selectedEntry?.id === entry.id 
                      ? 'border-purple-300 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-${category?.color}-100`}>
                      <Icon className={`w-4 h-4 text-${category?.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 font-display">{entry.title}</h3>
                        <StatusBadge status={entry.approved ? 'published' : 'draft'} label={entry.approved ? 'Published' : 'Draft'} showIcon={false} />
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {entry.content.slice(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Sparkles className="w-3 h-3" />
                          {entry.usage_count} uses
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
          </div>

          <div className="card sticky top-8">
            <div className="card-body">
            {selectedEntry ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedEntry.approved ? 'published' : 'draft'} label={selectedEntry.approved ? 'Approved' : 'Draft'} showIcon={false} />
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                      {selectedEntry.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedEntry.title}</h2>
                
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-6">
                  {selectedEntry.content}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedEntry.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                      <Tag className="w-3 h-3 inline mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="text-sm text-gray-500 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Created by {selectedEntry.created_by}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    Updated {new Date(selectedEntry.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select an entry to view details</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default KnowledgeBasePage;

