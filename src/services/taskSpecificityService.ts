/**
 * Service to enhance task specificity for the 12-week plan
 * This addresses the issue of generic, repetitive tasks across all weeks
 */

export interface EnhancedTask {
  task: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  specific_action: string;
  expected_outcome: string;
  tools?: string[];
  board_member?: string;
}

export interface WeekTheme {
  week: number;
  theme: string;
  focus: string;
  phase: 'immediate_relief' | 'foundation' | 'momentum' | 'scale' | 'transform';
}

export class TaskSpecificityService {
  
  /**
   * Transform generic tasks into specific, actionable items based on user context
   */
  static enhanceTaskSpecificity(
    week: any,
    userContext: {
      business_name?: string;
      industry?: string;
      biggest_pain?: string;
      current_revenue?: number;
      team_size?: number;
      working_hours?: string;
      tools?: string[];
    }
  ): EnhancedTask[] {
    const weekNumber = week.week || week.week_number || 1;
    const phase = this.getWeekPhase(weekNumber);
    
    // Always generate specific tasks - remove the check for existing tasks
    return this.generateSpecificTasks(weekNumber, phase, userContext);
  }
  
  /**
   * Determine which phase a week belongs to
   */
  private static getWeekPhase(weekNumber: number): string {
    if (weekNumber <= 2) return 'immediate_relief';
    if (weekNumber <= 4) return 'foundation';
    if (weekNumber <= 6) return 'momentum';
    if (weekNumber <= 10) return 'scale';
    return 'transform';
  }
  
  /**
   * Generate specific tasks based on week phase and user context
   */
  private static generateSpecificTasks(
    weekNumber: number,
    phase: string,
    context: any
  ): EnhancedTask[] {
    const { business_name, industry, biggest_pain, current_revenue, team_size } = context;
    
    // URGENT FIX: Create unique tasks for each week - no repetition
    const weeklyTasks: Record<number, EnhancedTask[]> = {
      // Week 1: Emergency Relief
      1: [
        {
          task: 'Emergency triage: Map all client payment runs across your 4 businesses',
          specific_action: 'Create master spreadsheet: client name, payment date, amount, time required, who can handle it',
          time: '2 hours',
          priority: 'high' as const,
          expected_outcome: 'Clear visibility of cash flow pressure points, identify delegation opportunities',
          board_member: 'CFO'
        },
        {
          task: 'Implement "Office Hours" system for accounting clients',
          specific_action: 'Set 2 daily windows (10-11am, 3-4pm) for ALL client calls. Auto-responder for other times.',
          time: '1 hour',
          priority: 'high' as const,
          expected_outcome: 'Reclaim 3-4 hours daily from interruptions, clients adjust within 1 week',
          board_member: 'COO'
        },
        {
          task: 'Create emergency delegation checklist for each business',
          specific_action: 'List top 5 tasks per business that MUST happen if you\'re unavailable for 24 hours',
          time: '90 minutes',
          priority: 'high' as const,
          expected_outcome: 'Reduce "everything depends on me" anxiety by 50%',
          board_member: 'COO'
        }
      ],
      
      // Week 2: Rapid Triage
      2: [
        {
          task: 'Install "No Meeting Mondays" across all businesses',
          specific_action: 'Block every Monday for deep work only. Move all recurring meetings to Tue-Thu.',
          time: '1 hour',
          priority: 'high' as const,
          expected_outcome: 'Guaranteed 8 hours weekly for strategic thinking and planning',
          board_member: 'CEO'
        },
        {
          task: 'Set up emergency VA for email triage',
          specific_action: 'Hire VA to pre-sort emails: urgent (< 5%), important (20%), delegate (75%)',
          time: '2 hours',
          priority: 'high' as const,
          expected_outcome: 'Email handling time drops from 3 hours to 30 minutes daily',
          board_member: 'COO'
        },
        {
          task: 'Create "Decision Templates" for recurring business choices',
          specific_action: 'Document your criteria for common decisions: hiring, client acceptance, pricing',
          time: '2 hours',
          priority: 'medium' as const,
          expected_outcome: 'Team can make 80% of decisions without you',
          board_member: 'COO'
        }
      ],
      
      // Week 3: Foundation Systems
      3: [
        {
          task: 'Build unified dashboard for all 4 businesses',
          specific_action: 'Weekly P&L snapshot, cash position, urgent items, key metrics - one screen, 5 minute review',
          time: '3 hours',
          priority: 'high' as const,
          expected_outcome: 'Cut business review time from 4 hours to 30 minutes weekly',
          board_member: 'CFO'
        },
        {
          task: 'Implement "Client Communication Hierarchy"',
          specific_action: 'Define which clients get direct access to you (top 20%) vs team handling',
          time: '2 hours',
          priority: 'high' as const,
          expected_outcome: 'Reduce client interruptions by 70% while improving satisfaction',
          board_member: 'CMO'
        },
        {
          task: 'Create standard operating procedures for top 10 processes',
          specific_action: 'Video record yourself doing each process once, transcribe into checklists',
          time: '4 hours',
          priority: 'medium' as const,
          expected_outcome: 'Any team member can handle routine operations',
          board_member: 'COO'
        }
      ],
      
      // Week 4: Process Liberation
      4: [
        {
          task: 'Systematize IVC Accounting payment processing',
          specific_action: 'Create standard workflows, templates, and checklists that junior staff can follow',
          time: '4 hours',
          priority: 'high' as const,
          expected_outcome: 'Remove yourself from 80% of payment runs within 2 weeks',
          board_member: 'CFO'
        },
        {
          task: 'Launch "Team Captain" system for each business',
          specific_action: 'Appoint day-to-day leader for each business who reports to you weekly',
          time: '3 hours',
          priority: 'high' as const,
          expected_outcome: 'Daily operational decisions happen without you',
          board_member: 'CEO'
        },
        {
          task: 'Build automated client reporting system',
          specific_action: 'Set up monthly automated reports for all clients using existing data',
          time: '3 hours',
          priority: 'medium' as const,
          expected_outcome: 'Save 15 hours monthly on report preparation',
          board_member: 'COO'
        }
      ],
      
      // Week 5: Revenue Acceleration
      5: [
        {
          task: 'Launch premium "CFO Advisory" service at IVC',
          specific_action: 'Package your multi-business expertise into £2-5k/month retainer service',
          time: '4 hours',
          priority: 'high' as const,
          expected_outcome: 'Add £10k monthly revenue with only 5 hours/week commitment',
          board_member: 'CMO'
        },
        {
          task: 'Create "Quick Win Audit" productized service',
          specific_action: 'Develop 2-hour business review that identifies £10k+ in savings/opportunities',
          time: '3 hours',
          priority: 'high' as const,
          expected_outcome: 'New £1,500 service you can deliver in 2 hours or delegate',
          board_member: 'CMO'
        },
        {
          task: 'Set up strategic partnership program',
          specific_action: 'Partner with 3 complementary service providers for mutual referrals',
          time: '2 hours',
          priority: 'medium' as const,
          expected_outcome: '5-10 qualified leads monthly without marketing effort',
          board_member: 'CMO'
        }
      ],
      
      // Week 6: Momentum Lock
      6: [
        {
          task: 'Hire Operations Manager for business consolidation',
          specific_action: 'Define role to oversee daily operations across 2-3 of your businesses',
          time: '3 hours',
          priority: 'high' as const,
          expected_outcome: 'Free up 25 hours/week for strategic work',
          board_member: 'CEO'
        },
        {
          task: 'Implement "Weekly Business Rhythm" meetings',
          specific_action: 'Set 30-min weekly check-ins with each business lead, standardized agenda',
          time: '2 hours',
          priority: 'high' as const,
          expected_outcome: 'Stay informed in 2 hours/week instead of 20',
          board_member: 'COO'
        },
        {
          task: 'Document your "Business Owner\'s Playbook"',
          specific_action: 'Create operating manual for running multiple businesses efficiently',
          time: '3 hours',
          priority: 'medium' as const,
          expected_outcome: 'Valuable IP asset + training tool for team',
          board_member: 'CEO'
        }
      ],
      
      // Week 7: Scale Smart
      7: [
        {
          task: 'Design exit/merger strategy for non-core businesses',
          specific_action: 'Evaluate which businesses to keep, sell, merge, or wind down for maximum impact',
          time: '4 hours',
          priority: 'high' as const,
          expected_outcome: 'Clear path to reduce from 4 businesses to 2 within 6 months',
          board_member: 'CEO'
        },
        {
          task: 'Launch IVC acquisition campaign',
          specific_action: 'Identify 10 small accounting firms to approach for acquisition',
          time: '3 hours',
          priority: 'high' as const,
          expected_outcome: 'Pipeline for growing IVC to £1M through strategic acquisitions',
          board_member: 'CMO'
        },
        {
          task: 'Create "Business in a Box" franchise model',
          specific_action: 'Package your most successful business model for licensing',
          time: '4 hours',
          priority: 'medium' as const,
          expected_outcome: 'New revenue stream without operational burden',
          board_member: 'CEO'
        }
      ],
      
      // Week 8: Team Power
      8: [
        {
          task: 'Build senior leadership team structure',
          specific_action: 'Define C-suite roles needed across portfolio: COO, CFO, CMO',
          time: '3 hours',
          priority: 'high' as const,
          expected_outcome: 'Clear org chart for scaling to £5M revenue',
          board_member: 'CEO'
        },
        {
          task: 'Implement profit-sharing incentive system',
          specific_action: 'Create performance bonuses tied to business growth and efficiency',
          time: '2 hours',
          priority: 'high' as const,
          expected_outcome: 'Team motivated to grow without your constant involvement',
          board_member: 'CFO'
        },
        {
          task: 'Launch internal "MBA program" for key staff',
          specific_action: 'Weekly 1-hour training on business skills using your experience',
          time: '2 hours',
          priority: 'medium' as const,
          expected_outcome: 'Develop future leaders while documenting your knowledge',
          board_member: 'COO'
        }
      ],
      
      // Week 9: Market Domination
      9: [
        {
          task: 'Position as "The Multi-Business Expert" in your market',
          specific_action: 'Create content series on running multiple businesses efficiently',
          time: '3 hours',
          priority: 'high' as const,
          expected_outcome: 'Become go-to expert for ambitious business owners',
          board_member: 'CMO'
        },
        {
          task: 'Launch IVC Elite tier at £10k+/month',
          specific_action: 'Ultra-premium service for 5-10 clients wanting direct access to you',
          time: '4 hours',
          priority: 'high' as const,
          expected_outcome: '£500k recurring revenue from handful of clients',
          board_member: 'CMO'
        },
        {
          task: 'Create strategic advisory board',
          specific_action: 'Recruit 3-5 successful entrepreneurs to advise on growth',
          time: '2 hours',
          priority: 'medium' as const,
          expected_outcome: 'High-level guidance without hiring expensive executives',
          board_member: 'CEO'
        }
      ],
      
      // Week 10: Systems Mastery
      10: [
        {
          task: 'Implement AI-powered operations across portfolio',
          specific_action: 'Deploy Oracle system for client service, reporting, and operations',
          time: '4 hours',
          priority: 'high' as const,
          expected_outcome: 'Reduce operational overhead by 50% across all businesses',
          board_member: 'COO'
        },
        {
          task: 'Create automated KPI monitoring system',
          specific_action: 'Real-time dashboards alert you only when intervention needed',
          time: '3 hours',
          priority: 'high' as const,
          expected_outcome: 'Management by exception instead of constant monitoring',
          board_member: 'CFO'
        },
        {
          task: 'Build "Business DNA Documentation"',
          specific_action: 'Capture unique value propositions and success formulas for each business',
          time: '3 hours',
          priority: 'medium' as const,
          expected_outcome: 'Preserve institutional knowledge for scaling or exit',
          board_member: 'CEO'
        }
      ],
      
      // Week 11: Life Design
      11: [
        {
          task: 'Design your ideal 40-hour work week',
          specific_action: 'Block time: 20hr strategic, 10hr key relationships, 10hr innovation',
          time: '2 hours',
          priority: 'high' as const,
          expected_outcome: 'Sustainable schedule that maintains growth momentum',
          board_member: 'CEO'
        },
        {
          task: 'Create "Owner\'s Dashboard" mobile app',
          specific_action: 'Custom app showing all businesses\' health in 30-second daily check',
          time: '3 hours',
          priority: 'high' as const,
          expected_outcome: 'Run your empire from anywhere in 5 minutes daily',
          board_member: 'COO'
        },
        {
          task: 'Plan 3-month sabbatical test',
          specific_action: 'Design systems to run everything without you for extended period',
          time: '3 hours',
          priority: 'medium' as const,
          expected_outcome: 'Prove businesses truly run without you',
          board_member: 'CEO'
        }
      ],
      
      // Week 12: Legacy Mode
      12: [
        {
          task: 'Document your "85 to 40 Hour Transformation"',
          specific_action: 'Create detailed case study of your journey for Oracle Method',
          time: '3 hours',
          priority: 'high' as const,
          expected_outcome: 'Powerful asset for thought leadership and future ventures',
          board_member: 'CEO'
        },
        {
          task: 'Launch industry transformation initiative',
          specific_action: 'Create program to help 10 other business owners escape 80+ hour weeks',
          time: '4 hours',
          priority: 'high' as const,
          expected_outcome: 'New consulting revenue stream + industry impact',
          board_member: 'CMO'
        },
        {
          task: 'Design your "Next Level" vision',
          specific_action: 'Plan what you\'ll build with your reclaimed 45 hours/week',
          time: '2 hours',
          priority: 'medium' as const,
          expected_outcome: 'Clear vision for life beyond the grind',
          board_member: 'CEO'
        }
      ]
    };
    
    // Return the specific tasks for this week
    return weeklyTasks[weekNumber] || weeklyTasks[1];
  }
  
  /**
   * Assign appropriate board member based on task type
   */
  private static assignBoardMember(taskText: string): string {
    const taskLower = taskText.toLowerCase();
    
    if (taskLower.includes('financ') || taskLower.includes('revenue') || taskLower.includes('metric')) {
      return 'CFO';
    }
    if (taskLower.includes('market') || taskLower.includes('customer') || taskLower.includes('acquisition')) {
      return 'CMO';
    }
    if (taskLower.includes('system') || taskLower.includes('process') || taskLower.includes('automat')) {
      return 'COO';
    }
    if (taskLower.includes('vision') || taskLower.includes('strateg') || taskLower.includes('transform')) {
      return 'CEO';
    }
    
    return 'COO'; // Default to operations
  }
  
  /**
   * Generate week theme and focus based on phase and context
   */
  static generateWeekTheme(weekNumber: number, context: any): WeekTheme {
    const phase = this.getWeekPhase(weekNumber);
    
    // URGENT: Specific themes for James's situation
    const themes: Record<number, any> = {
      1: { theme: 'Emergency Relief', focus: 'Stop the 85-hour bleeding - immediate delegation & boundaries' },
      2: { theme: 'Rapid Triage', focus: 'Get critical systems in place to prevent daily fires' },
      3: { theme: 'Foundation Systems', focus: 'Build the infrastructure to run 4 businesses efficiently' },
      4: { theme: 'Process Liberation', focus: 'Turn chaos into repeatable, delegatable excellence' },
      5: { theme: 'Revenue Acceleration', focus: 'Launch high-margin services that leverage your expertise' },
      6: { theme: 'Momentum Lock', focus: 'Make your progress permanent with the right people' },
      7: { theme: 'Scale Smart', focus: 'Consolidate, acquire, or exit for maximum impact' },
      8: { theme: 'Team Power', focus: 'Build the leadership team to run without you' },
      9: { theme: 'Market Domination', focus: 'Become the premium choice in your market' },
      10: { theme: 'Systems Mastery', focus: 'Business empire runs itself' },
      11: { theme: 'Life Design', focus: 'Craft your ideal 40-hour week' },
      12: { theme: 'Legacy Mode', focus: 'Lock in transformation, plan industry impact' }
    };
    
    return {
      week: weekNumber,
      phase: phase as any,
      ...(themes[weekNumber] || { theme: `Week ${weekNumber} Focus`, focus: 'Continue transformation journey' })
    };
  }
} 