# Oracle Method Integration Guide
## 365 Alignment Programme - Real-Time Client Progress Tracking

**Date:** October 4, 2025  
**Version:** 1.0  
**Status:** ✅ Complete & Production Ready

---

## 🎯 Overview

The **365 Alignment Programme** is now a **live conduit** between the TORSOR Practice Platform and the Oracle Method Portal. Accountants can view and manage client progress in real-time, with automatic updates as clients complete their sprint tasks.

### What This Integration Does

1. **Real-Time Data Sync**: Live connection to Oracle Method Portal via Supabase
2. **Progress Tracking**: View client's 5-year vision, 6-month shifts, and 3-month sprints
3. **Task Management**: Update tasks, add notes, and track completion on behalf of clients
4. **Live Updates**: Automatic UI refresh when clients complete tasks in the portal
5. **Bi-Directional Control**: Accountants can manage tasks from the practice side

---

## 📊 Architecture

### Data Flow

```
┌─────────────────────┐
│ Oracle Method Portal│
│  (Client Side)      │
└──────────┬──────────┘
           │
           │ Client Updates Tasks
           ▼
┌─────────────────────┐
│   Supabase DB       │
│ - client_config     │
│ - sprint_progress   │
└──────────┬──────────┘
           │
           │ Real-time Subscriptions
           ▼
┌─────────────────────┐
│ TORSOR Practice     │
│   Platform          │
│ (Accountant Side)   │
└─────────────────────┘
```

### Key Components

1. **`oracleMethodIntegration.ts`** - Service layer for Oracle Method data
2. **`AlignmentProgrammePage.tsx`** - UI for viewing and managing client progress
3. **Supabase Real-time** - Live updates via PostgreSQL subscriptions

---

## 🚀 Features

### 1. Client Overview
- **5-Year Vision**: Strategic destination with revenue and team targets
- **6-Month Shifts**: Current transformation objectives
- **3-Month Sprints**: Weekly action plans with tasks
- **Progress Stats**: Completion percentage, tasks remaining, current week

### 2. Task Management Tab
- **Live Task List**: All sprint tasks organized by week
- **Check/Uncheck**: Mark tasks complete/incomplete
- **Add Notes**: Attach accountant notes to any task
- **Delete Tasks**: Remove tasks if needed
- **Real-Time Updates**: Instant refresh when client makes changes

### 3. Real-Time Sync
- **Supabase Subscriptions**: Listens for changes in `sprint_progress` and `client_config`
- **Automatic Refresh**: UI updates without page reload
- **Bi-Directional**: Both sides (client & accountant) see updates instantly

---

## 📁 File Structure

```
torsor-practice-platform/
├── src/
│   ├── services/
│   │   └── oracleMethodIntegration.ts  [NEW]
│   └── pages/
│       └── AlignmentProgrammePage.tsx  [UPDATED]
└── ORACLE_METHOD_INTEGRATION_GUIDE.md  [NEW]
```

---

## 🛠️ Technical Implementation

### OracleMethodIntegrationService

**Location**: `src/services/oracleMethodIntegration.ts`

#### Key Methods

```typescript
// Fetch all Oracle Method clients
getAllClients(): Promise<OracleMethodClient[]>

// Get single client's roadmap
getClientRoadmap(groupId): Promise<OracleMethodClient | null>

// Get sprint tasks
getSprintTasks(groupId): Promise<SprintTask[]>

// Calculate sprint stats
getSprintStats(groupId): Promise<SprintStats | null>

// Get complete client progress (roadmap + tasks + stats)
getClientProgress(groupId): Promise<ClientProgress | null>

// Update task status
updateTaskStatus(taskId, completed, notes?): Promise<void>

// Add new task
addTask(groupId, sprintNumber, weekNumber, title, description?): Promise<SprintTask | null>

// Delete task
deleteTask(taskId): Promise<void>

// Subscribe to real-time updates
subscribeToClientProgress(groupId, onUpdate): () => void
```

### Data Types

```typescript
interface ClientProgress {
  group_id: string;
  business_name: string;
  email: string;
  roadmap: OracleMethodClient;
  tasks: SprintTask[];
  stats: SprintStats;
  last_updated: string;
}

interface SprintStats {
  current_week: number;
  sprint_iteration: number;
  tasks_completed: number;
  total_tasks: number;
  completion_percentage: number;
  weeks_remaining: number;
}

interface SprintTask {
  task_id: string;
  group_id: string;
  sprint_number: number;
  week_number?: number;
  task_title: string;
  task_description?: string;
  completed: boolean;
  completed_date?: string;
  notes?: string;
  updated_at: string;
}
```

---

## 🗄️ Database Schema

### Tables Used

#### 1. `client_config`
Stores Oracle Method roadmap data:
- `group_id` (Primary Key) - Links to client
- `five_year_vision` (JSONB) - Strategic vision
- `six_month_shift` (JSONB) - Current 6-month plan
- `three_month_sprint` (JSONB) - 90-day sprint with weekly tasks
- `current_week` (INTEGER) - Current sprint week
- `sprint_iteration` (INTEGER) - Sprint version number
- `roadmap_generated` (BOOLEAN) - Has roadmap been created?
- `roadmap_generated_at` (TIMESTAMP) - When roadmap was created

#### 2. `sprint_progress`
Stores task completion data:
- `task_id` (STRING) - Unique task identifier
- `group_id` (STRING) - Client identifier
- `sprint_number` (INTEGER) - Which sprint (1, 2, 3...)
- `week_number` (INTEGER) - Week within sprint (1-12)
- `task_title` (STRING) - Task description
- `task_description` (STRING) - Additional details
- `completed` (BOOLEAN) - Is task complete?
- `completed_date` (TIMESTAMP) - When completed
- `notes` (STRING) - Accountant/client notes
- `updated_at` (TIMESTAMP) - Last modified

---

## 🎨 UI Components

### Tab Navigation
1. **Overview** - Quick stats and current phase
2. **5-Year Vision** - Long-term strategic goals
3. **6-Month Shifts** - Transformation milestones
4. **3-Month Sprints** - Tactical execution plans
5. **Task Management** ⭐ NEW - Interactive task list
6. **Assessments** - Oracle Method assessment results

### Task Management Tab Features
- ✅ **Checkbox Toggles** - Click to complete/uncomplete
- 📝 **Notes** - Add accountant observations
- 🗑️ **Delete** - Remove tasks if needed
- 🎨 **Visual States**:
  - White background = Not started
  - Green background = Completed
  - Hover effects for interactivity

---

## 🔄 Real-Time Updates

### How It Works

1. **Subscription Setup**:
   ```typescript
   oracleMethodService.subscribeToClientProgress(
     clientId,
     (payload) => {
       console.log('Update received:', payload);
       loadClientRoadmap(); // Refresh data
     }
   );
   ```

2. **Events Monitored**:
   - `INSERT` on `sprint_progress` - New task added
   - `UPDATE` on `sprint_progress` - Task status changed
   - `DELETE` on `sprint_progress` - Task removed
   - `UPDATE` on `client_config` - Roadmap updated

3. **Auto-Cleanup**:
   ```typescript
   useEffect(() => {
     // Subscribe
     const unsubscribe = oracleMethodService.subscribeToClientProgress(...);
     
     // Cleanup on unmount
     return () => unsubscribe();
   }, [clientId]);
   ```

---

## 🚀 Usage Guide

### For Accountants

#### Viewing Client Progress

1. Navigate to **365 Alignment Programme** from the dashboard
2. Select a client (or arrive via direct link)
3. View the **Overview** tab for quick stats
4. Click **Task Management** to see detailed progress

#### Managing Tasks

**To mark a task complete:**
1. Go to **Task Management** tab
2. Click the checkbox next to any task
3. Changes save automatically
4. Client sees update instantly in their portal

**To add a note:**
1. Click the pencil icon (📝) next to a task
2. Enter your note in the popup
3. Note is saved and visible to client

**To delete a task:**
1. Click the trash icon (🗑️) next to a task
2. Confirm deletion
3. Task is removed from client's sprint

#### Refresh Data
- Click the **Refresh** button in the header to manually reload
- Real-time updates happen automatically (no manual refresh needed)

---

## 🔐 Data Privacy & Security

### Access Control
- ✅ Requires Professional+ subscription tier
- ✅ Supabase Row Level Security (RLS) policies
- ✅ Client data isolated by `group_id`
- ✅ Real-time subscriptions filtered by client

### Data Sync
- ✅ Read-only on Oracle Method Portal side (clients manage their data)
- ✅ Read-write on TORSOR side (accountants can assist)
- ✅ All changes logged with timestamps
- ✅ Audit trail in `updated_at` fields

---

## 🐛 Troubleshooting

### "No client data found"
**Cause**: Client hasn't completed Oracle Method assessment yet  
**Solution**: Ensure client has generated their roadmap in the Oracle Method Portal

### "Real-time updates not working"
**Cause**: Supabase connection issue or RLS policy blocking  
**Solution**: 
1. Check Supabase connection in browser console
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Check RLS policies allow access to `sprint_progress` table

### "Tasks not saving"
**Cause**: Type mismatch or missing `task_id`  
**Solution**: 
1. Check browser console for errors
2. Ensure `task_id` is unique
3. Verify Supabase schema matches expected structure

---

## 📈 Future Enhancements

### Planned Features
1. **Client Selector**: Dropdown to switch between clients without navigation
2. **Client Mapping**: Link TORSOR clients to Oracle Method `group_id`s
3. **Notifications**: Alert accountants when clients complete milestones
4. **Analytics**: Progress trends, completion rates, bottlenecks
5. **Bulk Actions**: Mark multiple tasks complete at once
6. **Custom Tasks**: Add ad-hoc tasks outside the sprint structure
7. **Comments Thread**: Discussion between accountant and client per task
8. **Export**: Download progress reports as PDF/Excel

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Navigate to 365 Alignment Programme page
- [ ] Select client with existing Oracle Method data
- [ ] Verify 5-year vision displays correctly
- [ ] Check 6-month shift shows milestones
- [ ] View 3-month sprint with weekly tasks
- [ ] Go to Task Management tab
- [ ] Toggle a task complete/incomplete
- [ ] Add a note to a task
- [ ] Refresh page - verify changes persisted
- [ ] Open Oracle Method Portal as client
- [ ] Update a task in the portal
- [ ] Verify TORSOR updates automatically (within 5 seconds)

### Edge Cases to Test

- [ ] Client with no roadmap generated yet
- [ ] Client with roadmap but no tasks completed
- [ ] Client with all tasks completed
- [ ] Multiple accountants viewing same client (concurrent access)
- [ ] Slow network connection
- [ ] Supabase connection loss and recovery

---

## 📚 Related Documentation

- [TORSOR Setup Instructions](SETUP_INSTRUCTIONS.md)
- [Supabase Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Oracle Method Portal Architecture](../oracle-method-portal/README.md)
- [Sprint Tracking Service](../oracle-method-portal/src/services/sprintTrackingService.ts)

---

## 🤝 Support

### For Issues or Questions:
1. Check browser console for errors
2. Review Supabase logs for query issues
3. Verify environment variables are set correctly
4. Test with a known working client first

---

## ✅ Status

| Feature | Status | Notes |
|---------|--------|-------|
| Data Service | ✅ Complete | `oracleMethodIntegration.ts` |
| UI Integration | ✅ Complete | `AlignmentProgrammePage.tsx` |
| Real-Time Sync | ✅ Complete | Supabase subscriptions |
| Task Management | ✅ Complete | CRUD operations |
| Error Handling | ✅ Complete | Try-catch with user feedback |
| Type Safety | ✅ Complete | Full TypeScript types |
| Client Mapping | 🔄 Pending | Manual `group_id` entry for now |

---

## 🎉 Summary

The **Oracle Method Integration** transforms the TORSOR Practice Platform into a **real-time management console** for client progress. Accountants can now:

✅ See exactly what clients are working on  
✅ Track progress week by week  
✅ Help clients stay on track by managing tasks  
✅ Get instant updates when clients complete work  
✅ Provide guidance and support through task notes  

This integration creates a **seamless bridge** between the client experience (Oracle Method Portal) and the practice management side (TORSOR Platform), enabling true collaborative advisory services.

---

**Built with ❤️ for accountancy practices that want to provide exceptional advisory services.**

