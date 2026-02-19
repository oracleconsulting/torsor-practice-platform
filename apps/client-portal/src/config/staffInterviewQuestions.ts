// ============================================================================
// STAFF INTERVIEW QUESTION DEFINITIONS
// ============================================================================
// 15 questions across 4 sections, ~8 minutes to complete.
// Role-agnostic — works for developers, bookkeepers, account managers, admins.
// ============================================================================

export interface StaffInterviewQuestion {
  id: string;
  section: string;
  question: string;
  type: 'text' | 'single';
  options?: string[];
  placeholder?: string;
  charLimit?: number;
  emotionalAnchor?: string;
  required: boolean;
}

export const STAFF_INTERVIEW_SECTIONS = [
  'Your Daily Reality',
  'Your Tools',
  'Communication & Decisions',
  'If You Could Change One Thing',
] as const;

export const STAFF_INTERVIEW_QUESTIONS: StaffInterviewQuestion[] = [

  // ========================================================================
  // Section 1: Your Daily Reality (4 questions)
  // ========================================================================

  {
    id: 'staff_typical_day',
    section: 'Your Daily Reality',
    question: 'Walk me through a typical working day. What systems do you open, in what order, and what are you doing in each one?',
    type: 'text',
    placeholder: "e.g., I open Slack first to check messages, then Harvest to log yesterday's time, then Monday to see my tasks. After lunch I usually need to update the same info in the Google Sheet...",
    charLimit: 800,
    required: true,
  },
  {
    id: 'staff_time_wasters',
    section: 'Your Daily Reality',
    question: "What takes you way longer than it should? The task that makes you think 'there must be a better way to do this.'",
    type: 'text',
    placeholder: 'Be specific — which task, how long it takes, how long you think it should take...',
    charLimit: 800,
    emotionalAnchor: 'staff_time_frustration',
    required: true,
  },
  {
    id: 'staff_copy_paste',
    section: 'Your Daily Reality',
    question: 'How often do you copy information from one system to another, or type the same thing into multiple places?',
    type: 'single',
    options: [
      'Rarely — things flow automatically',
      'A few times a week — manageable',
      "Daily — it's part of my routine",
      'Constantly — I feel like a human copy-paste machine',
      "I've built my own workarounds to avoid it",
    ],
    required: true,
  },
  {
    id: 'staff_workarounds',
    section: 'Your Daily Reality',
    question: "What personal workarounds have you created? Spreadsheets, notes, browser bookmarks, calendar reminders, anything you do that isn't an official process.",
    type: 'text',
    placeholder: "e.g., I keep a personal spreadsheet to track which clients are profitable because I can't get that from the system. I set calendar reminders because the project tool doesn't notify me...",
    charLimit: 800,
    emotionalAnchor: 'staff_workarounds',
    required: false,
  },

  // ========================================================================
  // Section 2: Your Tools (4 questions)
  // ========================================================================

  {
    id: 'staff_best_tool',
    section: 'Your Tools',
    question: 'Which tool or system do you love using — the one that actually helps you do your job well?',
    type: 'text',
    placeholder: 'Name it and say why it works...',
    charLimit: 400,
    required: true,
  },
  {
    id: 'staff_worst_tool',
    section: 'Your Tools',
    question: 'Which tool or system do you dread — the one that makes your job harder?',
    type: 'text',
    placeholder: "Name it and say why it's painful...",
    charLimit: 400,
    emotionalAnchor: 'staff_worst_tool',
    required: true,
  },
  {
    id: 'staff_missing_tool',
    section: 'Your Tools',
    question: "Is there something you need that doesn't exist in any of your current systems? A report, a view, a notification, an automation?",
    type: 'text',
    placeholder: 'e.g., I wish I could see all my projects and their budgets in one place without opening 3 tabs. I wish I got a notification when a client invoice is overdue...',
    charLimit: 800,
    required: false,
  },
  {
    id: 'staff_training',
    section: 'Your Tools',
    question: 'For the systems you use, how did you learn them?',
    type: 'single',
    options: [
      'Proper training when I started',
      'A colleague showed me the basics',
      'I figured it out myself',
      "I still don't really know what I'm doing",
      'I only use the bits I need and ignore the rest',
    ],
    required: true,
  },

  // ========================================================================
  // Section 3: Communication & Decisions (3 questions)
  // ========================================================================

  {
    id: 'staff_information_gaps',
    section: 'Communication & Decisions',
    question: 'What information do you regularly need but struggle to get? Where do you go looking for it?',
    type: 'text',
    placeholder: "e.g., I need to know if a client is profitable before scoping new work, but I have to ask Maria and wait half a day. I need to know project status but have to check Monday AND the Google Sheet...",
    charLimit: 800,
    emotionalAnchor: 'staff_information_gaps',
    required: true,
  },
  {
    id: 'staff_communication_chaos',
    section: 'Communication & Decisions',
    question: 'Where do important decisions or updates get lost? Slack? Email? Meetings with no notes?',
    type: 'text',
    placeholder: "e.g., Client feedback gets agreed in Slack DMs but never makes it into Monday. We decide things in meetings but nobody updates the project board...",
    charLimit: 800,
    required: false,
  },
  {
    id: 'staff_bottlenecks',
    section: 'Communication & Decisions',
    question: 'Who or what do you regularly wait on? The approval, the information, the access that holds you up.',
    type: 'text',
    placeholder: "e.g., I wait for Sophie to approve proposals — sometimes 5+ days. I wait for Maria to give me budget numbers. I wait for Jake to review my code...",
    charLimit: 800,
    emotionalAnchor: 'staff_bottlenecks',
    required: true,
  },

  // ========================================================================
  // Section 4: If You Could Change One Thing (2 questions)
  // ========================================================================

  {
    id: 'staff_magic_fix',
    section: 'If You Could Change One Thing',
    question: 'If you could fix ONE thing about how the business operates — systems, processes, tools, anything — what would it be?',
    type: 'text',
    placeholder: 'The thing that would make the biggest difference to your working day...',
    charLimit: 800,
    emotionalAnchor: 'staff_magic_fix',
    required: true,
  },
  {
    id: 'staff_unheard',
    section: 'If You Could Change One Thing',
    question: "Is there anything about how you work that you think the leadership team doesn't fully understand or appreciate?",
    type: 'text',
    placeholder: "This is your chance to say the thing that doesn't come up in team meetings...",
    charLimit: 800,
    emotionalAnchor: 'staff_unheard',
    required: false,
  },
];

// Identity fields collected before questions
export interface StaffInterviewIdentity {
  staff_name?: string;
  role_title: string;
  department?: string;
  tenure: string;
}

export const STAFF_IDENTITY_FIELDS = {
  role_title: {
    label: 'Your role/job title',
    placeholder: 'e.g., Senior Developer, Office Manager, Account Director',
    required: true,
  },
  department: {
    label: 'Department or team (if applicable)',
    placeholder: 'e.g., Design, Finance, Delivery, Operations',
    required: false,
  },
  tenure: {
    label: 'How long have you been at the company?',
    placeholder: 'e.g., 2 years, 6 months, since day one',
    required: true,
  },
} as const;
