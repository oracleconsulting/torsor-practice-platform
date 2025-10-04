export interface TaskDescription {
  what: string;
  why: string;
  how: string;
}

export class TaskDescriptionService {
  private static cache: Map<string, TaskDescription> = new Map();

  /**
   * Generate a detailed description for a task explaining what, why, and how
   */
  static async generateTaskDescription(
    task: string,
    weekNumber: number,
    weekTheme: string,
    userContext: any,
    taskDetails?: any
  ): Promise<TaskDescription> {
    // Check cache first
    const cacheKey = `${task}-${weekNumber}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // If we have task details with specific_action and expected_outcome, use those
      if (taskDetails && taskDetails.specific_action && taskDetails.expected_outcome) {
        const description: TaskDescription = {
          what: taskDetails.specific_action,
          why: taskDetails.expected_outcome,
          how: this.generateHowSteps(task, taskDetails, userContext)
        };
        
        // Cache the result
        this.cache.set(cacheKey, description);
        return description;
      }

      // Otherwise, use the fallback description system
      return this.getFallbackDescription(task, weekNumber, weekTheme);

    } catch (error) {
      console.error('Error generating task description:', error);
      return this.getFallbackDescription(task, weekNumber, weekTheme);
    }
  }

  /**
   * Generate actionable how-to steps based on the task
   */
  private static generateHowSteps(task: string, taskDetails: any, userContext: any): string {
    const taskLower = task.toLowerCase();
    const steps: string[] = [];

    // Task-specific steps based on the actual task from taskSpecificityService
    if (taskLower.includes('emergency triage')) {
      steps.push('• Open a spreadsheet and list every client payment task across all 4 businesses');
      steps.push('• For each task, note: client name, payment date, time required, current handler');
      steps.push('• Highlight tasks that could be delegated vs. those needing your expertise');
    } else if (taskLower.includes('office hours')) {
      steps.push('• Send email to all clients TODAY announcing new communication windows');
      steps.push('• Set up auto-responder explaining the new system and emergency protocols');
      steps.push('• Block the office hours in your calendar as recurring, non-negotiable events');
    } else if (taskLower.includes('delegation checklist')) {
      steps.push('• For each business, write down the 5 most critical daily/weekly tasks');
      steps.push('• Create a simple one-page guide: task name, how to do it, who to contact if stuck');
      steps.push('• Share with your team and test by taking a half-day off this week');
    } else if (taskLower.includes('no meeting mondays')) {
      steps.push('• Review all recurring meetings and reschedule Monday ones to Tue-Thu');
      steps.push('• Send a company-wide announcement about the new policy');
      steps.push('• Set up calendar blocks every Monday marked "Deep Work - Do Not Disturb"');
    } else if (taskLower.includes('unified dashboard')) {
      steps.push('• List the 5 key metrics you need to see for each business');
      steps.push('• Create a simple spreadsheet or use a tool like Google Data Studio');
      steps.push('• Set up weekly data feeds or assign someone to update it');
    } else {
      // Generic steps based on task type
      if (taskLower.includes('system') || taskLower.includes('process')) {
        steps.push('• Document the current process step-by-step');
        steps.push('• Identify bottlenecks and inefficiencies');
        steps.push('• Implement the new system and train your team');
      } else if (taskLower.includes('hire') || taskLower.includes('team')) {
        steps.push('• Define the role and key responsibilities clearly');
        steps.push('• Use your network or a targeted job board to find candidates');
        steps.push('• Interview with a focus on autonomy and problem-solving skills');
      } else {
        steps.push('• Break down this task into smaller, manageable steps');
        steps.push('• Set a specific deadline and block time in your calendar');
        steps.push('• Track your progress and adjust as needed');
      }
    }

    return steps.join('\n');
  }

  /**
   * Provide a fallback description if AI generation fails
   */
  private static getFallbackDescription(task: string, weekNumber: number, weekTheme: string): TaskDescription {
    const taskLower = task.toLowerCase();
    
    // Provide context-aware fallbacks based on keywords
    if (taskLower.includes('delegate')) {
      return {
        what: "Identify specific tasks that can be handled by others and create clear handover instructions.",
        why: "Delegation is the only way to scale beyond your personal capacity and reclaim your time.",
        how: "• List all tasks taking 30+ minutes weekly\n• Identify which require your unique skills vs. can be taught\n• Create simple documentation for the top 3 delegatable tasks"
      };
    }
    
    if (taskLower.includes('automat')) {
      return {
        what: "Set up systems and tools to handle repetitive tasks without your involvement.",
        why: "Automation eliminates time-wasting activities and ensures consistency across your businesses.",
        how: "• Map out your most repetitive processes\n• Research tools that can handle these automatically\n• Start with one simple automation this week"
      };
    }
    
    if (taskLower.includes('client') || taskLower.includes('customer')) {
      return {
        what: "Improve how you manage and communicate with clients to save time and increase satisfaction.",
        why: "Better client systems reduce interruptions and create predictable workflows.",
        how: "• Define clear communication boundaries\n• Set up templates for common interactions\n• Create a client FAQ or resource hub"
      };
    }
    
    // Generic fallback
    return {
      what: "Complete this strategic task to move closer to your 40-hour work week goal.",
      why: `This task is essential for ${weekTheme} and will help you build sustainable business systems.`,
      how: "• Review the task requirements\n• Block dedicated time in your calendar\n• Focus on progress over perfection"
    };
  }

  /**
   * Generate descriptions for multiple tasks at once (more efficient)
   */
  static async generateBatchDescriptions(
    tasks: Array<{ task: string; weekNumber: number; weekTheme: string }>,
    userContext: any
  ): Promise<Map<string, TaskDescription>> {
    const results = new Map<string, TaskDescription>();
    
    // Process in parallel but with a limit to avoid rate limiting
    const batchSize = 3;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const promises = batch.map(({ task, weekNumber, weekTheme }) =>
        this.generateTaskDescription(task, weekNumber, weekTheme, userContext)
          .then(desc => ({ task, desc }))
      );
      
      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ task, desc }) => {
        results.set(task, desc);
      });
    }
    
    return results;
  }

  /**
   * Clear the cache (useful for updates or memory management)
   */
  static clearCache(): void {
    this.cache.clear();
  }
} 