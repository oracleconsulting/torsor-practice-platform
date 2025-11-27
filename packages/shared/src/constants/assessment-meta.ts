// Assessment Metadata

export interface AssessmentMeta {
  type: 'part1' | 'part2' | 'part3';
  title: string;
  subtitle: string;
  description: string;
  questionCount: number;
  sectionCount: number;
  estimatedMinutes: number;
  icon: string;
  color: string;
}

export const ASSESSMENT_META: Record<string, AssessmentMeta> = {
  part1: {
    type: 'part1',
    title: 'Part 1: Life Design',
    subtitle: 'Understanding Your Personal Goals',
    description: 'Picture your ideal future and understand what\'s holding you back from living it.',
    questionCount: 15,
    sectionCount: 1,
    estimatedMinutes: 15,
    icon: '🎯',
    color: 'purple',
  },
  part2: {
    type: 'part2',
    title: 'Part 2: Business Deep Dive',
    subtitle: 'Analyzing Your Business Model',
    description: 'Comprehensive analysis of your business across 12 critical dimensions.',
    questionCount: 72,
    sectionCount: 13,
    estimatedMinutes: 45,
    icon: '📊',
    color: 'blue',
  },
  part3: {
    type: 'part3',
    title: 'Part 3: Hidden Value Audit',
    subtitle: 'Discover Untapped Assets',
    description: 'Uncover the hidden value in your business worth £50,000+ in opportunities.',
    questionCount: 32,
    sectionCount: 6,
    estimatedMinutes: 25,
    icon: '💎',
    color: 'amber',
  },
};

// Section definitions for Part 2
export const PART2_SECTIONS = [
  { id: 'leadership', number: 1, title: 'Leadership & Vision Reality', shortTitle: 'Vision', questionCount: 9 },
  { id: 'money', number: 2, title: 'The Money Truth', shortTitle: 'Money', questionCount: 7 },
  { id: 'customer', number: 3, title: 'Customer & Market Reality', shortTitle: 'Market', questionCount: 6 },
  { id: 'execution', number: 4, title: 'Execution Engine', shortTitle: 'Execution', questionCount: 8 },
  { id: 'people', number: 5, title: 'People & Culture', shortTitle: 'People', questionCount: 3 },
  { id: 'tech', number: 6, title: 'Tech & Data', shortTitle: 'Tech', questionCount: 4 },
  { id: 'product', number: 7, title: 'Product & Customer Value', shortTitle: 'Product', questionCount: 6 },
  { id: 'risk', number: 8, title: 'Risk & Compliance', shortTitle: 'Risk', questionCount: 5 },
  { id: 'supply', number: 9, title: 'Supply Chain & Partnerships', shortTitle: 'Supply', questionCount: 2 },
  { id: 'growth', number: 10, title: 'Market Position & Growth', shortTitle: 'Growth', questionCount: 2 },
  { id: 'integration', number: 11, title: 'Integration & Bottlenecks', shortTitle: 'Integration', questionCount: 3 },
  { id: 'advisors', number: 12, title: 'External Support & Advisory', shortTitle: 'Advisors', questionCount: 7 },
  { id: 'behind', number: 13, title: 'What\'s Behind the Scenes?', shortTitle: 'Behind Scenes', questionCount: 10 },
];

// Section definitions for Part 3
export const PART3_SECTIONS = [
  { id: 'intellectual', number: 1, title: 'Intellectual Capital Audit', shortTitle: 'Intellectual Capital', questionCount: 7 },
  { id: 'brand', number: 2, title: 'Brand & Trust Equity', shortTitle: 'Brand & Trust', questionCount: 5 },
  { id: 'market', number: 3, title: 'Market Position Vulnerabilities', shortTitle: 'Market Position', questionCount: 5 },
  { id: 'systems', number: 4, title: 'Systems & Scale Readiness', shortTitle: 'Systems & Scale', questionCount: 5 },
  { id: 'people', number: 5, title: 'People & Culture Assets', shortTitle: 'People & Culture', questionCount: 5 },
  { id: 'financial', number: 6, title: 'Financial & Exit Readiness', shortTitle: 'Financial & Exit', questionCount: 5 },
];

// Week themes for 13-week program
export const WEEK_THEMES = [
  { week: 1, theme: 'Foundation & Quick Wins', focus: 'Immediate impact actions' },
  { week: 2, theme: 'Financial Clarity', focus: 'Numbers that matter' },
  { week: 3, theme: 'Process Documentation', focus: 'Capture critical knowledge' },
  { week: 4, theme: 'Customer Focus', focus: 'Strengthen relationships' },
  { week: 5, theme: 'Team Alignment', focus: 'Build capacity' },
  { week: 6, theme: 'Systems Upgrade', focus: 'Remove bottlenecks' },
  { week: 7, theme: 'Mid-Point Review', focus: 'Assess and adjust' },
  { week: 8, theme: 'Growth Levers', focus: 'Accelerate momentum' },
  { week: 9, theme: 'Risk Mitigation', focus: 'Protect the business' },
  { week: 10, theme: 'Value Creation', focus: 'Unlock hidden assets' },
  { week: 11, theme: 'Scale Preparation', focus: 'Build for growth' },
  { week: 12, theme: 'Owner Independence', focus: 'Reduce dependencies' },
  { week: 13, theme: 'Celebration & Planning', focus: 'Review and next steps' },
];

