# 🎮 Gamification & Assessment Insights - Complete Implementation Guide

## EXECUTIVE SUMMARY

This document outlines the implementation of two major systems:
1. **Strategic Assessment Insights** - Role-fit analysis, team optimization, training allocation
2. **Gamification & Rewards** - Badges, achievements, milestones, leaderboards

---

## PART 1: ASSESSMENT INSIGHTS SYSTEM

### 1.1 Role-Fit Scoring Algorithm

```typescript
interface RoleFitCalculation {
  // Inputs from assessments
  workingPreferences: WorkingPreferences;
  belbin: BelbinProfile;
  motivationalDrivers: MotivationalProfile;
  eqScores: EQProfile;
  conflictStyle: ConflictStyleProfile;
  
  // Calculate three role-fit scores
  advisorySuitability: number;    // 0-100
  technicalSuitability: number;   // 0-100
  hybridSuitability: number;      // 0-100
}

// Advisory Role Calculation
function calculateAdvisorySuitability(member: Member): number {
  let score = 0;
  const weights = {
    eq_social: 0.25,           // 25% weight
    eq_relationship: 0.20,     // 20% weight
    belbin_people: 0.20,       // 20% weight
    motivation_influence: 0.15, // 15% weight
    conflict_collaborative: 0.10, // 10% weight
    communication_sync: 0.10   // 10% weight
  };
  
  // EQ Social Awareness (target: ≥70)
  score += (member.eq_scores.social_awareness / 100) * weights.eq_social * 100;
  
  // EQ Relationship Management (target: ≥70)
  score += (member.eq_scores.relationship_management / 100) * weights.eq_relationship * 100;
  
  // Belbin People-Oriented Roles
  const peopleRoles = ['Coordinator', 'Resource Investigator', 'Teamworker', 'Shaper'];
  const hasPeopleRole = member.belbin_primary.some(role => peopleRoles.includes(role));
  score += (hasPeopleRole ? 1 : 0) * weights.belbin_people * 100;
  
  // Motivational Drivers (Achievement + Influence)
  const motivationScore = (
    member.motivational_drivers.achievement +
    member.motivational_drivers.influence
  ) / 2;
  score += (motivationScore / 100) * weights.motivation_influence * 100;
  
  // Conflict Style (Collaborating preferred)
  const isCollaborative = member.conflict_style_primary === 'Collaborating';
  score += (isCollaborative ? 1 : 0) * weights.conflict_collaborative * 100;
  
  // Communication Preference (Sync or Balanced)
  const prefersSyncComm = ['High-sync', 'Balanced'].includes(member.communication_preference);
  score += (prefersSyncComm ? 1 : 0) * weights.communication_sync * 100;
  
  return Math.min(100, score);
}

// Technical Role Calculation
function calculateTechnicalSuitability(member: Member): number {
  let score = 0;
  const weights = {
    belbin_specialist: 0.30,    // 30% weight
    eq_self_management: 0.20,   // 20% weight
    motivation_achievement: 0.20, // 20% weight
    motivation_autonomy: 0.15,  // 15% weight
    attention_detail: 0.15      // 15% weight
  };
  
  // Belbin Specialist/Implementer/Completer Finisher
  const techRoles = ['Specialist', 'Implementer', 'Completer Finisher', 'Monitor Evaluator'];
  const hasTechRole = member.belbin_primary.some(role => techRoles.includes(role));
  score += (hasTechRole ? 1 : 0) * weights.belbin_specialist * 100;
  
  // EQ Self-Management
  score += (member.eq_scores.self_management / 100) * weights.eq_self_management * 100;
  
  // Motivational Drivers
  score += (member.motivational_drivers.achievement / 100) * weights.motivation_achievement * 100;
  score += (member.motivational_drivers.autonomy / 100) * weights.motivation_autonomy * 100;
  
  // Skills: Attention to Detail
  const detailSkill = member.skills.find(s => s.name === 'Attention to Detail');
  const detailScore = detailSkill ? (detailSkill.current_level / 5) : 0.5;
  score += detailScore * weights.attention_detail * 100;
  
  return Math.min(100, score);
}

// Hybrid Role Calculation (balanced requirements)
function calculateHybridSuitability(member: Member): number {
  const advisoryScore = calculateAdvisorySuitability(member);
  const technicalScore = calculateTechnicalSuitability(member);
  
  // Hybrid requires BOTH to be above threshold
  const minThreshold = 60;
  
  if (advisoryScore < minThreshold || technicalScore < minThreshold) {
    return 0; // Not suitable for hybrid
  }
  
  // Average of both, with bonus for balance
  const average = (advisoryScore + technicalScore) / 2;
  const balance = 100 - Math.abs(advisoryScore - technicalScore);
  
  return (average * 0.7) + (balance * 0.3);
}
```

### 1.2 Red Flags Detection

```typescript
interface RedFlag {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  recommendation: string;
}

function detectRedFlags(member: Member, assignedRole: string): RedFlag[] {
  const flags: RedFlag[] = [];
  
  // ADVISORY ROLE RED FLAGS
  if (assignedRole === 'advisory') {
    // Low EQ Social Awareness
    if (member.eq_scores.social_awareness < 55) {
      flags.push({
        type: 'low_eq_social',
        severity: 'critical',
        message: 'EQ Social Awareness below 55 for advisory role',
        recommendation: 'Intensive EQ coaching or role realignment'
      });
    }
    
    // Async-only communication preference
    if (member.communication_preference === 'Async-heavy') {
      flags.push({
        type: 'async_only_advisory',
        severity: 'high',
        message: 'Async-only communication for client-facing role',
        recommendation: 'Communication flexibility training or technical role'
      });
    }
    
    // No people-oriented Belbin roles
    const peopleRoles = ['Coordinator', 'Resource Investigator', 'Teamworker', 'Shaper'];
    const hasPeopleRole = member.belbin_primary.concat(member.belbin_secondary)
      .some(role => peopleRoles.includes(role));
    
    if (!hasPeopleRole) {
      flags.push({
        type: 'no_people_belbin_advisory',
        severity: 'high',
        message: 'No people-oriented Belbin roles for advisory position',
        recommendation: 'Develop Resource Investigator or Coordinator traits'
      });
    }
    
    // Avoiding conflict style
    if (member.conflict_style_primary === 'Avoiding') {
      flags.push({
        type: 'avoiding_conflict_advisory',
        severity: 'medium',
        message: 'Avoiding conflict style for client-facing role',
        recommendation: 'Conflict resolution training'
      });
    }
  }
  
  // TECHNICAL ROLE RED FLAGS
  if (assignedRole === 'technical') {
    // Low attention to detail
    const detailSkill = member.skills.find(s => s.name === 'Attention to Detail');
    if (detailSkill && detailSkill.current_level < 3) {
      flags.push({
        type: 'low_detail_technical',
        severity: 'high',
        message: 'Attention to Detail below level 3 for technical role',
        recommendation: 'Quality assurance training and mentoring'
      });
    }
    
    // No technical Belbin roles
    const techRoles = ['Specialist', 'Implementer', 'Completer Finisher'];
    const hasTechRole = member.belbin_primary.concat(member.belbin_secondary)
      .some(role => techRoles.includes(role));
    
    if (!hasTechRole) {
      flags.push({
        type: 'no_tech_belbin',
        severity: 'medium',
        message: 'No technical-oriented Belbin roles',
        recommendation: 'Develop Specialist or Implementer strengths'
      });
    }
  }
  
  // LEADERSHIP RED FLAGS
  if (['Manager', 'Director', 'Partner'].includes(member.role)) {
    // Low Relationship Management EQ
    if (member.eq_scores.relationship_management < 60) {
      flags.push({
        type: 'low_eq_relationship_leader',
        severity: 'critical',
        message: 'Relationship Management below 60 for leadership role',
        recommendation: 'Leadership coaching programme'
      });
    }
    
    // No leadership Belbin roles
    const leadershipRoles = ['Coordinator', 'Shaper'];
    const hasLeadershipRole = member.belbin_primary.some(role => leadershipRoles.includes(role));
    
    if (!hasLeadershipRole) {
      flags.push({
        type: 'no_leadership_belbin',
        severity: 'high',
        message: 'No leadership-oriented Belbin roles',
        recommendation: 'Leadership development programme'
      });
    }
  }
  
  return flags;
}
```

### 1.3 Team Composition Analysis

```typescript
interface TeamCompositionAnalysis {
  belbin_balance: BelbinBalanceScore;
  motivational_alignment: MotivationalAlignmentScore;
  eq_team_capability: EQTeamCapability;
  conflict_diversity: ConflictDiversityScore;
  team_health_score: number;
  recommendations: string[];
}

function analyzeTeamComposition(team: Member[]): TeamCompositionAnalysis {
  // Belbin Balance
  const belbinCoverage = countBelbinRoles(team);
  const belbinBalance = assessBelbinBalance(belbinCoverage);
  
  // Motivational Distribution
  const motivationalDist = analyzeMotivationalDistribution(team);
  
  // EQ Team Mapping
  const eqCapability = assessTeamEQ(team);
  
  // Conflict Style Diversity
  const conflictDiversity = assessConflictDiversity(team);
  
  // Overall Team Health
  const teamHealthScore = (
    belbinBalance.score * 0.30 +
    motivationalDist.alignment_score * 0.25 +
    eqCapability.team_avg * 0.25 +
    conflictDiversity.score * 0.20
  );
  
  return {
    belbin_balance: belbinBalance,
    motivational_alignment: motivationalDist,
    eq_team_capability: eqCapability,
    conflict_diversity: conflictDiversity,
    team_health_score: teamHealthScore,
    recommendations: generateTeamRecommendations(
      belbinBalance,
      motivationalDist,
      eqCapability,
      conflictDiversity
    )
  };
}

function assessBelbinBalance(coverage: Record<string, number>): BelbinBalanceScore {
  const essentialRoles = [
    'Coordinator',
    'Implementer',
    'Completer Finisher',
    'Resource Investigator',
    'Teamworker'
  ];
  
  const gaps = essentialRoles.filter(role => (coverage[role] || 0) === 0);
  const overlaps = Object.entries(coverage)
    .filter(([role, count]) => count > 2 && !['Specialist'].includes(role))
    .map(([role]) => role);
  
  // Scoring: 100 - (gaps * 15) - (overlaps * 10)
  const score = Math.max(0, 100 - (gaps.length * 15) - (overlaps.length * 10));
  
  return {
    score,
    coverage,
    gaps,
    overlaps,
    has_innovation: (coverage['Plant'] || 0) > 0,
    has_momentum: (coverage['Shaper'] || 0) > 0,
    has_quality: (coverage['Completer Finisher'] || 0) > 0
  };
}
```

---

## PART 2: GAMIFICATION SYSTEM

### 2.1 Achievement Trigger System

```typescript
// Auto-detection of achievement unlocks
class AchievementEngine {
  async checkAndUnlockAchievements(
    memberId: string,
    eventType: string,
    eventData: any
  ): Promise<Achievement[]> {
    const unlockedAchievements: Achievement[] = [];
    
    // Get all active achievements for this event type
    const achievements = await this.getActiveAchievements(eventType);
    
    for (const achievement of achievements) {
      // Check if already unlocked (unless repeatable)
      if (!achievement.is_repeatable) {
        const alreadyUnlocked = await this.isUnlocked(memberId, achievement.id);
        if (alreadyUnlocked) continue;
      }
      
      // Check if trigger condition is met
      const conditionMet = await this.evaluateTrigger(
        memberId,
        achievement.trigger_type,
        achievement.trigger_config
      );
      
      if (conditionMet) {
        // Unlock achievement
        await this.unlockAchievement(memberId, achievement.id, eventData);
        
        // Award points
        await this.awardPoints(
          memberId,
          achievement.points_awarded,
          'achievement',
          `Unlocked: ${achievement.name}`
        );
        
        // Send notification
        await this.sendUnlockNotification(memberId, achievement);
        
        unlockedAchievements.push(achievement);
      }
    }
    
    return unlockedAchievements;
  }
  
  private async evaluateTrigger(
    memberId: string,
    triggerType: string,
    config: any
  ): Promise<boolean> {
    switch (triggerType) {
      case 'assessment_complete':
        return this.checkAssessmentComplete(memberId, config);
      
      case 'cpd_hours':
        return this.checkCPDHours(memberId, config);
      
      case 'skill_level':
        return this.checkSkillLevel(memberId, config);
      
      case 'streak':
        return this.checkStreak(memberId, config);
      
      case 'custom':
        return this.evaluateCustomSQL(memberId, config.sql_query);
      
      default:
        return false;
    }
  }
  
  private async checkAssessmentComplete(
    memberId: string,
    config: { assessment_type?: string; count: number }
  ): Promise<boolean> {
    // Count completed assessments
    const query = supabase
      .from('invitations')
      .select('*')
      .eq('practice_member_id', memberId);
    
    if (config.assessment_type) {
      // Specific assessment type
      query.not(`${config.assessment_type}_results`, 'is', null);
    }
    
    const { data, error } = await query;
    
    if (error) return false;
    
    // Count how many assessments are complete
    const completedCount = data?.filter(inv => {
      if (config.assessment_type) {
        return inv[`${config.assessment_type}_results`] != null;
      } else {
        // Count any completed assessments
        return inv.vark_results || inv.ocean_results || inv.strengths_data || 
               inv.motivations_data || inv.service_line_preferences;
      }
    }).length || 0;
    
    return completedCount >= config.count;
  }
  
  private async checkCPDHours(
    memberId: string,
    config: { hours_target: number; period?: string }
  ): Promise<boolean> {
    // Get CPD hours for member
    const { data: member } = await supabase
      .from('practice_members')
      .select('cpd_completed_hours')
      .eq('id', memberId)
      .single();
    
    if (!member) return false;
    
    // If period specified, need to calculate within period
    if (config.period) {
      const { data: activities } = await supabase
        .from('cpd_activities')
        .select('hours_claimed, activity_date')
        .eq('practice_member_id', memberId)
        .gte('activity_date', this.getPeriodStartDate(config.period));
      
      const periodHours = activities?.reduce((sum, a) => sum + (a.hours_claimed || 0), 0) || 0;
      return periodHours >= config.hours_target;
    }
    
    return member.cpd_completed_hours >= config.hours_target;
  }
  
  private async checkStreak(
    memberId: string,
    config: { consecutive_days: number }
  ): Promise<boolean> {
    const { data: points } = await supabase
      .from('member_points')
      .select('current_streak_days')
      .eq('member_id', memberId)
      .single();
    
    return (points?.current_streak_days || 0) >= config.consecutive_days;
  }
}
```

### 2.2 Milestone Progress Tracking

```typescript
class MilestoneTracker {
  // Update progress when events occur
  async updateMilestoneProgress(
    memberId: string,
    eventType: string,
    incrementValue: number
  ): Promise<void> {
    // Get all active milestones for this member
    const { data: milestones } = await supabase
      .from('milestones')
      .select('*')
      .eq('is_active', true)
      .or(`time_period.eq.lifetime,end_date.gte.${new Date().toISOString()}`);
    
    for (const milestone of milestones || []) {
      // Check if this event type matches milestone category
      const isRelevant = this.isEventRelevantToMilestone(eventType, milestone.category);
      
      if (isRelevant) {
        await this.incrementProgress(memberId, milestone.id, incrementValue);
      }
    }
  }
  
  private async incrementProgress(
    memberId: string,
    milestoneId: string,
    incrementValue: number
  ): Promise<void> {
    // Upsert progress
    const { data: existing } = await supabase
      .from('member_milestone_progress')
      .select('*')
      .eq('member_id', memberId)
      .eq('milestone_id', milestoneId)
      .single();
    
    const newValue = (existing?.current_value || 0) + incrementValue;
    
    const { data: milestone } = await supabase
      .from('milestones')
      .select('goal_target, completion_points, completion_badge_id')
      .eq('id', milestoneId)
      .single();
    
    const isComplete = newValue >= (milestone?.goal_target || 0);
    
    if (existing) {
      // Update
      await supabase
        .from('member_milestone_progress')
        .update({
          current_value: newValue,
          status: isComplete ? 'completed' : 'in_progress',
          completed_at: isComplete ? new Date().toISOString() : null,
          last_updated: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Insert
      await supabase
        .from('member_milestone_progress')
        .insert({
          member_id: memberId,
          milestone_id: milestoneId,
          current_value: newValue,
          target_value: milestone?.goal_target,
          status: isComplete ? 'completed' : 'in_progress',
          started_at: new Date().toISOString(),
          completed_at: isComplete ? new Date().toISOString() : null
        });
    }
    
    // If just completed, award rewards
    if (isComplete && !existing?.completed_at) {
      // Award completion points
      if (milestone?.completion_points) {
        await this.awardPoints(
          memberId,
          milestone.completion_points,
          'milestone',
          `Completed milestone: ${milestone.name}`
        );
      }
      
      // Award completion badge
      if (milestone?.completion_badge_id) {
        await this.achievementEngine.unlockAchievement(
          memberId,
          milestone.completion_badge_id,
          { milestone_id: milestoneId }
        );
      }
      
      // Send completion notification
      await this.sendMilestoneCompletionNotification(memberId, milestone);
    }
  }
}
```

### 2.3 Admin Configuration UI Components

**Location:** `src/pages/accountancy/admin/GamificationSettingsPage.tsx`

```tsx
export default function GamificationSettingsPage() {
  const [activeTab, setActiveTab] = useState('achievements');
  
  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="reward-rules">Reward Rules</TabsTrigger>
          <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
          <TabsTrigger value="templates">Quick Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="achievements">
          <AchievementsManager />
        </TabsContent>
        
        <TabsContent value="milestones">
          <MilestonesManager />
        </TabsContent>
        
        <TabsContent value="reward-rules">
          <RewardRulesManager />
        </TabsContent>
        
        <TabsContent value="leaderboards">
          <LeaderboardsView />
        </TabsContent>
        
        <TabsContent value="templates">
          <QuickTemplates />
        </TabsContent>
        
        <TabsContent value="analytics">
          <GamificationAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## IMPLEMENTATION TIMELINE

### WEEK 1-2: Database & Core Logic
- [ ] Create all gamification tables (migration script)
- [ ] Implement achievement trigger engine
- [ ] Implement milestone progress tracker
- [ ] Implement points system
- [ ] Seed default achievements

### WEEK 2-3: Admin UI
- [ ] Build achievement builder interface
- [ ] Build milestone builder interface
- [ ] Build reward rules configuration
- [ ] Implement icon & color pickers
- [ ] Create quick templates library

### WEEK 3-4: User-Facing Features
- [ ] Build badge display on profile
- [ ] Create achievement unlock notifications
- [ ] Build milestone progress widgets
- [ ] Implement leaderboards
- [ ] Create achievement gallery

### WEEK 4-5: Assessment Insights
- [ ] Implement role-fit calculation algorithms
- [ ] Build red flags detection system
- [ ] Create team composition analysis
- [ ] Build service line optimization dashboard
- [ ] Implement training priority algorithm

### WEEK 5-6: Integration & Testing
- [ ] Integrate achievements with existing features
- [ ] Test all trigger types
- [ ] Performance optimization
- [ ] User acceptance testing
- [ ] Documentation

---

## RECOMMENDATION: Best Approach

### For Gamification Admin UI:
**✅ RECOMMENDED: Visual Drag-and-Drop Builder**

Similar to:
- Zapier (trigger-action builder)
- Notion (block-based editor)
- Airtable (form builder)

**Why?**
1. **Non-technical admin use** - Your team can create achievements without code
2. **Visual feedback** - See badge design as you build it
3. **Reusable templates** - Quick setup with pre-built patterns
4. **Flexibility** - Can handle complex triggers without SQL
5. **Error prevention** - UI validates inputs before saving

### Key Features:
```
┌─────────────────────────────────────────┐
│  CREATE NEW ACHIEVEMENT                  │
├─────────────────────────────────────────┤
│                                          │
│  [Icon Picker] [Color Picker] [Tier ▼]  │
│                                          │
│  Badge Preview:                          │
│  ┌──────────┐                           │
│  │  [🏆]    │  ← Live preview            │
│  │   GOLD   │                            │
│  └──────────┘                            │
│                                          │
│  Name: [_____________________________]  │
│  Description: [_____________________]  │
│                                          │
│  TRIGGER: [Assessment Complete ▼]       │
│  ├─ Assessment Type: [VARK ▼]          │
│  └─ Count: [1] completion(s)            │
│                                          │
│  REWARDS:                                │
│  ├─ Points: [10]                        │
│  └─ Message: [____________________]     │
│                                          │
│  [Save] [Preview] [Cancel]              │
└─────────────────────────────────────────┘
```

**This makes creating achievements as easy as filling out a form!**

Would you like me to proceed with:
1. ✅ Database migration scripts
2. ✅ Core gamification engine implementation
3. ✅ Admin UI components
4. ✅ Assessment insights algorithms

Or would you like to prioritize one area first?

