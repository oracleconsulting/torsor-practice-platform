/**
 * Leadership Library to 111 Assessed Skills Mapping
 * Links each book to the specific skills from the RPGCC Skills Matrix
 * that the book helps develop
 */

export interface BookSkillMapping {
  book_id: string;
  core_assessed_skills: string[]; // From the 111 RPGCC skills
}

export const BOOK_SKILLS_MAPPING: BookSkillMapping[] = [
  {
    book_id: "001", // Traction
    core_assessed_skills: [
      "KPI Framework Design",
      "Performance Management",
      "Work Review & Feedback",
      "Delegation & Prioritisation",
      "Workflow Optimisation",
      "Problem Structuring",
      "Strategic Options Appraisal",
      "Profit Improvement Planning"
    ]
  },
  {
    book_id: "002", // Find Your Why
    core_assessed_skills: [
      "Strategic Options Appraisal",
      "365 Alignment Facilitation",
      "Empathy & EQ",
      "Influencing & Persuasion",
      "Active Listening",
      "Client Education",
      "Proactive Communication"
    ]
  },
  {
    book_id: "003", // Start With Why
    core_assessed_skills: [
      "Strategic Options Appraisal",
      "Business Model Analysis",
      "Influencing & Persuasion",
      "Advisory Selling",
      "Client Education",
      "Proactive Communication",
      "Board Presentation Skills"
    ]
  },
  {
    book_id: "004", // Leaders Eat Last
    core_assessed_skills: [
      "Work Review & Feedback",
      "Performance Management",
      "Empathy & EQ",
      "Conflict Resolution",
      "Succession Planning",
      "Resilience & Adaptability",
      "Client Retention Strategies",
      "Cultural Sensitivity"
    ]
  },
  {
    book_id: "005", // The Culture Code
    core_assessed_skills: [
      "Work Review & Feedback",
      "Innovation Leadership",
      "Conflict Resolution",
      "Empathy & EQ",
      "Client Retention Strategies",
      "Onboarding Excellence",
      "Training Design & Delivery"
    ]
  },
  {
    book_id: "006", // How to Be a Great Boss
    core_assessed_skills: [
      "Performance Management",
      "Work Review & Feedback",
      "Delegation & Prioritisation",
      "Expectation Management",
      "KPI Framework Design",
      "Proactive Communication",
      "Difficult Conversations"
    ]
  },
  {
    book_id: "007", // The Power of Discipline
    core_assessed_skills: [
      "Resilience & Adaptability",
      "Attention to Detail",
      "Problem Structuring",
      "Workflow Optimisation",
      "365 Alignment Facilitation"
    ]
  },
  {
    book_id: "008", // The Motive
    core_assessed_skills: [
      "Performance Management",
      "Work Review & Feedback",
      "Ethics & Integrity",
      "Succession Planning",
      "Difficult Conversations",
      "Advisory Selling"
    ]
  },
  {
    book_id: "009", // The Mountain Is You
    core_assessed_skills: [
      "Resilience & Adaptability",
      "Empathy & EQ",
      "Problem Structuring",
      "Unconscious Bias Awareness",
      "365 Alignment Facilitation"
    ]
  },
  {
    book_id: "010", // The Mind Manual
    core_assessed_skills: [
      "Resilience & Adaptability",
      "Empathy & EQ",
      "Attention to Detail",
      "Performance Management"
    ]
  },
  {
    book_id: "011", // Atomic Habits
    core_assessed_skills: [
      "Workflow Optimisation",
      "Performance Management",
      "Resilience & Adaptability",
      "365 Alignment Facilitation",
      "Innovation Leadership",
      "Attention to Detail"
    ]
  },
  {
    book_id: "012", // The 7 Habits
    core_assessed_skills: [
      "Performance Management",
      "Delegation & Prioritisation",
      "Proactive Communication",
      "Active Listening",
      "Problem Structuring",
      "Influencing & Persuasion",
      "Resilience & Adaptability",
      "365 Alignment Facilitation"
    ]
  },
  {
    book_id: "013", // 10% Happier
    core_assessed_skills: [
      "Resilience & Adaptability",
      "Empathy & EQ",
      "Active Listening",
      "Attention to Detail"
    ]
  },
  {
    book_id: "014", // Meditation for Fidgety Skeptics
    core_assessed_skills: [
      "Resilience & Adaptability",
      "Empathy & EQ",
      "Active Listening",
      "Attention to Detail"
    ]
  },
  {
    book_id: "015", // First, Break All the Rules
    core_assessed_skills: [
      "Performance Management",
      "Work Review & Feedback",
      "Training Design & Delivery",
      "Delegation & Prioritisation",
      "Client Retention Strategies",
      "Empathy & EQ"
    ]
  },
  {
    book_id: "016", // What the Heck Is EOS?
    core_assessed_skills: [
      "KPI Framework Design",
      "Performance Management",
      "Workflow Optimisation",
      "Problem Structuring",
      "Client Education"
    ]
  },
  {
    book_id: "017", // Get A Grip
    core_assessed_skills: [
      "KPI Framework Design",
      "Performance Management",
      "Strategic Options Appraisal",
      "Workflow Optimisation",
      "Delegation & Prioritisation"
    ]
  },
  {
    book_id: "018", // Radical Candor
    core_assessed_skills: [
      "Work Review & Feedback",
      "Difficult Conversations",
      "Empathy & EQ",
      "Active Listening",
      "Conflict Resolution",
      "Performance Management",
      "Proactive Communication"
    ]
  },
  {
    book_id: "019", // Rocket Fuel
    core_assessed_skills: [
      "Delegation & Prioritisation",
      "Succession Planning",
      "Strategic Options Appraisal",
      "Performance Management",
      "Conflict Resolution"
    ]
  },
  {
    book_id: "020", // Give and Take
    core_assessed_skills: [
      "Referral Generation",
      "Client Retention Strategies",
      "Influencing & Persuasion",
      "Cultural Sensitivity",
      "Empathy & EQ",
      "Advisory Selling"
    ]
  },
  {
    book_id: "021", // Radical Respect
    core_assessed_skills: [
      "Unconscious Bias Awareness",
      "Cultural Sensitivity",
      "Empathy & EQ",
      "Conflict Resolution",
      "Work Review & Feedback",
      "Ethics & Integrity"
    ]
  },
  {
    book_id: "022", // Originals
    core_assessed_skills: [
      "Innovation Leadership",
      "Problem Structuring",
      "Influencing & Persuasion",
      "Professional Scepticism",
      "Strategic Options Appraisal"
    ]
  },
  {
    book_id: "023", // The First 90 Days
    core_assessed_skills: [
      "Onboarding Excellence",
      "Delegation & Prioritisation",
      "Proactive Communication",
      "Expectation Management",
      "Strategic Options Appraisal",
      "Succession Planning"
    ]
  },
  {
    book_id: "024", // Built to Last
    core_assessed_skills: [
      "Strategic Options Appraisal",
      "Business Model Analysis",
      "Innovation Leadership",
      "Succession Planning",
      "365 Alignment Facilitation",
      "Ethics & Integrity"
    ]
  },
  {
    book_id: "025", // Good to Great
    core_assessed_skills: [
      "Strategic Options Appraisal",
      "Performance Management",
      "Delegation & Prioritisation",
      "KPI Framework Design",
      "Succession Planning",
      "Problem Structuring"
    ]
  },
  {
    book_id: "026", // Influence
    core_assessed_skills: [
      "Influencing & Persuasion",
      "Advisory Selling",
      "Board Presentation Skills",
      "Professional Scepticism",
      "Active Listening",
      "Ethics & Integrity"
    ]
  },
  {
    book_id: "027", // How to Win Friends
    core_assessed_skills: [
      "Empathy & EQ",
      "Active Listening",
      "Influencing & Persuasion",
      "Client Retention Strategies",
      "Proactive Communication",
      "Conflict Resolution",
      "Cultural Sensitivity"
    ]
  },
  {
    book_id: "028", // The Art of War for Executives
    core_assessed_skills: [
      "Strategic Options Appraisal",
      "Problem Structuring",
      "Professional Scepticism",
      "Commercial Thinking",
      "Scenario Planning"
    ]
  },
  {
    book_id: "029", // Will It Make the Boat Go Faster?
    core_assessed_skills: [
      "KPI Framework Design",
      "Performance Management",
      "365 Alignment Facilitation",
      "Workflow Optimisation",
      "Problem Structuring"
    ]
  },
  {
    book_id: "030", // Think and Grow Rich
    core_assessed_skills: [
      "365 Alignment Facilitation",
      "Resilience & Adaptability",
      "Influencing & Persuasion",
      "Strategic Options Appraisal",
      "Performance Management"
    ]
  }
];

// Helper function to get assessed skills for a book
export function getAssessedSkillsForBook(bookId: string): string[] {
  const mapping = BOOK_SKILLS_MAPPING.find(m => m.book_id === bookId);
  return mapping?.core_assessed_skills || [];
}

// Helper function to get books that teach a specific assessed skill
export function getBooksForAssessedSkill(skillName: string): string[] {
  return BOOK_SKILLS_MAPPING
    .filter(mapping => mapping.core_assessed_skills.includes(skillName))
    .map(mapping => mapping.book_id);
}

// Get all unique assessed skills covered by the library
export function getAllAssessedSkillsInLibrary(): string[] {
  const skillsSet = new Set<string>();
  BOOK_SKILLS_MAPPING.forEach(mapping => {
    mapping.core_assessed_skills.forEach(skill => skillsSet.add(skill));
  });
  return Array.from(skillsSet).sort();
}

