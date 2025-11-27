// ============================================================================
// PART 1: LIFE DESIGN ASSESSMENT (15 Questions)
// ============================================================================
// The conversational, one-at-a-time assessment that builds rapport and
// establishes the client's personal vision

export interface Part1Question {
  id: string;
  title: string;
  context: string;
  type: 'text' | 'email' | 'textarea' | 'radio' | 'checkbox' | 'multi-part';
  options?: string[];
  parts?: Array<{ id: string; label: string; type: string }>;
  hasOther?: boolean;
  otherLabel?: string;
  required?: boolean;
  conditional?: {
    dependsOn: string;
    showWhen: string | string[];
  };
}

export const part1Questions: Part1Question[] = [
  {
    id: 'tuesday_test',
    title: 'The Tuesday Test',
    context: 'Picture a random Tuesday 5 years from now. Walk me through your ideal day from waking up to going to bed. Be specific - what time do you wake up? What do you NOT do anymore?',
    type: 'textarea',
    required: true
  },
  {
    id: 'money_truth',
    title: 'The Money Truth',
    context: 'Two parts about your personal income (not business turnover):',
    type: 'multi-part',
    parts: [
      { id: 'current_income', label: 'A) What is your current personal take-home salary/pay per month?', type: 'text' },
      { id: 'desired_income', label: 'B) What personal monthly income would make you feel genuinely secure and free?', type: 'text' }
    ],
    required: true
  },
  {
    id: 'business_turnover',
    title: 'The Business Reality',
    context: 'Now about your business financials (separate from your personal salary):',
    type: 'multi-part',
    parts: [
      { id: 'current_turnover', label: 'A) What is your current annual business turnover/revenue?', type: 'text' },
      { id: 'target_turnover', label: 'B) What annual turnover do you think would enable you to live the life you want?', type: 'text' }
    ],
    required: true
  },
  {
    id: 'emergency_log',
    title: 'The Emergency Log',
    context: "Think about the last month. List the 'emergencies' that pulled you away from important work (the 2am calls, the 'only you can fix this' moments)",
    type: 'textarea',
    required: true
  },
  {
    id: 'relationship_mirror',
    title: 'The Relationship Mirror',
    context: "Complete this sentence: 'My business relationship feels like...' (a bad marriage I can't leave? a needy child? a puzzle I'm solving? something else?)",
    type: 'textarea',
    required: true
  },
  {
    id: 'sacrifices',
    title: 'The Sacrifice List',
    context: 'What have you given up or put on hold because of your business? (Check all that apply)',
    type: 'checkbox',
    options: [
      'Starting/growing a family',
      'Hobbies I used to love',
      'Fitness and health',
      'Friendships',
      'Travel and adventure',
      'Sleep and rest',
      'Relationship with partner',
      'Other...'
    ],
    hasOther: true,
    otherLabel: 'If other, please break it down...',
    required: true
  },
  {
    id: 'skills_confession',
    title: 'The Skills Confession',
    context: "If you had to hire someone tomorrow to handle the part of your business you're WORST at, what would their job title be?",
    type: 'text',
    required: true
  },
  {
    id: 'ninety_day_fantasy',
    title: 'The 90-Day Fantasy',
    context: "If I guaranteed your business wouldn't collapse, what would you do with the next 90 days?",
    type: 'textarea',
    required: true
  },
  {
    id: 'danger_zone',
    title: 'The Danger Zone',
    context: "What's the one thing that if it broke tomorrow would sink your business?",
    type: 'radio',
    options: [
      'Cash running out',
      'Key person leaving',
      'Major client walking',
      'System/tech failure',
      'Legal/compliance issue',
      'Quality/reputation crisis',
      'Other...'
    ],
    hasOther: true,
    otherLabel: 'If other, please break it down...',
    required: true
  },
  {
    id: 'growth_trap',
    title: 'The Growth Trap',
    context: "Finish this thought: 'I'd grow faster if only...'",
    type: 'checkbox',
    options: [
      'I could trust someone else with quality',
      'I understood my numbers better',
      'I had more hours in the day',
      'I knew which customers to target',
      'I had better systems and processes',
      'I could afford the right people',
      'Other...'
    ],
    hasOther: true,
    otherLabel: 'If other, please break it down...',
    required: true
  },
  {
    id: 'commitment_hours',
    title: 'The Commitment Question',
    context: 'How many hours per week could you realistically dedicate to building a business that runs without you? (Be honest - we\'ll build a plan that actually fits your life)',
    type: 'radio',
    options: [
      'Less than 5 hours',
      '5-10 hours',
      '10-15 hours',
      '15 hours +'
    ],
    required: true
  },
  {
    id: 'full_name',
    title: 'Full Name',
    context: 'How should we address you in your personalised results?',
    type: 'text',
    required: true
  },
  {
    id: 'company_name',
    title: 'Company Name',
    context: 'What\'s the name of your business?',
    type: 'text',
    required: true
  },
  {
    id: 'has_partners',
    title: 'Do you have any business partners you\'d like to invite?',
    context: 'If yes, we can send them a separate assessment to get their perspective too.',
    type: 'radio',
    options: ['Yes', 'No'],
    required: true
  },
  {
    id: 'partner_emails',
    title: 'Partner Emails',
    context: 'Please enter their email(s) below - (supports comma-separated emails)',
    type: 'text',
    required: false,
    conditional: {
      dependsOn: 'has_partners',
      showWhen: 'Yes'
    }
  }
];

export const PART1_TOTAL_QUESTIONS = part1Questions.length;

