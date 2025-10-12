/**
 * CPD Course Database Service
 * Loads and manages real CPD courses from Mercia and AccountingCPD.net
 */

export interface CPDCourse {
  provider: string;
  category: string;
  topic: string;
  cpdHours: number;
  learningType: string;
  learningOutcomes: string;
  courseTitle: string;
  subjectArea: string;
  deliveryFormat: string;
  targetAudience: string;
  // Additional computed fields
  relevanceScore?: number;
  matchedSkills?: string[];
}

/**
 * Real CPD courses from Mercia and AccountingCPD.net
 * Data source: docs/combined_cpd_comprehensive_analysis.csv
 */
export const CPD_COURSES: CPDCourse[] = [
  // AI & Technology
  {
    provider: 'AccountingCPD.net',
    category: 'Artificial Intelligence & Technology',
    topic: 'AI Integration in Finance Teams',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Successfully integrating AI into finance functions',
    courseTitle: 'AI Integration in Finance Teams',
    subjectArea: 'Artificial Intelligence & Technology',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Artificial Intelligence & Technology',
    topic: 'AI for Accountants',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'AI applications in accounting and strategic implementation',
    courseTitle: 'AI for Accountants',
    subjectArea: 'Artificial Intelligence & Technology',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Artificial Intelligence & Technology',
    topic: 'Career Progression Pathway: Artificial Intelligence',
    cpdHours: 21,
    learningType: 'Pathway',
    learningOutcomes: 'Comprehensive AI skills development for accountants',
    courseTitle: 'Career Progression Pathway: Artificial Intelligence',
    subjectArea: 'Artificial Intelligence & Technology',
    deliveryFormat: 'Career Progression Pathway',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Artificial Intelligence & Technology',
    topic: 'Data Analytics and Visualization',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Financial data analysis and presentation techniques',
    courseTitle: 'Data Analytics and Visualization',
    subjectArea: 'Artificial Intelligence & Technology',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Artificial Intelligence & Technology',
    topic: 'Excel Advanced Techniques',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Advanced Excel functionality and automation',
    courseTitle: 'Excel Advanced Techniques',
    subjectArea: 'Artificial Intelligence & Technology',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Artificial Intelligence & Technology',
    topic: 'Power BI for Finance Professionals',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Business intelligence and dashboard creation',
    courseTitle: 'Power BI for Finance Professionals',
    subjectArea: 'Artificial Intelligence & Technology',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Artificial Intelligence & Technology',
    topic: 'Technology for Modern Finance Functions',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Technology adoption and digital transformation',
    courseTitle: 'Technology for Modern Finance Functions',
    subjectArea: 'Artificial Intelligence & Technology',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  
  // Advisory & Consulting
  {
    provider: 'AccountingCPD.net',
    category: 'Advisory & Consulting',
    topic: 'Business Advisory Services',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Providing strategic business advisory services',
    courseTitle: 'Business Advisory Services',
    subjectArea: 'Advisory & Consulting',
    deliveryFormat: 'Standard Course',
    targetAudience: 'Senior/Leadership'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Advisory & Consulting',
    topic: 'Strategic Business Planning',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Developing and implementing strategic plans',
    courseTitle: 'Strategic Business Planning',
    subjectArea: 'Advisory & Consulting',
    deliveryFormat: 'Standard Course',
    targetAudience: 'Senior/Leadership'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Leadership & Management',
    topic: 'The Trusted Business Advisor',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Building advisory relationships with clients and stakeholders',
    courseTitle: 'The Trusted Business Advisor',
    subjectArea: 'Leadership & Management',
    deliveryFormat: 'Standard Course',
    targetAudience: 'Senior/Leadership'
  },
  
  // Tax & Compliance
  {
    provider: 'AccountingCPD.net',
    category: 'Tax & Compliance',
    topic: '2024-25 Update: UK Tax',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Annual updates on UK tax developments and legislation',
    courseTitle: '2024-25 Update: UK Tax',
    subjectArea: 'Tax & Compliance',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels - Update'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Tax & Compliance',
    topic: 'Corporation Tax',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Corporation tax planning and compliance',
    courseTitle: 'Corporation Tax',
    subjectArea: 'Tax & Compliance',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Tax & Compliance',
    topic: 'Personal Tax Planning',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Tax-efficient personal financial planning',
    courseTitle: 'Personal Tax Planning',
    subjectArea: 'Tax & Compliance',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Tax & Compliance',
    topic: 'VAT Compliance',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'VAT rules and compliance requirements',
    courseTitle: 'VAT Compliance',
    subjectArea: 'Tax & Compliance',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Tax & Compliance',
    topic: 'Making Tax Digital',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'MTD requirements and digital tax compliance',
    courseTitle: 'Making Tax Digital',
    subjectArea: 'Tax & Compliance',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  
  // Communication & Soft Skills
  {
    provider: 'AccountingCPD.net',
    category: 'Professional Skills & Communication',
    topic: 'Communication for Professional Success',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Effective communication strategies and techniques',
    courseTitle: 'Communication for Professional Success',
    subjectArea: 'Professional Skills & Communication',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Professional Skills & Communication',
    topic: 'Presentation Skills',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Professional presentation delivery and design',
    courseTitle: 'Presentation Skills',
    subjectArea: 'Professional Skills & Communication',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Professional Skills & Communication',
    topic: 'Negotiation Skills',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Negotiation strategies and conflict resolution',
    courseTitle: 'Negotiation Skills',
    subjectArea: 'Professional Skills & Communication',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Professional Skills & Communication',
    topic: 'Networking: Building Relationships with Purpose',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Strategic networking and relationship building',
    courseTitle: 'Networking: Building Relationships with Purpose',
    subjectArea: 'Professional Skills & Communication',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  
  // Leadership & Team Skills
  {
    provider: 'AccountingCPD.net',
    category: 'Leadership & Management',
    topic: 'Career Progression Pathway: Finance Leader',
    cpdHours: 21,
    learningType: 'Pathway',
    learningOutcomes: 'Comprehensive finance leadership development',
    courseTitle: 'Career Progression Pathway: Finance Leader',
    subjectArea: 'Leadership & Management',
    deliveryFormat: 'Career Progression Pathway',
    targetAudience: 'Senior/Leadership'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Leadership & Management',
    topic: 'Emotional Intelligence for Finance Professionals',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'EQ development for leadership effectiveness',
    courseTitle: 'Emotional Intelligence for Finance Professionals',
    subjectArea: 'Leadership & Management',
    deliveryFormat: 'Standard Course',
    targetAudience: 'Senior/Leadership'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Leadership & Management',
    topic: 'Managing People in Finance',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'People management skills for finance professionals',
    courseTitle: 'Managing People in Finance',
    subjectArea: 'Leadership & Management',
    deliveryFormat: 'Standard Course',
    targetAudience: 'Senior/Leadership'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Leadership & Management',
    topic: 'The Resilient Finance Professional',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Building resilience and managing stress in finance roles',
    courseTitle: 'The Resilient Finance Professional',
    subjectArea: 'Leadership & Management',
    deliveryFormat: 'Standard Course',
    targetAudience: 'Senior/Leadership'
  },
  
  // Management Accounting & Reporting
  {
    provider: 'AccountingCPD.net',
    category: 'Financial Management & Business Skills',
    topic: 'Financial Modeling and Forecasting',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Building robust financial models for planning',
    courseTitle: 'Financial Modeling and Forecasting',
    subjectArea: 'Financial Management & Business Skills',
    deliveryFormat: 'Standard Course',
    targetAudience: 'Senior/Leadership'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Financial Management & Business Skills',
    topic: 'Strategic Financial Management',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Strategic financial planning and decision making',
    courseTitle: 'Strategic Financial Management',
    subjectArea: 'Financial Management & Business Skills',
    deliveryFormat: 'Standard Course',
    targetAudience: 'Senior/Leadership'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Financial Reporting & Accounting Standards',
    topic: 'Fast and Effective Monthly Reporting',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Streamlining monthly financial reporting processes',
    courseTitle: 'Fast and Effective Monthly Reporting',
    subjectArea: 'Financial Reporting & Accounting Standards',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  
  // Technical Accounting Fundamentals
  {
    provider: 'AccountingCPD.net',
    category: 'Financial Reporting & Accounting Standards',
    topic: '2024-25 Update: IFRS',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Annual updates on IFRS developments and new standards',
    courseTitle: '2024-25 Update: IFRS',
    subjectArea: 'Financial Reporting & Accounting Standards',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels - Update'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Financial Reporting & Accounting Standards',
    topic: 'UK and Ireland GAAP: Key Issues',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Core UK and Ireland GAAP accounting requirements',
    courseTitle: 'UK and Ireland GAAP: Key Issues',
    subjectArea: 'Financial Reporting & Accounting Standards',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Financial Reporting & Accounting Standards',
    topic: 'Group Accounting',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Consolidation and group accounting principles',
    courseTitle: 'Group Accounting',
    subjectArea: 'Financial Reporting & Accounting Standards',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  
  // Audit & Assurance
  {
    provider: 'AccountingCPD.net',
    category: 'Audit & Assurance',
    topic: 'The Audit Process',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Comprehensive audit process and regulatory standards',
    courseTitle: 'The Audit Process',
    subjectArea: 'Audit & Assurance',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Audit & Assurance',
    topic: 'Professional Scepticism',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Developing and applying professional skepticism in audits',
    courseTitle: 'Professional Scepticism',
    subjectArea: 'Audit & Assurance',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Audit & Assurance',
    topic: 'Risk and Materiality',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Risk assessment and materiality in audit planning',
    courseTitle: 'Risk and Materiality',
    subjectArea: 'Audit & Assurance',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  
  // ESG & Sustainability
  {
    provider: 'AccountingCPD.net',
    category: 'ESG & Sustainability',
    topic: 'ESG for Accountants',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Environmental, social, and governance reporting for accountants',
    courseTitle: 'ESG for Accountants',
    subjectArea: 'ESG & Sustainability',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'ESG & Sustainability',
    topic: 'Carbon Accounting',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Greenhouse gas accounting and carbon footprint calculation',
    courseTitle: 'Carbon Accounting',
    subjectArea: 'ESG & Sustainability',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'ESG & Sustainability',
    topic: 'Sustainability Reporting Frameworks',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'GRI, SASB, TCFD and other sustainability standards',
    courseTitle: 'Sustainability Reporting Frameworks',
    subjectArea: 'ESG & Sustainability',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  
  // Ethics & Professionalism
  {
    provider: 'AccountingCPD.net',
    category: 'Ethics & Professionalism',
    topic: 'AI and Ethics',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Ethical considerations in AI implementation and use',
    courseTitle: 'AI and Ethics',
    subjectArea: 'Ethics & Professionalism',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  },
  {
    provider: 'AccountingCPD.net',
    category: 'Ethics & Professionalism',
    topic: 'Ethics in the Workplace',
    cpdHours: 4,
    learningType: 'Course',
    learningOutcomes: 'Workplace ethics and professional behavior',
    courseTitle: 'Ethics in the Workplace',
    subjectArea: 'Ethics & Professionalism',
    deliveryFormat: 'Standard Course',
    targetAudience: 'All Levels'
  }
];

/**
 * Match skills with relevant CPD courses
 */
export function matchSkillToCourses(skillName: string, skillLevel: number): CPDCourse[] {
  const searchTerm = skillName.toLowerCase();
  
  // Map skill names to course categories/topics
  const matches = CPD_COURSES.filter(course => {
    const courseSearch = `${course.topic} ${course.category} ${course.learningOutcomes}`.toLowerCase();
    
    // Check for direct matches
    if (courseSearch.includes(searchTerm)) return true;
    
    // Skill-specific mappings
    if (skillName.includes('AI') && course.category.includes('Artificial Intelligence')) return true;
    if (skillName.includes('Tax') && course.category.includes('Tax')) return true;
    if (skillName.includes('Audit') && course.category.includes('Audit')) return true;
    if (skillName.includes('Communication') && course.subjectArea.includes('Communication')) return true;
    if (skillName.includes('Leadership') && course.category.includes('Leadership')) return true;
    if (skillName.includes('Advisory') && course.topic.includes('Advisory')) return true;
    if (skillName.includes('Data') && course.topic.includes('Data')) return true;
    if (skillName.includes('ESG') && course.category.includes('ESG')) return true;
    if (skillName.includes('Reporting') && course.subjectArea.includes('Reporting')) return true;
    if (skillName.includes('Excel') && course.topic.includes('Excel')) return true;
    
    return false;
  });
  
  // Sort by relevance (prioritize shorter courses for lower skill levels)
  return matches.sort((a, b) => {
    if (skillLevel < 3) {
      // Prefer shorter courses for beginners
      return a.cpdHours - b.cpdHours;
    } else {
      // Prefer comprehensive courses for advanced learners
      return b.cpdHours - a.cpdHours;
    }
  });
}

/**
 * Get courses by category
 */
export function getCoursesByCategory(category: string): CPDCourse[] {
  return CPD_COURSES.filter(course => course.category === category);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(CPD_COURSES.map(c => c.category));
  return Array.from(categories).sort();
}

/**
 * Search courses by keyword
 */
export function searchCourses(keyword: string): CPDCourse[] {
  const search = keyword.toLowerCase();
  return CPD_COURSES.filter(course => {
    const searchText = `${course.topic} ${course.category} ${course.learningOutcomes}`.toLowerCase();
    return searchText.includes(search);
  });
}

