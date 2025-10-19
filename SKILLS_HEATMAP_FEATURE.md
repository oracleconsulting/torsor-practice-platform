# Skills Heatmap - Critical Visual Feature

## Overview
The Skills Heatmap is a core visual assessment tool that provides instant insight into individual and team skill levels.

## Key Features

### 1. Visual Overview (Main Heatmap)
- **Grid Layout**: 5 rows × dynamic columns, filling top-to-bottom, left-to-right
- **Color Progression**: Red (Beginner) → Orange (Basic) → Yellow (Competent) → Lime (Proficient) → Green (Expert)
- **Column-based sorting**: Skills sorted by level, so colors naturally group in vertical columns
- **Interactive**: Click any square to scroll to detailed skill view
- **Hover tooltips**: Shows skill name and level

### 2. Category Accordion with Mini Heatmaps
- **Collapsible sections**: Each skill category can be expanded/collapsed independently
- **Mini heatmaps**: Single row of colored squares next to each category name
- **Visual impact**: Instantly shows category strength (many red squares = needs improvement, many green = strong)
- **Sorted consistently**: Skills within categories sorted red → green (left to right)

### 3. Detailed Skill Information
- **Inline editing**: Staff can update their skill levels directly
- **Team comparison**: Shows team average and top performers
- **Progress tracking**: Visual progress bars to target levels
- **Rich context**: Skill descriptions, target averages, top performers

## Use Cases

### For Individual Staff Members
- Self-assessment and tracking
- Identify personal development areas
- Compare against team averages
- Track progress over time

### For Managers/Directors (Admin View)
- **Critical oversight tool**: View any team member's skills heatmap
- **Quick assessment**: Instantly identify skill gaps across team
- **Development planning**: Target training to areas with most red/orange
- **Performance reviews**: Data-driven conversations about skill development
- **Team composition**: Understand team strengths and weaknesses

## Technical Implementation

### Location
`/torsor-practice-platform/src/pages/accountancy/team/MySkillsHeatmap.tsx`

### Key Components
- CSS Grid with `gridAutoFlow: 'column'` for column-based layout
- Accordion component for collapsible categories
- Color-coded skill level visualization
- Inline editing with Supabase integration

### Database Integration
- `skill_assessments` table: stores individual skill ratings
- `skills` table: core skill definitions
- `practice_members` table: team member info
- Real-time updates via Supabase

## Future Enhancements

### Admin/Manager View (Planned)
1. **Team member profile access**: Managers can view any team member's heatmap
2. **Comparison view**: Side-by-side heatmaps of multiple team members
3. **Team aggregation**: Combined heatmap showing team-wide skill levels
4. **Historical tracking**: View skill progression over time
5. **Export capabilities**: Generate reports for reviews and planning

### Permissions
- All staff can view their own heatmap ✅
- Managers/Directors can view their team members' heatmaps (TODO)
- Practice owners can view all heatmaps in practice (TODO)

## Important Notes

⚠️ **DO NOT MODIFY** the core visual layout without careful consideration:
- Column-based color progression is critical for quick visual scanning
- Single-row mini heatmaps provide consistent visual language
- Color coding must remain consistent (red = needs work, green = strong)

✅ **Safe to enhance**:
- Additional filtering options
- Export/print functionality
- Historical comparison views
- Team aggregation views
