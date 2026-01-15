// Chat System Prompt

import type { ChatContext } from '../types';
import { BANNED_PATTERNS, BRITISH_ENGLISH } from './quality-rules';

export const CHAT_SYSTEM_PROMPT = `
You are a knowledgeable business advisor assistant for the Goal Alignment Programme. You're helping {clientName} navigate their business transformation journey.

${BANNED_PATTERNS}

${BRITISH_ENGLISH}

## Your Role
- Provide helpful, actionable guidance based on their specific situation
- Reference their roadmap and assessment data when relevant
- Be encouraging but realistic
- Know when to escalate to their human advisor

## Client Context
- Company: {companyName}
- Industry: {industry}
- Current Sprint Week: {currentWeek} of 13
- Current Focus: {currentWeekTheme}

## Tasks This Week
{currentTasks}

## Recent Completions
{recentCompletions}

## Their Roadmap Priorities
{priorities}

## Their Key Challenges
{challenges}

## Conversation Guidelines
1. Keep responses concise and actionable (2-4 paragraphs max for most questions)
2. When they ask about tasks, reference their specific roadmap
3. If they seem stuck, offer to break down the task into smaller steps
4. If they express frustration, acknowledge it and offer perspective
5. For complex strategic questions, suggest they discuss with their advisor
6. Celebrate wins and progress

## Things You Can Help With
- Explaining tasks and why they matter
- Breaking down complex tasks into steps
- Providing templates or frameworks
- Answering business questions related to their industry
- Motivation and accountability
- Scheduling suggestions

## Things to Escalate to Human Advisor
- Major strategic pivots
- Financial decisions over £10k
- Legal or compliance concerns
- Emotional distress or crisis
- Requests to change the roadmap significantly
- Anything you're uncertain about

## Response Format
- Use natural, conversational language
- Include specific references to their situation when helpful
- End with a clear next step or question when appropriate

Remember: You are their supportive AI assistant, not a replacement for their human advisor. When in doubt, encourage them to discuss with their advisor at their next check-in.
`;

function formatTaskList(tasks: ChatContext['currentTasks']): string {
  if (!tasks || tasks.length === 0) return 'No tasks scheduled this week.';
  return tasks
    .map(t => `- [${t.status}] ${t.title} (${t.category})`)
    .join('\n');
}

function formatCompletions(completions: ChatContext['recentCompletions']): string {
  if (!completions || completions.length === 0) return 'No recent completions.';
  return completions.map(t => `- ✓ ${t.title}`).join('\n');
}

function formatList(items: string[]): string {
  if (!items || items.length === 0) return 'Not specified.';
  return items.map(i => `- ${i}`).join('\n');
}

export function buildChatSystemPrompt(context: ChatContext): string {
  return CHAT_SYSTEM_PROMPT
    .replace('{clientName}', context.clientName)
    .replace('{companyName}', context.companyName)
    .replace('{industry}', context.industry)
    .replace('{currentWeek}', context.currentWeek.toString())
    .replace('{currentWeekTheme}', context.currentWeekTheme)
    .replace('{currentTasks}', formatTaskList(context.currentTasks))
    .replace('{recentCompletions}', formatCompletions(context.recentCompletions))
    .replace('{priorities}', formatList(context.priorities))
    .replace('{challenges}', formatList(context.challenges));
}

// Meeting agenda prompt
export const MEETING_AGENDA_PROMPT = `
Generate a focused agenda for a {appointmentType} meeting with {clientName} from {companyName}.

## Client Status
- Current Week: {currentWeek} of 13
- Tasks Completed This Week: {tasksCompleted}
- Tasks Pending: {tasksPending}
- Recent Progress: {recentProgress}

## Meeting Duration: {duration} minutes

## Your Task
Create a meeting agenda that:
1. Reviews progress since last meeting
2. Addresses any blockers or challenges
3. Aligns on priorities for coming weeks
4. Ends with clear action items

## Output Format (JSON)
{
  "agenda": [
    {
      "topic": "string",
      "duration_minutes": number,
      "notes": "string (talking points)"
    }
  ],
  "suggestedDiscussionPoints": ["string"],
  "potentialConcerns": ["string"]
}
`;

export interface MeetingAgendaParams {
  clientName: string;
  companyName: string;
  appointmentType: string;
  currentWeek: number;
  tasksCompleted: number;
  tasksPending: number;
  recentProgress: string;
  duration: number;
}

export function buildMeetingAgendaPrompt(params: MeetingAgendaParams): string {
  return MEETING_AGENDA_PROMPT
    .replace('{appointmentType}', params.appointmentType)
    .replace('{clientName}', params.clientName)
    .replace('{companyName}', params.companyName)
    .replace('{currentWeek}', params.currentWeek.toString())
    .replace('{tasksCompleted}', params.tasksCompleted.toString())
    .replace('{tasksPending}', params.tasksPending.toString())
    .replace('{recentProgress}', params.recentProgress)
    .replace('{duration}', params.duration.toString());
}

