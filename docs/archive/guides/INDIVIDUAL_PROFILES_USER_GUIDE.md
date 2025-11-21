# 🎯 INDIVIDUAL ASSESSMENT PROFILES - USER GUIDE

## Overview

The Individual Assessment Profiles system provides **detailed insights** into each team member's strengths, development areas, and role suitability based on their complete assessment data.

This system:
- ✅ Analyzes **all assessment data** for each person
- ✅ Identifies **top strengths** with evidence
- ✅ Highlights **development areas** with action plans
- ✅ Calculates **role suitability scores** (Advisory, Technical, Hybrid, Leadership)
- ✅ Generates **training priorities** with timelines
- ✅ Suggests **career trajectory** and recommended roles
- ✅ Compares **current role fit** (if assigned)

---

## 📍 Where to Access

### **Individual Profiles Page**
**Navigation:** Admin Dashboard → **Individual Assessment Profiles**

This page shows **accordion-style dropdown cards** for each team member. Click on any member to expand and see their complete profile.

### **Role Definitions Admin**
**Navigation:** Admin Dashboard → **Role Definitions**

This page lets you define what each role requires (EQ, motivation, communication style, etc.) so the system can match people to roles accurately.

---

## 🎨 Individual Profiles Page Features

### **Summary Stats (Top Cards)**
- **Team Members**: Total active members
- **Excellent Role Fit**: Members with ≥80% match to their role
- **Critical Gaps**: Total critical development areas across team
- **Avg Readiness**: Team average overall readiness score

### **Member Cards (Accordion View)**

Each member card shows:

#### **Collapsed View (Quick Stats)**
- Name & Current Role
- **Role Match %** - How well they fit their current/recommended role
- **Strengths Count** - Number of identified strengths
- **Critical Gaps Count** - Red flag if >0
- **Overall Readiness Badge** - Color-coded (Green ≥80%, Blue ≥65%, Yellow ≥50%, Red <50%)

#### **Expanded View (Full Profile)**

When you click to expand, you see:

**1. Role Suitability Scores**
```
Advisory:   [████████░░] 82/100
Technical:  [█████████░] 88/100
Hybrid:     [████████░░] 85/100
Leadership: [██████████] 92/100
```
- **Advisory** = Client-facing, relationship-building capability
- **Technical** = Specialist depth and analytical skills
- **Hybrid** = Balance of advisory and technical (requires both ≥60)
- **Leadership** = Management and people leadership readiness

Plus:
- **Career Trajectory**: Technical Specialist / People Manager / Hybrid Leader / Partner Track
- **Next Role Readiness**: % ready for promotion

**2. Top Strengths**
Each strength shows:
- **Area** (e.g., "Relationship Building")
- **Score** (0-100)
- **Evidence** (e.g., "High EQ + Coordinator Belbin role")
- **Category Badge** (Technical / Interpersonal / Leadership / Analytical / Creative)

Example:
```
✅ Relationship Building - Score: 85
"Excels at building rapport, managing conflicts, and maintaining client relationships"
Category: Interpersonal
```

**3. Development Areas**
Each area shows:
- **Area Name** (e.g., "Self-Management Skills")
- **Priority Badge** (Critical / High / Medium / Low)
- **Current Score → Target Score**
- **Progress Bar**
- **Timeline** (e.g., "3 months")
- **Recommended Actions** (bullet list)

Example:
```
🔶 Self-Management Skills - Priority: HIGH
Current: 55 → Target: 70
Timeline: 3 months

Recommended Actions:
• Attend stress management training
• Practice mindfulness or meditation techniques
• Develop coping strategies for high-pressure situations
```

**4. Training Priorities**
Each priority shows:
- **Skill Name**
- **Urgency** (Critical / High / Medium / Low)
- **Duration** (e.g., "6 months")
- **Method** (e.g., "Intensive 1-on-1 coaching + structured program")
- **Expected Outcome**

**5. Personality & Work Style Summary**
- Natural language paragraph describing their personality
- **Optimal Work Conditions**:
  - Communication style (sync/async/hybrid)
  - Environment preference
  - Autonomy needs (high/medium/low)
  - Supervision preference (minimal/moderate/close)
- **Team Contribution Style**: How they contribute to team efforts

**6. Recommended Roles**
Badges showing suggested role titles based on their profile:
- Senior Consultant
- Engagement Manager
- Team Leader
- etc.

**7. Current Role Gaps** (if assigned to a role)
Shows specific competency gaps vs. their assigned role requirements.

---

## 🔧 Role Definitions Admin

### **Why Define Roles?**
Role definitions tell the system **what each role requires** so it can:
- Calculate suitability scores
- Identify gaps between people and roles
- Generate targeted development plans
- Recommend best-fit roles for each person

### **How to Create a Role**

1. Click **"Create Role"** button
2. Fill in **Basic Info**:
   - Role Title (e.g., "Senior Auditor")
   - Department (e.g., "Audit")
   - Category (Technical / Advisory / Hybrid / Leadership)
   - Seniority Level (Junior → Partner)
   - Client-Facing toggle

3. Add **Description** (1-2 sentences)

4. Add **Key Responsibilities** (as many as needed):
   - Click "Add" to add more
   - Example: "Lead audit fieldwork and testing"

5. Set **Minimum EQ Requirements** (0-100 for each dimension):
   - Self-Awareness
   - Self-Management
   - Social Awareness
   - Relationship Management

6. Set **Required Motivational Drivers** (0-100 for each):
   - Achievement (goal-orientation)
   - Affiliation (team-orientation)
   - Autonomy (independence)
   - Influence (leadership drive)

7. Choose **Preferred Communication Style**:
   - Synchronous (face-to-face)
   - Asynchronous (written)
   - Hybrid (both)

8. Click **"Create Role"**

### **Default Roles Included**

The system comes with 5 pre-configured roles:
1. **Audit Junior** (Technical, Junior)
2. **Audit Senior** (Technical, Senior)
3. **Audit Manager** (Hybrid, Manager)
4. **Tax Advisor** (Advisory, Senior)
5. **Corporate Finance Analyst** (Technical, Senior)

You can edit these or create new ones.

---

## 📊 How Scores Are Calculated

### **Advisory Suitability (0-100)**
```
Score = (EQ Social Awareness × 25%) +
        (EQ Relationship Mgmt × 20%) +
        (People-Oriented Belbin × 20%) +
        (Achievement/Influence × 15%) +
        (Collaborative Conflict Style × 10%) +
        (Sync Communication × 10%)
```
**Good:** ≥70 | **Excellent:** ≥80

### **Technical Suitability (0-100)**
```
Score = (Specialist Belbin × 30%) +
        (EQ Self-Management × 20%) +
        (Achievement Drive × 20%) +
        (Autonomy Drive × 15%) +
        (Attention to Detail Skill × 15%)
```
**Good:** ≥70 | **Excellent:** ≥80

### **Hybrid Capability (0-100)**
```
IF Advisory < 60 OR Technical < 60 THEN
  Score = 0 (Not suitable for hybrid)
ELSE
  Score = (Average × 70%) + (Balance × 30%)
  WHERE Balance = 100 - |Advisory - Technical|
```
**Good:** ≥70 | **Excellent:** ≥80

### **Leadership Readiness (0-100)**
```
Score = (EQ Relationship × 30%) +
        (EQ Social Awareness × 20%) +
        (Leadership Belbin × 25%) +
        (Influence Drive × 15%) +
        (Seniority/Experience × 10%)
```
**Good:** ≥70 | **Excellent:** ≥80

### **Overall Readiness**
```
Average of Advisory, Technical, and Leadership scores
```

### **Current Role Match**
- If assigned to **Advisory** role → uses Advisory score
- If assigned to **Technical** role → uses Technical score
- If assigned to **Hybrid** role → uses Hybrid score
- If assigned to **Leadership** role → uses Leadership score

---

## 🎯 Strengths Identification Logic

The system identifies strengths from:

### **1. EQ Scores** (≥75 threshold)
- Self-Awareness → "High emotional intelligence"
- Relationship Management → "Excels at building rapport"
- Social Awareness → "Reads room dynamics well"
- Self-Management → "Stays composed under pressure"

### **2. Belbin Roles**
- Coordinator/Resource Investigator → "Client Relationship Management"
- Specialist/Monitor Evaluator → "Technical Excellence"
- Shaper/Implementer → "Delivery & Execution"
- Plant/Resource Investigator → "Innovation & Problem Solving"

### **3. Motivational Drivers** (≥75 threshold)
- High Achievement → "Results Orientation"
- High Affiliation → "Team Collaboration"
- High Autonomy → "Independent Work"
- High Influence → "Leadership & Persuasion"

### **4. Skills** (≥4/5 level)
- Top 3 skills become strengths

### **5. Communication**
- Sync preference + High relationship EQ → "Verbal Communication"

**Output:** Top 8 strengths, sorted by score, with evidence

---

## 🔄 Development Areas Logic

The system identifies development needs from:

### **1. EQ Gaps** (<65 threshold)
With specific remediation:
- Self-Awareness → 360 feedback, coaching, journaling
- Self-Management → Stress management, mindfulness
- Social Awareness → Shadow colleagues, active listening
- Relationship Management → Networking workshops, conflict resolution

### **2. Belbin Gaps**
If role requires a Belbin role they don't have → Development area

### **3. Low Skills** (<3/5 level)
Become development areas with training recommendations

### **4. Communication Mismatch**
If client-facing role but async-only communicator → Development area

**Priority Levels:**
- **Critical**: Score <55, immediate action (0-3 months)
- **High**: Score 55-64, 3-6 months plan
- **Medium**: Score 65-74, 6-12 months
- **Low**: Score ≥75, ongoing enhancement

---

## 🎓 Training Priorities Logic

Training priorities are generated from:

1. **Critical gaps** → Immediate intensive training
2. **High priority areas** → Formal courses
3. **Role-specific skill gaps** → Targeted skill training
4. **Development area recommendations** → Structured programs

Each includes:
- Urgency level
- Estimated time to complete
- Recommended method (1-on-1, course, mentorship, etc.)
- Expected outcome

**Output:** Top 5 priorities

---

## 🚀 Career Trajectory Determination

Based on role suitability scores:

| Trajectory | Criteria |
|------------|----------|
| **Partner Track** | Advisory ≥75 AND Technical ≥70 AND Leadership ≥75 |
| **Hybrid Leader** | Advisory ≥70 AND Technical ≥70 AND Leadership ≥65 |
| **People Manager** | Leadership ≥70 AND Advisory ≥70 (Technical <70) |
| **Technical Specialist** | Technical ≥70 (Advisory <70 OR Leadership <65) |

---

## 🔄 Profile Calculation & Caching

### **When Profiles Calculate**
- **Automatic**: First time you view the page
- **Auto-cached**: Profiles valid for 7 days
- **Manual**: Click "Recalculate" button per member or "Refresh All"

### **Calculation Process**
1. Fetch member + all assessments (8 different assessments)
2. Calculate role-fit scores (4 algorithms)
3. Identify strengths (8 categories)
4. Identify development areas (considering role if assigned)
5. Generate training priorities (top 5)
6. Determine optimal work conditions
7. Generate personality summary
8. Calculate current role match (if assigned to a role)
9. Calculate specific gaps vs role requirements
10. Determine career trajectory
11. Generate recommended roles (top 3)
12. **Save to database**

**Calculation time:** ~2-3 seconds per member

---

## 💡 Use Cases

### **For Performance Reviews**
1. Expand the team member's profile
2. Review their **Top Strengths** to celebrate
3. Discuss **Development Areas** with concrete actions
4. Review **Training Priorities** and allocate budget
5. Discuss **Career Trajectory** and next steps

### **For Succession Planning**
1. Look at **Leadership Readiness** scores
2. Check **Next Role Readiness** percentage
3. Review **Recommended Roles**
4. Identify development gaps before promotion

### **For Team Optimization**
1. View **Summary Stats** to see team health
2. Identify members with **Critical Gaps**
3. See who has **Excellent Role Fit** (≥80%)
4. Plan training budget based on **Training Priorities**

### **For Role Assignments**
1. Define role requirements in **Role Definitions Admin**
2. View **Role Suitability Scores** for each member
3. See **Current Role Match** percentage
4. Identify **best-fit candidates** for open positions

---

## 🎨 Color Coding

### **Readiness Badges**
- 🟢 **Green (80-100)**: Excellent readiness
- 🔵 **Blue (65-79)**: Good readiness
- 🟡 **Yellow (50-64)**: Developing
- 🔴 **Red (<50)**: Needs attention

### **Priority Badges**
- 🔴 **Red**: Critical (0-3 months)
- 🟠 **Orange**: High (3-6 months)
- 🟡 **Yellow**: Medium (6-12 months)
- 🟢 **Green**: Low (ongoing)

### **Category Badges (Strengths)**
- 🔵 **Blue**: Technical
- 🟣 **Purple**: Interpersonal
- 🟢 **Green**: Leadership
- 🟠 **Orange**: Analytical
- 🌸 **Pink**: Creative

---

## 🔧 Admin Tasks

### **Setup (One-Time)**
1. Run SQL migration: `20251104_role_definitions_system.sql`
2. Verify 5 default roles loaded
3. Customize default roles or create new ones
4. Add to admin navigation menu

### **Ongoing Maintenance**
- **Monthly**: Click "Refresh All" to recalculate profiles with latest data
- **After assessments**: Individual "Recalculate" for updated members
- **Quarterly**: Review and update role definitions as practice evolves
- **As needed**: Create new role definitions for new positions

---

## 📝 Example Output

### **Sample Member Profile**

**James Howard** - Senior Consultant
Role Match: **85%** | Strengths: **8** | Critical Gaps: **0**
Overall Readiness: **82%** 🔵

**Role Suitability:**
- Advisory: 82 (Good)
- Technical: 88 (Excellent)
- Hybrid: 85 (Excellent)
- Leadership: 75 (Good)

**Career Trajectory:** Hybrid Leader
**Next Role Readiness:** 79%

**Top 3 Strengths:**
1. **Technical Excellence** (Score: 88) - Specialist Belbin role, deep subject matter expertise
2. **Relationship Building** (Score: 82) - High EQ relationship management + Coordinator role
3. **Results Orientation** (Score: 85) - High achievement drive, sets challenging goals

**Top 2 Development Areas:**
1. **Self-Management Skills** (Current: 58 → Target: 70) - Priority: HIGH
   - Timeline: 3 months
   - Attend stress management training
   - Practice mindfulness techniques

2. **Social Awareness & Empathy** (Current: 62 → Target: 70) - Priority: MEDIUM
   - Timeline: 6 months
   - Shadow client-facing colleagues
   - Practice active listening

**Training Priorities:**
1. **Advanced Client Communication** - Urgency: HIGH - 3 months
2. **Leadership Fundamentals** - Urgency: MEDIUM - 6 months

**Recommended Roles:**
- Senior Consultant ✓ (current)
- Engagement Manager
- Team Leader

---

## 🐛 Troubleshooting

### "No profiles showing"
- Ensure team members have completed assessments
- Click "Refresh All" to recalculate
- Check browser console for errors

### "Scores seem low"
- Remember: 60-79 is "Good" not "Bad"
- Hybrid requires BOTH Advisory AND Technical ≥60
- Leadership requires senior role + high EQ

### "Recalculate taking too long"
- Normal for first calculation (fetches 8 assessments)
- Should complete within 5 seconds
- Subsequent recalculations are faster (cached data)

### "Role gaps not showing"
- Member must be assigned to a role first
- Use member_role_assignments table to assign roles
- Then gaps will appear

---

## ✨ Best Practices

1. **Keep role definitions up-to-date** - Review quarterly
2. **Recalculate monthly** - Especially after assessments
3. **Use in 1-on-1s** - Data-driven conversations
4. **Track progress** - Note development area improvements
5. **Plan training budgets** - Based on training priorities
6. **Succession planning** - Monitor leadership readiness scores
7. **Role assignments** - Use suitability scores for decisions
8. **Career conversations** - Discuss career trajectory and recommended roles

---

## 🎯 Key Metrics to Watch

- **Role Match % < 70**: Person may be in wrong role
- **Critical Gaps > 2**: Urgent intervention needed
- **Overall Readiness < 65**: Training/support required
- **Leadership Readiness ≥ 75**: Promotion candidate
- **Hybrid Score ≥ 70**: Versatile team member
- **Training Priorities > 3**: Heavy development load

---

**Last Updated:** November 4, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready

---

**All features complete and ready to use!** 🎉

