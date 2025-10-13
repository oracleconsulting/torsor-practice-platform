/**
 * VARK Learning Styles Assessment Questions
 * 16-question assessment to determine Visual, Auditory, Read/Write, and Kinesthetic preferences
 */

export interface VARKOption {
  text: string;
  type: 'V' | 'A' | 'R' | 'K';
}

export interface VARKQuestion {
  id: number;
  question: string;
  options: VARKOption[];
}

export const varkQuestions: VARKQuestion[] = [
  {
    id: 1,
    question: "You need to learn how to use a new software application. You would prefer to:",
    options: [
      { text: "Watch a video tutorial showing someone using it", type: "V" },
      { text: "Listen to someone explain it or discuss it with them", type: "A" },
      { text: "Read the manual or written instructions", type: "R" },
      { text: "Start using it and figure it out by trial and error", type: "K" }
    ]
  },
  {
    id: 2,
    question: "You're planning a holiday trip for a group. You would:",
    options: [
      { text: "Look at maps, brochures, and websites with pictures", type: "V" },
      { text: "Call friends who've been there for recommendations", type: "A" },
      { text: "Read reviews and trip planning guides", type: "R" },
      { text: "Visit a travel agency to handle actual bookings", type: "K" }
    ]
  },
  {
    id: 3,
    question: "You need to remember an important date. You would:",
    options: [
      { text: "Visualize it on a calendar or create a mental image", type: "V" },
      { text: "Repeat it out loud several times", type: "A" },
      { text: "Write it down or add it to your notes", type: "R" },
      { text: "Associate it with a physical activity or event", type: "K" }
    ]
  },
  {
    id: 4,
    question: "You're trying to understand how something works. You prefer:",
    options: [
      { text: "Diagrams, charts, or visual demonstrations", type: "V" },
      { text: "Verbal explanations from an expert", type: "A" },
      { text: "Written reports or documentation", type: "R" },
      { text: "Taking it apart and examining it yourself", type: "K" }
    ]
  },
  {
    id: 5,
    question: "When giving someone directions, you would:",
    options: [
      { text: "Draw a map or describe landmarks they'll see", type: "V" },
      { text: "Explain verbally, step by step", type: "A" },
      { text: "Write down turn-by-turn instructions", type: "R" },
      { text: "Walk or drive with them to show the way", type: "K" }
    ]
  },
  {
    id: 6,
    question: "You want to improve your health. You would prefer to:",
    options: [
      { text: "Watch fitness videos or look at progress photos", type: "V" },
      { text: "Listen to health podcasts or talk to a trainer", type: "A" },
      { text: "Research diet plans and exercise routines online", type: "R" },
      { text: "Join a gym and start working out immediately", type: "K" }
    ]
  },
  {
    id: 7,
    question: "You're assembling furniture. You would first:",
    options: [
      { text: "Look at the diagrams and pictures", type: "V" },
      { text: "Call someone to talk you through it", type: "A" },
      { text: "Read through all the written instructions", type: "R" },
      { text: "Start putting pieces together to see what fits", type: "K" }
    ]
  },
  {
    id: 8,
    question: "You need to make an important decision. You would:",
    options: [
      { text: "Create visual pros and cons lists or mind maps", type: "V" },
      { text: "Talk it through with trusted advisors", type: "A" },
      { text: "Research and read about similar situations", type: "R" },
      { text: "Trust your gut feeling and physical reactions", type: "K" }
    ]
  },
  {
    id: 9,
    question: "You're learning a new skill at work. You learn best when:",
    options: [
      { text: "Watching demonstrations or viewing examples", type: "V" },
      { text: "Listening to explanations and asking questions", type: "A" },
      { text: "Reading documentation and taking notes", type: "R" },
      { text: "Practicing hands-on with real tasks", type: "K" }
    ]
  },
  {
    id: 10,
    question: "You want to learn about a historical event. You would prefer to:",
    options: [
      { text: "Watch a documentary with visual recreations", type: "V" },
      { text: "Listen to a podcast or audio narrative", type: "A" },
      { text: "Read books or articles about it", type: "R" },
      { text: "Visit a museum or historical site", type: "K" }
    ]
  },
  {
    id: 11,
    question: "You're trying to understand someone's emotions. You pay attention to:",
    options: [
      { text: "Their facial expressions and body language", type: "V" },
      { text: "Their tone of voice and what they say", type: "A" },
      { text: "The specific words they choose in messages", type: "R" },
      { text: "The energy and presence they bring to a room", type: "K" }
    ]
  },
  {
    id: 12,
    question: "You're preparing for a presentation. You would:",
    options: [
      { text: "Create visual slides with graphs and images", type: "V" },
      { text: "Practice speaking it out loud multiple times", type: "A" },
      { text: "Write out a detailed script or notes", type: "R" },
      { text: "Rehearse with props or in the actual space", type: "K" }
    ]
  },
  {
    id: 13,
    question: "You receive a new gadget as a gift. You would first:",
    options: [
      { text: "Look at it carefully and examine all its features", type: "V" },
      { text: "Ask someone to explain how it works", type: "A" },
      { text: "Read the instruction manual thoroughly", type: "R" },
      { text: "Start pressing buttons to see what happens", type: "K" }
    ]
  },
  {
    id: 14,
    question: "You're trying to reduce stress. You would most likely:",
    options: [
      { text: "Use visualization or meditation apps with imagery", type: "V" },
      { text: "Listen to calming music or talk to someone", type: "A" },
      { text: "Read self-help books or stress management guides", type: "R" },
      { text: "Exercise, walk, or do physical activities", type: "K" }
    ]
  },
  {
    id: 15,
    question: "You're at a conference or training event. You prefer sessions that:",
    options: [
      { text: "Use slides, videos, and visual demonstrations", type: "V" },
      { text: "Feature engaging speakers and group discussions", type: "A" },
      { text: "Provide handouts and detailed documentation", type: "R" },
      { text: "Include interactive workshops and hands-on activities", type: "K" }
    ]
  },
  {
    id: 16,
    question: "You need to memorize information for a test. You would:",
    options: [
      { text: "Create colorful flashcards or visual aids", type: "V" },
      { text: "Record yourself and listen to it repeatedly", type: "A" },
      { text: "Write and rewrite notes or summaries", type: "R" },
      { text: "Walk around while studying or use hand gestures", type: "K" }
    ]
  }
];

export interface VARKScores {
  visual: number;
  auditory: number;
  readWrite: number;
  kinesthetic: number;
}

export interface VARKProfile {
  scores: VARKScores;
  percentages: VARKScores;
  dominantStyles: string[];
  learningType: string;
  recommendations: RecommendationSet[];
}

export interface RecommendationSet {
  style: string;
  percentage: number;
  strategies: {
    learning: string[];
    mentoring: string[];
  };
}

export function calculateVARKProfile(responses: Array<{ questionId: number; type: 'V' | 'A' | 'R' | 'K' | null }>): VARKProfile {
  const scores: VARKScores = {
    visual: 0,
    auditory: 0,
    readWrite: 0,
    kinesthetic: 0
  };

  // Count responses
  const validResponses = responses.filter(r => r.type !== null);
  validResponses.forEach(response => {
    switch (response.type) {
      case 'V': scores.visual++; break;
      case 'A': scores.auditory++; break;
      case 'R': scores.readWrite++; break;
      case 'K': scores.kinesthetic++; break;
    }
  });

  // Calculate percentages
  const total = validResponses.length;
  const percentages: VARKScores = {
    visual: total > 0 ? Math.round((scores.visual / total) * 100) : 0,
    auditory: total > 0 ? Math.round((scores.auditory / total) * 100) : 0,
    readWrite: total > 0 ? Math.round((scores.readWrite / total) * 100) : 0,
    kinesthetic: total > 0 ? Math.round((scores.kinesthetic / total) * 100) : 0
  };

  // Determine dominant styles
  const maxScore = Math.max(...Object.values(scores));
  const dominantStyles = Object.entries(scores)
    .filter(([_, score]) => score === maxScore)
    .map(([style, _]) => style);

  // Classification
  let learningType = '';
  if (dominantStyles.length === 1) {
    learningType = 'Strong ' + dominantStyles[0].charAt(0).toUpperCase() + dominantStyles[0].slice(1);
  } else if (dominantStyles.length === 2) {
    learningType = 'Bimodal (' + dominantStyles.map(s => s.charAt(0).toUpperCase()).join(' + ') + ')';
  } else if (dominantStyles.length === 3) {
    learningType = 'Trimodal';
  } else {
    learningType = 'Multimodal (VARK)';
  }

  return {
    scores,
    percentages,
    dominantStyles,
    learningType,
    recommendations: generateRecommendations(percentages)
  };
}

function generateRecommendations(profile: VARKScores): RecommendationSet[] {
  const recommendations: Record<string, { learning: string[]; mentoring: string[] }> = {
    visual: {
      learning: [
        "Use diagrams, flowcharts, and mind maps",
        "Color-code notes and materials",
        "Watch video tutorials and demonstrations",
        "Create visual summaries and infographics",
        "Use whiteboards for brainstorming"
      ],
      mentoring: [
        "Share visual examples and case studies",
        "Use screen sharing for demonstrations",
        "Provide visual roadmaps and timelines",
        "Draw concepts while explaining"
      ]
    },
    auditory: {
      learning: [
        "Participate in group discussions",
        "Listen to podcasts and audio materials",
        "Read notes aloud when studying",
        "Use voice recordings for review",
        "Explain concepts to others verbally"
      ],
      mentoring: [
        "Schedule regular verbal check-ins",
        "Use storytelling to explain concepts",
        "Encourage questions and dialogue",
        "Provide verbal feedback frequently"
      ]
    },
    readWrite: {
      learning: [
        "Take detailed written notes",
        "Create written summaries and reports",
        "Read documentation thoroughly",
        "Keep learning journals",
        "Email questions for clarification"
      ],
      mentoring: [
        "Provide written feedback and comments",
        "Share detailed documentation",
        "Use email for complex explanations",
        "Create written action plans"
      ]
    },
    kinesthetic: {
      learning: [
        "Practice with real-world scenarios",
        "Take breaks to move around while learning",
        "Use hands-on simulations",
        "Learn by doing and experimenting",
        "Apply concepts immediately"
      ],
      mentoring: [
        "Provide hands-on practice opportunities",
        "Use role-playing exercises",
        "Walk through processes step-by-step",
        "Encourage trial and error learning"
      ]
    }
  };

  // Generate personalized recommendations based on profile
  const personalizedRecs: RecommendationSet[] = [];
  Object.entries(profile).forEach(([style, percentage]) => {
    if (percentage >= 25) { // Include if 25% or higher
      personalizedRecs.push({
        style: style.charAt(0).toUpperCase() + style.slice(1),
        percentage,
        strategies: recommendations[style]
      });
    }
  });

  return personalizedRecs.sort((a, b) => b.percentage - a.percentage);
}

export function getVARKIcon(style: string): string {
  const icons: Record<string, string> = {
    visual: '👁️',
    auditory: '👂',
    readWrite: '📝',
    kinesthetic: '🤚'
  };
  return icons[style.toLowerCase()] || '📚';
}

export function getVARKColor(style: string): string {
  const colors: Record<string, string> = {
    visual: 'blue',
    auditory: 'green',
    readWrite: 'purple',
    kinesthetic: 'orange'
  };
  return colors[style.toLowerCase()] || 'gray';
}

