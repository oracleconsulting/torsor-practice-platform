/**
 * Working Preferences Assessment
 * Measures how individuals prefer to work, communicate, and receive feedback
 */

export interface WorkingPreferencesQuestion {
  id: number;
  question: string;
  options: {
    text: string;
    value: string;
    score: number;
  }[];
  category: 'communication' | 'work_style' | 'environment' | 'feedback' | 'time_management' | 'collaboration';
}

export const workingPreferencesQuestions: WorkingPreferencesQuestion[] = [
  // Communication Preferences (3 questions)
  {
    id: 1,
    question: "How do you prefer to receive work-related information?",
    category: 'communication',
    options: [
      { text: "Face-to-face conversation", value: "face_to_face", score: 1 },
      { text: "Video calls", value: "video_call", score: 2 },
      { text: "Phone calls", value: "phone", score: 3 },
      { text: "Email", value: "email", score: 4 },
      { text: "Instant messaging (Slack, Teams)", value: "instant_message", score: 5 },
    ]
  },
  {
    id: 2,
    question: "When you have a complex issue to discuss, you prefer to:",
    category: 'communication',
    options: [
      { text: "Schedule a meeting to talk it through", value: "meeting", score: 1 },
      { text: "Send a detailed written explanation first, then discuss", value: "written_then_discuss", score: 2 },
      { text: "Send a written explanation and await written response", value: "written_only", score: 3 },
      { text: "Brainstorm verbally in real-time", value: "verbal_brainstorm", score: 4 },
    ]
  },
  {
    id: 3,
    question: "What's your expected response time for work messages?",
    category: 'communication',
    options: [
      { text: "Immediate (within 5-15 minutes)", value: "immediate", score: 1 },
      { text: "Within 1-2 hours", value: "hours", score: 2 },
      { text: "Same working day", value: "same_day", score: 3 },
      { text: "Within 24-48 hours", value: "next_day", score: 4 },
      { text: "When I have time to respond thoughtfully", value: "flexible", score: 5 },
    ]
  },

  // Work Style (3 questions)
  {
    id: 4,
    question: "When starting a new project, you prefer:",
    category: 'work_style',
    options: [
      { text: "A detailed plan mapped out from start to finish", value: "detailed_plan", score: 1 },
      { text: "Clear milestones with flexibility on how to reach them", value: "milestone_flexibility", score: 2 },
      { text: "General direction and freedom to figure it out as you go", value: "general_direction", score: 3 },
      { text: "Complete autonomy to define the approach", value: "full_autonomy", score: 4 },
    ]
  },
  {
    id: 5,
    question: "Your ideal work approach is:",
    category: 'work_style',
    options: [
      { text: "Deep focus on one task until completion", value: "single_task_deep", score: 1 },
      { text: "Work on 2-3 related tasks in parallel", value: "limited_multitask", score: 2 },
      { text: "Juggle multiple unrelated tasks throughout the day", value: "full_multitask", score: 3 },
      { text: "Mix of deep focus blocks and varied shorter tasks", value: "mixed_approach", score: 4 },
    ]
  },
  {
    id: 6,
    question: "When do you feel most productive?",
    category: 'time_management',
    options: [
      { text: "Early morning (6am-9am)", value: "early_morning", score: 1 },
      { text: "Mid-morning to lunch (9am-12pm)", value: "mid_morning", score: 2 },
      { text: "Afternoon (1pm-5pm)", value: "afternoon", score: 3 },
      { text: "Evening/night (after 6pm)", value: "evening", score: 4 },
      { text: "Varies day to day", value: "varies", score: 5 },
    ]
  },

  // Environment (2 questions)
  {
    id: 7,
    question: "What's your ideal work environment?",
    category: 'environment',
    options: [
      { text: "Quiet, private office/room", value: "quiet_private", score: 1 },
      { text: "Shared office with 2-3 people", value: "small_shared", score: 2 },
      { text: "Open office with team around", value: "open_office", score: 3 },
      { text: "Home office", value: "home", score: 4 },
      { text: "Flexible (coffee shops, co-working, etc.)", value: "flexible_location", score: 5 },
      { text: "Mix of office and remote", value: "hybrid", score: 6 },
    ]
  },
  {
    id: 8,
    question: "When working, you prefer:",
    category: 'environment',
    options: [
      { text: "Complete silence", value: "silence", score: 1 },
      { text: "Quiet background (white noise, nature sounds)", value: "quiet_background", score: 2 },
      { text: "Music (instrumental)", value: "instrumental_music", score: 3 },
      { text: "Music (with lyrics)", value: "lyrical_music", score: 4 },
      { text: "Background conversations/office buzz", value: "office_buzz", score: 5 },
    ]
  },

  // Feedback Preferences (2 questions)
  {
    id: 9,
    question: "How often do you want feedback from your manager?",
    category: 'feedback',
    options: [
      { text: "Daily check-ins", value: "daily", score: 1 },
      { text: "2-3 times per week", value: "frequent", score: 2 },
      { text: "Weekly one-on-ones", value: "weekly", score: 3 },
      { text: "Bi-weekly or monthly", value: "biweekly_monthly", score: 4 },
      { text: "Only when needed or requested", value: "as_needed", score: 5 },
    ]
  },
  {
    id: 10,
    question: "You prefer feedback to be:",
    category: 'feedback',
    options: [
      { text: "Direct and immediate, even if critical", value: "direct_immediate", score: 1 },
      { text: "Direct but delivered thoughtfully", value: "direct_thoughtful", score: 2 },
      { text: "Balanced with positives and areas for improvement", value: "balanced", score: 3 },
      { text: "Mostly positive with gentle suggestions", value: "gentle", score: 4 },
    ]
  },

  // Collaboration (3 questions)
  {
    id: 11,
    question: "When solving problems, you prefer to:",
    category: 'collaboration',
    options: [
      { text: "Work independently and present solutions", value: "independent_present", score: 1 },
      { text: "Collaborate throughout the entire process", value: "full_collaboration", score: 2 },
      { text: "Research alone, then collaborate on solutions", value: "research_then_collaborate", score: 3 },
      { text: "Collaborate to define the problem, then work independently", value: "define_then_independent", score: 4 },
    ]
  },
  {
    id: 12,
    question: "Your ideal team size for a project is:",
    category: 'collaboration',
    options: [
      { text: "Solo (work alone)", value: "solo", score: 1 },
      { text: "Pair (2 people)", value: "pair", score: 2 },
      { text: "Small team (3-5 people)", value: "small_team", score: 3 },
      { text: "Medium team (6-10 people)", value: "medium_team", score: 4 },
      { text: "Large team (10+ people)", value: "large_team", score: 5 },
    ]
  },
  {
    id: 13,
    question: "How do you handle deadlines?",
    category: 'time_management',
    options: [
      { text: "Start immediately and work steadily throughout", value: "steady_throughout", score: 1 },
      { text: "Plan early, execute in focused bursts", value: "planned_bursts", score: 2 },
      { text: "Work consistently with increased intensity near deadline", value: "consistent_intensify", score: 3 },
      { text: "Procrastinate strategically, deliver in final sprint", value: "strategic_procrastinate", score: 4 },
    ]
  },
];

export interface WorkingPreferencesProfile {
  communication_style: 'high_sync' | 'balanced' | 'async_preferred';
  communication_detail: string;
  work_style: 'structured' | 'flexible' | 'autonomous';
  work_style_detail: string;
  environment: 'quiet_focused' | 'social_collaborative' | 'flexible_adaptive';
  environment_detail: string;
  feedback_preference: 'frequent_direct' | 'regular_balanced' | 'autonomous_minimal';
  feedback_detail: string;
  collaboration_preference: 'independent' | 'collaborative' | 'mixed';
  collaboration_detail: string;
  time_management: 'early_planner' | 'steady_executor' | 'deadline_driven';
  time_management_detail: string;
  summary: string;
  preferences_raw: Record<string, any>;
}

export function calculateWorkingPreferences(answers: Record<number, string>): WorkingPreferencesProfile {
  const preferences: Record<string, any> = {};
  
  // Collect all answers by category
  workingPreferencesQuestions.forEach(q => {
    const answer = answers[q.id];
    if (answer) {
      const option = q.options.find(opt => opt.value === answer);
      if (option) {
        if (!preferences[q.category]) {
          preferences[q.category] = [];
        }
        preferences[q.category].push({
          question: q.question,
          answer: option.text,
          value: option.value,
          score: option.score
        });
      }
    }
  });

  // Calculate communication style
  const commAnswers = preferences.communication || [];
  const commAvg = commAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / commAnswers.length;
  let communication_style: 'high_sync' | 'balanced' | 'async_preferred';
  let communication_detail: string;
  
  if (commAvg <= 2) {
    communication_style = 'high_sync';
    communication_detail = 'Prefers synchronous, real-time communication (meetings, calls, face-to-face). Values immediate dialogue and quick responses.';
  } else if (commAvg <= 3.5) {
    communication_style = 'balanced';
    communication_detail = 'Comfortable with both synchronous and asynchronous communication. Adapts based on urgency and complexity.';
  } else {
    communication_style = 'async_preferred';
    communication_detail = 'Prefers asynchronous, written communication (email, documentation). Values time to think before responding.';
  }

  // Calculate work style
  const workAnswers = preferences.work_style || [];
  const workAvg = workAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / workAnswers.length;
  let work_style: 'structured' | 'flexible' | 'autonomous';
  let work_style_detail: string;
  
  if (workAvg <= 1.5) {
    work_style = 'structured';
    work_style_detail = 'Thrives with clear plans, defined processes, and structured approaches. Prefers detailed roadmaps.';
  } else if (workAvg <= 2.5) {
    work_style = 'flexible';
    work_style_detail = 'Balances structure with adaptability. Appreciates clear goals but wants flexibility in execution.';
  } else {
    work_style = 'autonomous';
    work_style_detail = 'Works best with autonomy and freedom. Prefers to define their own approach and work independently.';
  }

  // Calculate environment preference
  const envAnswers = preferences.environment || [];
  const envAvg = envAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / envAnswers.length;
  let environment: 'quiet_focused' | 'social_collaborative' | 'flexible_adaptive';
  let environment_detail: string;
  
  if (envAvg <= 2) {
    environment = 'quiet_focused';
    environment_detail = 'Needs quiet, focused environment with minimal distractions. Works best in private or quiet spaces.';
  } else if (envAvg <= 4) {
    environment = 'social_collaborative';
    environment_detail = 'Energized by collaborative spaces with team presence. Comfortable with background activity.';
  } else {
    environment = 'flexible_adaptive';
    environment_detail = 'Adaptable to various environments. Can work effectively in different settings (office, home, public spaces).';
  }

  // Calculate feedback preference
  const feedbackAnswers = preferences.feedback || [];
  const feedbackAvg = feedbackAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / feedbackAnswers.length;
  let feedback_preference: 'frequent_direct' | 'regular_balanced' | 'autonomous_minimal';
  let feedback_detail: string;
  
  if (feedbackAvg <= 2) {
    feedback_preference = 'frequent_direct';
    feedback_detail = 'Values frequent, direct feedback. Appreciates regular check-ins and immediate course correction.';
  } else if (feedbackAvg <= 3.5) {
    feedback_preference = 'regular_balanced';
    feedback_detail = 'Prefers regular feedback (weekly/bi-weekly) with balanced, thoughtful delivery.';
  } else {
    feedback_preference = 'autonomous_minimal';
    feedback_detail = 'Works best with minimal oversight. Prefers feedback only when needed or when they request it.';
  }

  // Calculate collaboration preference
  const collabAnswers = preferences.collaboration || [];
  const collabAvg = collabAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / collabAnswers.length;
  let collaboration_preference: 'independent' | 'collaborative' | 'mixed';
  let collaboration_detail: string;
  
  if (collabAvg <= 1.5) {
    collaboration_preference = 'independent';
    collaboration_detail = 'Prefers to work independently. Most productive with solo work and minimal team dependencies.';
  } else if (collabAvg <= 3) {
    collaboration_preference = 'collaborative';
    collaboration_detail = 'Thrives in collaborative environments. Energized by team interaction and joint problem-solving.';
  } else {
    collaboration_preference = 'mixed';
    collaboration_detail = 'Balances independent and collaborative work. Appreciates team input but also needs solo focus time.';
  }

  // Calculate time management style
  const timeAnswers = preferences.time_management || [];
  const timeAvg = timeAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / timeAnswers.length;
  let time_management: 'early_planner' | 'steady_executor' | 'deadline_driven';
  let time_management_detail: string;
  
  if (timeAvg <= 2) {
    time_management = 'early_planner';
    time_management_detail = 'Plans and starts early. Most productive in morning hours with steady progress throughout projects.';
  } else if (timeAvg <= 3) {
    time_management = 'steady_executor';
    time_management_detail = 'Maintains consistent progress. Works steadily with balanced pace throughout the timeline.';
  } else {
    time_management = 'deadline_driven';
    time_management_detail = 'Performs best under deadline pressure. Evening/flexible schedule with strategic procrastination.';
  }

  // Generate summary
  const summary = `${communication_style === 'high_sync' ? 'Real-time communicator' : communication_style === 'balanced' ? 'Flexible communicator' : 'Thoughtful, async communicator'} who thrives with ${work_style === 'structured' ? 'clear structure' : work_style === 'flexible' ? 'balanced guidance' : 'full autonomy'}. Works best in ${environment === 'quiet_focused' ? 'quiet, focused settings' : environment === 'social_collaborative' ? 'collaborative spaces' : 'flexible environments'}. Prefers ${feedback_preference === 'frequent_direct' ? 'frequent, direct feedback' : feedback_preference === 'regular_balanced' ? 'regular, balanced feedback' : 'minimal oversight'}. ${collaboration_preference === 'independent' ? 'Independent worker' : collaboration_preference === 'collaborative' ? 'Team collaborator' : 'Balances solo and team work'} with ${time_management === 'early_planner' ? 'early planning habits' : time_management === 'steady_executor' ? 'steady execution' : 'deadline-driven energy'}.`;

  return {
    communication_style,
    communication_detail,
    work_style,
    work_style_detail,
    environment,
    environment_detail,
    feedback_preference,
    feedback_detail,
    collaboration_preference,
    collaboration_detail,
    time_management,
    time_management_detail,
    summary,
    preferences_raw: preferences
  };
}

