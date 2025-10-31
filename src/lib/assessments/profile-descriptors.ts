/**
 * Profile Descriptors Library
 * Rich, narrative descriptions for each assessment dimension
 * Based on: Assessment Profile Descriptors & Integration Framework
 */

// =====================================================
// Working Preferences Profiles
// =====================================================

export const workingPreferencesDescriptors = {
  communication_style: {
    'real-time': {
      title: 'High-Sync Communicator',
      narrative: "You're the person who lights up during face-to-face conversations. Ideas flow best when you can bounce them off others in real-time, reading the room and building on energy as it happens. You think out loud, and that's brilliant – your collaborative approach often sparks innovations that would never emerge from solitary contemplation.",
      superpower: 'Creating immediate connection and momentum. You turn meetings into creative workshops without even trying.',
      worthKnowing: "Sometimes your best insights might come after stepping away from the conversation buzz. Consider capturing those post-meeting 'aha' moments when they strike."
    },
    'adaptable': {
      title: 'Balanced Communicator',
      narrative: "You're fluent in all languages of workplace communication – equally comfortable with a quick chat or a thoughtful email. This flexibility makes you invaluable as a bridge between different working styles. You instinctively know when to pick up the phone and when to send that detailed document.",
      superpower: "Reading the room and adapting your approach. You're the universal translator of team communication.",
      worthKnowing: "Your adaptability is a gift, but remember it's okay to express your own preferences too. Others appreciate knowing what works best for you."
    },
    'written': {
      title: 'Async-Focused Communicator',
      narrative: "You craft your thoughts best when you have space to think them through. Your emails are clear, your documentation is thorough, and you appreciate the paper trail that written communication provides. You give others the gift of considered responses rather than off-the-cuff reactions.",
      superpower: "Creating clarity through thoughtful communication. Your written words often become the team's reference point.",
      worthKnowing: 'While written communication is your strength, occasionally jumping into spontaneous conversations can build relationships in unexpected ways.'
    }
  },
  
  work_style: {
    'independent': {
      title: 'Autonomous Worker',
      narrative: "You're at your best when trusted with the destination and left to chart your own course. Rules and rigid processes feel like unnecessary speed bumps on your road to excellence. You've got an internal compass that rarely steers you wrong, and micromanagement is your kryptonite.",
      superpower: "Self-direction and ownership. You don't just complete tasks; you own outcomes.",
      worthKnowing: "Your independence is powerful, but occasionally syncing with others ensures everyone's heading in the same direction. Think of it as GPS recalibration rather than asking for directions."
    },
    'process-oriented': {
      title: 'Structured Worker',
      narrative: "You appreciate the elegance of a well-designed system. Clear processes aren't constraints to you – they're the scaffolding that lets you build something remarkable. You know that consistency creates excellence, and you help teams establish the rhythms that lead to success.",
      superpower: 'Creating repeatable excellence. You turn chaos into calm productivity.',
      worthKnowing: 'Your love of structure serves you well, but remember that some of the best discoveries happen when we colour outside the lines occasionally.'
    },
    'adaptive': {
      title: 'Flexible Worker',
      narrative: "You dance between structure and spontaneity with ease. Some days call for detailed planning, others for intuitive leaps – and you're equally comfortable with both. This adaptability makes you incredibly resilient when projects shift or priorities change.",
      superpower: "Thriving in change. You're the calm in the centre of any organisational storm.",
      worthKnowing: 'Your flexibility is an asset, but setting some personal non-negotiables helps maintain your own rhythm amidst the adaptation.'
    }
  },
  
  environment: {
    'quiet-focused': {
      title: 'Deep Work Specialist',
      narrative: "You do your best thinking in the quiet spaces. Not because you're antisocial, but because your mind needs room to roam without interruption. In silence, you solve problems others don't even see yet. You're the one who emerges from deep focus with the solution everyone's been searching for.",
      superpower: 'Sustained concentration that produces exceptional quality work.',
      worthKnowing: 'While quiet is your productivity zone, brief social interludes can actually refresh your focus. Think of them as mental sorbet between courses.'
    },
    'social-collaborative': {
      title: 'Team Energiser',
      narrative: "The buzz of a busy office is your creative fuel. You think better when surrounded by the energy of others, and isolation can feel like working with the lights off. Collaboration isn't just how you work – it's how you recharge.",
      superpower: 'Transforming group energy into collective achievement. You make the whole greater than the sum of its parts.',
      worthKnowing: "Your collaborative nature is a gift to any team, but protecting some quiet time ensures you're bringing your best self to those group moments."
    },
    'hybrid-flexible': {
      title: 'Environment Agnostic',
      narrative: "Office? Home? Coffee shop? You're productive anywhere. This adaptability isn't indifference – it's a sophisticated ability to tune your environment to match your task. You're equally at home in solitude or surrounded by activity.",
      superpower: 'Location independence. You carry your productivity zone with you.',
      worthKnowing: 'Your adaptability is remarkable, but having one consistent workspace anchor can provide grounding when everything else is in flux.'
    }
  },
  
  time_management: {
    'steady-executor': {
      title: 'Marathon Runner',
      narrative: "You start when others are still planning and maintain a pace that would exhaust most sprinters. Slow and steady doesn't win the race for you – consistent and thoughtful does. You're the teammate everyone can count on to deliver quality without the last-minute drama.",
      superpower: 'Sustainable excellence. You deliver consistently without the burnout.',
      worthKnowing: 'Your steady approach is admirable, but occasionally embracing a sprint can be exhilarating and might unlock new capabilities.'
    },
    'burst-worker': {
      title: 'Sprint Specialist',
      narrative: "You work in powerful bursts of intense focus. While others spread their energy evenly, you know how to marshal your resources for maximum impact. Those bursts of productivity aren't procrastination – they're your creative process at work.",
      superpower: 'Intense focus that produces remarkable results in concentrated timeframes.',
      worthKnowing: 'Your burst style works brilliantly, but building in recovery time between sprints keeps your energy sustainable.'
    },
    'deadline-driven': {
      title: 'Deadline Whisperer',
      narrative: "You've turned what others call procrastination into an art form. That time before the deadline isn't wasted – your subconscious is processing, synthesising, preparing. When you finally act, it's with clarity and decisiveness that comes from that incubation period.",
      superpower: 'Pressure-powered performance. You transform deadlines from stress into fuel.',
      worthKnowing: 'Your approach works for you, but keeping stakeholders informed about your process helps them trust the magic that happens at the eleventh hour.'
    }
  },
  
  feedback_preference: {
    'immediate-direct': {
      title: 'Fast Iterator',
      narrative: "You want feedback like you want your coffee – strong and immediate. Why wait for a quarterly review when you could course-correct today? This hunger for real-time input isn't neediness; it's efficiency. You'd rather know now than wonder later.",
      superpower: "Rapid improvement cycles. You evolve faster than most because you're always adjusting.",
      worthKnowing: 'Your appetite for immediate feedback is valuable, but sometimes patterns only emerge over time. A bit of patience can reveal deeper insights.'
    },
    'regular-balanced': {
      title: 'Systematic Improver',
      narrative: "You appreciate the rhythm of regular feedback – not too frequent to be overwhelming, not too sparse to lose relevance. This balanced approach lets you digest feedback properly and implement changes thoughtfully.",
      superpower: 'Steady progression. You turn feedback into lasting improvement rather than reactive changes.',
      worthKnowing: "Your measured approach to feedback is wise, but don't hesitate to ask for input when you need it outside the regular schedule."
    },
    'positive-focused': {
      title: 'Recognition-Driven',
      narrative: "You bloom under appreciation. This isn't about needing constant praise – it's about being motivated by acknowledgment of progress and effort. Positive reinforcement doesn't just make you feel good; it makes you perform better.",
      superpower: 'Turning encouragement into excellence. You multiply positive energy into exceptional results.',
      worthKnowing: 'Your response to positive feedback is a strength, but remember that constructive feedback, even when less comfortable, often contains the seeds of your next breakthrough.'
    }
  },
  
  collaboration_preference: {
    'independent': {
      title: 'Solo Contributor',
      narrative: "You do your best work in your own space, at your own pace. This isn't antisocial – it's knowing that your deepest thinking happens without the need to explain your process as you go. You contribute best by going deep, then sharing the results.",
      superpower: 'Deep, uninterrupted thinking that produces thoroughly considered solutions.',
      worthKnowing: 'Your solo work is valuable, but occasionally thinking out loud with others can unlock perspectives you might not reach alone.'
    },
    'collaborative': {
      title: 'Team Player',
      narrative: "You believe the best work happens when minds meet. For you, collaboration isn't just about dividing tasks – it's about multiplying possibilities. The energy of working together fuels your creativity and commitment.",
      superpower: 'Catalysing collective brilliance. You help teams achieve what individuals never could.',
      worthKnowing: "Your collaborative spirit enriches any team, but protecting some solo time ensures you're bringing your own unique perspective to the mix."
    },
    'flexible-hybrid': {
      title: 'Collaboration Adaptive',
      narrative: "You seamlessly shift between solo deep dives and team brainstorms. This isn't indecision – it's sophisticated situational awareness. You know when to go it alone and when to gather the troops.",
      superpower: 'Collaboration intelligence. You instinctively know the right approach for each challenge.',
      worthKnowing: 'Your flexibility serves you well, but being clear about when you need which mode helps others work with you most effectively.'
    }
  }
};

// =====================================================
// Belbin Team Roles Profiles
// =====================================================

export const belbinRoleDescriptors = {
  'plant': {
    title: 'The Innovator',
    narrative: "You see possibilities where others see problems. Your mind makes connections that seem obvious once you explain them but revolutionary before you do. You're not being difficult when you challenge conventional thinking – you literally can't help seeing alternatives.",
    gift: "The spark of innovation that prevents stagnation. You ensure teams never settle for 'good enough.'",
    growingEdge: 'Your brilliant ideas deserve brilliant execution. Partnering with implementers turns your visions into reality.'
  },
  'monitor evaluator': {
    title: 'The Analyst',
    narrative: "You see through the enthusiasm to the reality beneath. This isn't pessimism – it's the valuable ability to spot the cracks others miss in their excitement. Your careful analysis has saved countless projects from beautiful disasters.",
    gift: "The voice of reason that prevents costly mistakes. You're the quality control for team decisions.",
    growingEdge: "Your analysis is invaluable, but remember that sometimes 'good enough now' beats 'perfect later.'"
  },
  'specialist': {
    title: 'The Expert',
    narrative: "You've gone deeper into your field than most people know is possible. This isn't narrow-mindedness – it's the dedication that produces mastery. When others need the definitive answer, they come to you.",
    gift: "Unmatched expertise that solves the unsolvable. You're the team's secret weapon in your domain.",
    growingEdge: 'Your depth is remarkable, but occasionally surfacing to see the broader landscape enriches your expertise even further.'
  },
  'coordinator': {
    title: 'The Leader',
    narrative: "You see the chess board when others see only pieces. Leadership for you isn't about being the loudest voice – it's about helping every voice find its moment. You orchestrate without dominating.",
    gift: "Clarity and direction. You help teams remember why they're here and where they're going.",
    growingEdge: "Your coordination skills are exceptional, but remember that sometimes the best leadership is following someone else's lead."
  },
  'teamworker': {
    title: 'The Harmoniser',
    narrative: "You're the oil that keeps the team machine running smoothly. This isn't weakness or conflict avoidance – it's the sophisticated understanding that relationship quality determines output quality. You build bridges others don't even know are needed.",
    gift: 'Cohesion and trust. You transform groups of individuals into genuine teams.',
    growingEdge: 'Your diplomatic skills are precious, but remember that some conflicts, respectfully handled, lead to breakthrough innovations.'
  },
  'resource investigator': {
    title: 'The Explorer',
    narrative: "You're plugged into networks others don't even know exist. Your enthusiasm isn't just personality – it's the energy that opens doors and builds connections. You turn conversations into opportunities.",
    gift: 'External perspective and resources. You prevent teams from becoming echo chambers.',
    growingEdge: 'Your enthusiasm opens many doors, but following through to completion multiplies your impact.'
  },
  'shaper': {
    title: 'The Driver',
    narrative: "You've got an urgency others might find intense, but it's what gets things moving. You're not being pushy – you're allergic to inertia. When teams get stuck, you're the unsticking force.",
    gift: 'Momentum and achievement. You turn plans into progress.',
    growingEdge: 'Your drive is powerful, but remember that sometimes people need to catch their breath to give their best.'
  },
  'implementer': {
    title: 'The Doer',
    narrative: "You turn talk into action, plans into progress. This isn't lack of imagination – it's the rare ability to bridge the gap between idea and reality. You're why projects actually ship.",
    gift: 'Practical achievement. You transform vision into value.',
    growingEdge: 'Your implementation skills are crucial, but staying open to mid-course adjustments keeps your execution excellent.'
  },
  'completer finisher': {
    title: 'The Perfectionist',
    narrative: "You see the details others miss and care about quality others might compromise. This isn't obsession – it's the standard of excellence that distinguishes good from great. You're why the team's work stands up to scrutiny.",
    gift: "Excellence and reliability. You ensure the team's reputation remains stellar.",
    growingEdge: 'Your high standards elevate everything, but remember that perfect is often the enemy of done.'
  }
};

// =====================================================
// Motivational Drivers Profiles
// =====================================================

export const motivationalDriverDescriptors = {
  'achievement': {
    title: 'Achievement-Driven',
    narrative: "You're wired for excellence. Not because you need to prove anything, but because mediocrity feels like wearing shoes that don't fit. You set high bars not to stress yourself but because reaching them is how you feel truly alive.",
    energiser: 'The pursuit of mastery and the satisfaction of exceeding expectations.',
    growthEdge: 'Excellence is your standard, but remember that sustainable high performance includes strategic recovery.'
  },
  'autonomy': {
    title: 'Autonomy-Driven',
    narrative: "Freedom isn't just nice to have for you – it's oxygen. You work best when trusted with outcomes rather than supervised through processes. This isn't rebellion; it's knowing that your best work emerges when you can follow your instincts.",
    energiser: 'The space to innovate and the trust to deliver in your own way.',
    growthEdge: 'Your independence is powerful, but occasionally accepting support multiplies rather than diminishes your autonomy.'
  },
  'affiliation': {
    title: 'Affiliation-Driven',
    narrative: "You understand that work is fundamentally about people. Tasks are just the excuse for human connection and collaboration. You don't just want colleagues; you want comrades. Work without relationship feels hollow to you.",
    energiser: 'The bonds you build and the collective achievements you share.',
    growthEdge: 'Your relational focus enriches any workplace, but remember that sometimes maintaining professional boundaries protects the relationships you value.'
  },
  'influence': {
    title: 'Influence-Driven',
    narrative: "You're drawn to the levers of change. Not from ego, but from knowing you can make things better if given the chance. Leadership isn't about power for you – it's about impact. You see what could be and want to help make it happen.",
    energiser: 'The ability to shape outcomes and guide others toward shared success.',
    growthEdge: 'Your leadership instincts are valuable, but remember that sometimes the greatest influence comes from empowering others to lead.'
  },
  'security': {
    title: 'Security-Driven',
    narrative: "You appreciate stability because it lets you do your best work without distraction. This isn't fear of change – it's understanding that sustainable excellence needs solid foundations. You build your career like a craftsperson, not a gambler.",
    energiser: 'Clear expectations and the confidence that comes from predictability.',
    growthEdge: 'Your appreciation for stability serves you well, but remember that calculated risks often lead to the security you seek.'
  },
  'recognition': {
    title: 'Recognition-Driven',
    narrative: "You light up when your work is seen and valued. This isn't vanity – it's understanding that acknowledgment is the fuel for continued excellence. You don't just want to do good work; you want that work to matter to others.",
    energiser: 'The validation that your contributions make a difference.',
    growthEdge: "Your responsiveness to recognition is a strength, but developing internal metrics for success ensures you're not dependent on external validation alone."
  }
};

// =====================================================
// EQ Level Descriptors
// =====================================================

export const eqLevelDescriptors = {
  self_awareness: {
    high: {
      title: 'Emotionally Attuned',
      narrative: "You've developed a sophisticated internal radar. You don't just feel emotions; you understand them as they happen. This awareness isn't navel-gazing – it's the foundation of all emotional intelligence. You know your patterns, triggers, and tendencies.",
      strength: 'Making conscious choices rather than emotional reactions.',
      growingEdge: 'Your self-awareness is exceptional; sharing these insights helps others develop their own.'
    },
    moderate: {
      title: 'Developing Awareness',
      narrative: "You're building your emotional vocabulary and starting to recognise patterns. Sometimes emotions surprise you, but increasingly you're catching them in real-time. You're on the journey from feeling to understanding.",
      strength: 'Growing consciousness of your emotional landscape.',
      growingEdge: 'Regular reflection and mindfulness practice will accelerate your awareness development.'
    },
    developing: {
      title: 'Awareness Opportunity',
      narrative: "Emotions often feel like weather that happens to you rather than internal experiences you can understand. This isn't a flaw – it's simply an underdeveloped skill that can transform your personal and professional life.",
      strength: 'Significant room for impactful growth.',
      growingEdge: 'Starting with basic emotion labelling and daily check-ins builds this crucial foundation.'
    }
  },
  self_management: {
    high: {
      title: 'Emotional Master',
      narrative: "You've learned to surf emotional waves rather than be swept away by them. Stress might visit, but it doesn't move in. You've developed the rare ability to feel fully while choosing consciously.",
      strength: 'Maintaining equilibrium even in emotional storms.',
      growingEdge: 'Your regulation skills could help others; consider mentoring those still developing this capacity.'
    },
    moderate: {
      title: 'Managing Well',
      narrative: "You've got good emotional shock absorbers, though sometimes you hit bumps that rattle you. You're learning the difference between suppressing emotions and managing them constructively.",
      strength: 'Growing ability to stay centered under pressure.',
      growingEdge: 'Expanding your toolkit of regulation strategies gives you more options in challenging moments.'
    },
    developing: {
      title: 'Management Growth Area',
      narrative: "Emotions sometimes drive the car when you'd prefer to be steering. This isn't weakness – it's an opportunity to develop one of the most valuable professional skills available.",
      strength: 'Authentic emotional experience that, once channeled, becomes powerful.',
      growingEdge: 'Simple breathing techniques and pause practices can begin transforming reactive patterns.'
    }
  },
  social_awareness: {
    high: {
      title: 'People Reader',
      narrative: "You pick up on emotional undercurrents others miss entirely. This isn't mind-reading – it's highly developed pattern recognition applied to human behaviour. You often understand what's not being said.",
      strength: 'Navigating complex social dynamics with grace.',
      growingEdge: "Your perceptiveness is remarkable; be mindful not to assume your reads are always accurate."
    },
    moderate: {
      title: 'Socially Conscious',
      narrative: "You're developing your ability to read the room. Sometimes you miss subtle cues, but increasingly you're noticing the emotional dynamics that shape interactions. You're building your social sensitivity.",
      strength: "Growing awareness of others' emotional states.",
      growingEdge: 'Practicing active observation without judgment deepens your social awareness.'
    },
    developing: {
      title: 'Social Awareness Opportunity',
      narrative: "The emotional dynamics of groups might feel mysterious or overwhelming. This isn't social inadequacy – it's an underdeveloped sense that can be strengthened with practice and attention.",
      strength: 'Room for significant relationship improvement.',
      growingEdge: 'Starting with one-on-one awareness before tackling group dynamics builds confidence.'
    }
  },
  relationship_management: {
    high: {
      title: 'Relationship Architect',
      narrative: "You don't just maintain relationships; you cultivate them. Conflict doesn't scare you because you know how to navigate it constructively. You build bridges that last.",
      strength: 'Creating and sustaining meaningful professional connections.',
      growingEdge: "Your relationship skills are exceptional; ensure you're also maintaining boundaries."
    },
    moderate: {
      title: 'Building Connections',
      narrative: "You're developing your ability to build and sustain professional relationships. Some interactions flow naturally while others require more effort. You're learning the art of professional intimacy.",
      strength: 'Growing ability to foster positive relationships.',
      growingEdge: 'Practicing difficult conversations in low-stakes situations builds confidence.'
    },
    developing: {
      title: 'Relationship Growth Area',
      narrative: "Professional relationships might feel complicated or draining. This isn't personal failure – it's an opportunity to develop skills that will transform your work experience.",
      strength: 'Significant potential for connection improvement.',
      growingEdge: 'Starting with one strong professional relationship provides a template for others.'
    }
  }
};

// =====================================================
// Conflict Style Descriptors
// =====================================================

export const conflictStyleDescriptors = {
  'competing': {
    title: 'The Competitor',
    narrative: "You don't shy away from standing your ground. This isn't aggression – it's clarity about what matters and willingness to fight for it. You understand that sometimes being nice prevents being effective.",
    power: 'Decisive action when stakes are high.',
    growthEdge: 'Your strength is valuable, but choosing your battles multiplies your impact.'
  },
  'collaborating': {
    title: 'The Collaborator',
    narrative: "You believe every conflict holds the seeds of innovation. You don't just resolve disputes; you transform them into opportunities for breakthrough solutions. You're willing to do the work that turns opposition into alliance.",
    power: 'Creating solutions that everyone can champion.',
    growthEdge: 'Your collaborative approach is admirable, but remember that not every conflict deserves the investment collaboration requires.'
  },
  'compromising': {
    title: 'The Compromiser',
    narrative: "You're the pragmatist who keeps things moving. Perfect solutions that never ship are less valuable than good solutions that do. You understand that progress often requires everyone to give a little.",
    power: 'Finding workable solutions quickly.',
    growthEdge: "Your pragmatism serves you well, but ensure you're not consistently compromising on things that truly matter."
  },
  'avoiding': {
    title: 'The Avoider',
    narrative: "You pick your battles with extreme discretion. This isn't cowardice – it's conservation of energy for conflicts that truly matter. You understand that many disputes resolve themselves if given space.",
    power: 'Strategic disengagement that prevents escalation.',
    growthEdge: "Your selective engagement is wise, but ensuring important issues don't go unaddressed multiplies your effectiveness."
  },
  'accommodating': {
    title: 'The Accommodator',
    narrative: "You understand that relationships often matter more than being right. This isn't weakness – it's sophisticated understanding of long-term success factors. You build credit that pays dividends later.",
    power: 'Building goodwill and maintaining harmony.',
    growthEdge: 'Your generosity enriches relationships, but ensuring your own needs are met sustains your ability to give.'
  }
};

// =====================================================
// Helper Functions
// =====================================================

export function getEQLevel(score: number): 'high' | 'moderate' | 'developing' {
  if (score >= 70) return 'high';
  if (score >= 55) return 'moderate';
  return 'developing';
}

export function getWorkingPreferenceDescriptor(
  dimension: keyof typeof workingPreferencesDescriptors,
  value: string
) {
  return workingPreferencesDescriptors[dimension]?.[value];
}

export function getBelbinDescriptor(role: string) {
  return belbinRoleDescriptors[role.toLowerCase()];
}

export function getMotivationalDescriptor(driver: string) {
  return motivationalDriverDescriptors[driver.toLowerCase()];
}

export function getEQDescriptor(
  domain: keyof typeof eqLevelDescriptors,
  score: number
) {
  const level = getEQLevel(score);
  return eqLevelDescriptors[domain][level];
}

export function getConflictStyleDescriptor(style: string) {
  return conflictStyleDescriptors[style.toLowerCase()];
}

