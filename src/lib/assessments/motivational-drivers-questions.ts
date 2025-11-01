/**
 * Motivational Drivers Assessment Questions
 * Based on motivational theory - identifies what drives and energizes individuals
 * 6 drivers: Achievement, Autonomy, Affiliation, Power, Security, Recognition
 */

export interface MotivationalQuestion {
  id: number;
  question: string;
  options: {
    text: string;
    value: string; // achievement, autonomy, affiliation, power, security, recognition
  }[];
}

export interface MotivationalProfile {
  primary_driver: string;
  secondary_driver: string;
  driver_scores: {
    achievement: number;
    autonomy: number;
    affiliation: number;
    power_influence: number;
    security: number;
    variety: number;
  };
  summary: string;
}

export const motivationalDriversQuestions: MotivationalQuestion[] = [
  {
    id: 1,
    question: "What motivates you most at work?",
    options: [
      { text: "Accomplishing challenging goals and exceeding targets", value: "achievement" },
      { text: "Having freedom to work independently and make my own decisions", value: "autonomy" },
      { text: "Building strong relationships and working with a great team", value: "affiliation" },
      { text: "Leading projects and influencing important decisions", value: "power_influence" },
      { text: "Having a stable job with predictable responsibilities", value: "security" },
      { text: "Experiencing diverse challenges and new opportunities", value: "variety" }
    ]
  },
  {
    id: 2,
    question: "When choosing a new project, what matters most?",
    options: [
      { text: "The opportunity to excel and demonstrate my capabilities", value: "achievement" },
      { text: "Having control over how I approach the work", value: "autonomy" },
      { text: "Collaborating with people I enjoy working with", value: "affiliation" },
      { text: "The chance to lead and make strategic decisions", value: "power_influence" },
      { text: "Clear structure and minimal risk", value: "security" },
      { text: "Trying something different and learning new skills", value: "variety" }
    ]
  },
  {
    id: 3,
    question: "What energizes you during your workday?",
    options: [
      { text: "Making progress toward ambitious objectives", value: "achievement" },
      { text: "Working without constant oversight or micromanagement", value: "autonomy" },
      { text: "Positive interactions and camaraderie with colleagues", value: "affiliation" },
      { text: "Influencing outcomes and driving change", value: "power_influence" },
      { text: "Knowing my position is stable and my role is clear", value: "security" },
      { text: "Tackling different types of work and avoiding monotony", value: "variety" }
    ]
  },
  {
    id: 4,
    question: "What frustrates you most at work?",
    options: [
      { text: "Not having challenging goals or opportunities to grow", value: "achievement" },
      { text: "Being told exactly how to do my work", value: "autonomy" },
      { text: "Working in isolation without team connection", value: "affiliation" },
      { text: "Not having a voice in important decisions", value: "power_influence" },
      { text: "Uncertainty about job stability or frequent changes", value: "security" },
      { text: "Repetitive work without variety or stimulation", value: "variety" }
    ]
  },
  {
    id: 5,
    question: "In performance reviews, what do you most want to hear?",
    options: [
      { text: "You've exceeded all targets and achieved exceptional results", value: "achievement" },
      { text: "You've shown great initiative and independence in your work", value: "autonomy" },
      { text: "You're a valued team member who enhances collaboration", value: "affiliation" },
      { text: "You've demonstrated strong leadership and influence", value: "power_influence" },
      { text: "Your work is consistently reliable and dependable", value: "security" },
      { text: "You bring fresh perspective and adapt well to change", value: "variety" }
    ]
  },
  {
    id: 6,
    question: "What type of reward would mean the most to you?",
    options: [
      { text: "A stretch assignment or promotion based on merit", value: "achievement" },
      { text: "More flexibility and control over my schedule", value: "autonomy" },
      { text: "A team celebration or social recognition", value: "affiliation" },
      { text: "Increased authority and decision-making power", value: "power_influence" },
      { text: "A long-term contract or permanent position", value: "security" },
      { text: "Opportunity to work on different projects or roles", value: "variety" }
    ]
  },
  {
    id: 7,
    question: "What makes you feel most fulfilled?",
    options: [
      { text: "Reaching difficult milestones and proving my capabilities", value: "achievement" },
      { text: "Being trusted to work in my own way", value: "autonomy" },
      { text: "Feeling connected and appreciated by my team", value: "affiliation" },
      { text: "Having impact on organizational direction", value: "power_influence" },
      { text: "Feeling confident about my future at the organization", value: "security" },
      { text: "Learning new skills and expanding my expertise", value: "variety" }
    ]
  },
  {
    id: 8,
    question: "When facing a challenge, what keeps you going?",
    options: [
      { text: "The satisfaction of overcoming obstacles", value: "achievement" },
      { text: "The freedom to try different approaches", value: "autonomy" },
      { text: "Support and encouragement from colleagues", value: "affiliation" },
      { text: "The opportunity to demonstrate leadership", value: "power_influence" },
      { text: "Knowing the challenge won't jeopardize my position", value: "security" },
      { text: "The novelty and opportunity to try something new", value: "variety" }
    ]
  },
  {
    id: 9,
    question: "What would make you consider leaving a job?",
    options: [
      { text: "Lack of growth opportunities or challenging work", value: "achievement" },
      { text: "Too much control or restrictive policies", value: "autonomy" },
      { text: "Poor team dynamics or toxic culture", value: "affiliation" },
      { text: "No opportunity to influence or lead", value: "power_influence" },
      { text: "Organizational instability or frequent restructuring", value: "security" },
      { text: "Monotonous work without change or innovation", value: "variety" }
    ]
  },
  {
    id: 10,
    question: "In your ideal work environment, what would be most important?",
    options: [
      { text: "High standards and opportunities for excellence", value: "achievement" },
      { text: "Trust and minimal bureaucracy", value: "autonomy" },
      { text: "Strong relationships and collaborative spirit", value: "affiliation" },
      { text: "Clear paths to leadership and influence", value: "power_influence" },
      { text: "Stability and predictable career progression", value: "security" },
      { text: "Diverse projects and continuous learning", value: "variety" }
    ]
  }
];

export function calculateMotivationalProfile(answers: Record<number, string>): MotivationalProfile {
  const scores = {
    achievement: 0,
    autonomy: 0,
    affiliation: 0,
    power_influence: 0,
    security: 0,
    variety: 0
  };

  // Count selections for each driver
  Object.values(answers).forEach(value => {
    if (value in scores) {
      scores[value as keyof typeof scores]++;
    }
  });

  // Sort drivers by score
  const sortedDrivers = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([driver]) => driver);

  const primary_driver = sortedDrivers[0];
  const secondary_driver = sortedDrivers[1];

  // Generate summary
  const driverDescriptions: Record<string, string> = {
    achievement: "You are driven by accomplishment and the pursuit of excellence. You thrive when setting and reaching ambitious goals.",
    autonomy: "You value independence and self-direction. You work best when trusted to make your own decisions and chart your own course.",
    affiliation: "You are motivated by relationships and belonging. You thrive in collaborative environments with strong team bonds.",
    power_influence: "You are energized by leadership and influence. You seek opportunities to shape outcomes and drive organizational direction.",
    security: "You value stability and predictability. You prefer clear structures and long-term security in your role.",
    variety: "You are motivated by change and diversity. You thrive when experiencing new challenges and learning opportunities."
  };

  const summary = `${driverDescriptions[primary_driver]} Your secondary motivator is ${secondary_driver.replace('_', ' ')}, which complements your primary drive.`;

  return {
    primary_driver,
    secondary_driver,
    driver_scores: scores,
    summary
  };
}
