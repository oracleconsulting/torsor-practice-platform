# Team Wellness & Burnout Monitor Widget

A comprehensive wellness monitoring system for accounting practices to track staff wellbeing, predict burnout risk, and provide early intervention.

## Features

### 1. Team Wellness Overview
- Real-time team health score
- Staff status breakdown (green/amber/red)
- Critical alerts and notifications
- Quick access to pulse surveys

### 2. Pulse Survey System
- Anonymous feedback collection
- Energy level tracking
- Workload assessment
- Focus and concentration monitoring
- Optional comments and follow-up requests

### 3. Workload Monitoring
- Hours tracking (contracted vs actual)
- Billable vs non-billable time
- Overtime monitoring
- Work pattern analysis
- Capacity planning

## Components

### TeamWellnessWidget
The main widget component that provides a high-level overview of team wellness status.

### PulseSurvey
Interactive survey component for collecting staff feedback on:
- Energy levels
- Workload management
- Focus and concentration
- Additional comments

### WorkloadMonitor
Detailed workload tracking and analysis:
- Capacity visualization
- Work pattern insights
- Trend analysis
- Early warning indicators

### WellnessDashboard
Main dashboard integrating all components with:
- Tabbed navigation
- Resource library
- Support contacts
- Quick actions

## Technical Implementation

### Dependencies
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Chart.js
- Supabase (backend)

### Data Models
- WorkloadMetrics
- PulseSurvey
- StaffWellbeing
- TeamWellnessSummary

### API Integration
- Real-time data updates
- Anonymous survey submission
- Workload metrics tracking
- Alert system

## Usage

```tsx
import { WellnessDashboard } from '@/components/accountancy/dashboard/wellness/WellnessDashboard';

// In your page component:
<WellnessDashboard
  teamId="team-123"
  staffId="staff-456"
/>
```

## Best Practices

1. **Data Privacy**
   - All survey responses are anonymous by default
   - Personal data is encrypted
   - Access controls for sensitive information

2. **User Experience**
   - Intuitive interface
   - Clear status indicators
   - Easy navigation
   - Responsive design

3. **Performance**
   - Optimized data loading
   - Efficient state management
   - Smooth animations
   - Cached responses

4. **Maintenance**
   - Regular updates
   - Performance monitoring
   - User feedback collection
   - Continuous improvement

## Contributing

1. Follow the TypeScript and React best practices
2. Maintain consistent code style
3. Add appropriate tests
4. Update documentation
5. Submit pull requests

## License

Proprietary - Oracle Accountancy Portal 