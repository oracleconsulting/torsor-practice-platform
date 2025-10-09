# Skills Development Priority Algorithm

## Overview

The TORSOR Practice Platform uses a **weighted priority algorithm** to intelligently recommend which skills should be developed first for each team member and across the practice.

## Algorithm: Weighted Priority Score

### Formula
```
Priority Score = Skill Gap × Interest Level × Business Criticality
```

### Components

#### 1. Skill Gap (1-5)
The difference between the **required skill level** and the **current skill level**.

**Formula**: `Gap = Required Level - Current Level`

**Example**:
- Required: Level 4
- Current: Level 2
- **Gap = 2**

**Interpretation**:
- Gap of 0: No development needed (at or above required level)
- Gap of 1: Minor development needed
- Gap of 2-3: Moderate development priority
- Gap of 4-5: Critical development priority

---

#### 2. Interest Level (1-5)
The team member's expressed interest in developing this skill.

**Scale**:
- 1: Low interest - May require motivation or alternative approaches
- 2: Some interest - Basic willingness to learn
- 3: Moderate interest - Actively wants to develop
- 4: High interest - Eager to learn and improve
- 5: Very high interest - Passionate about skill development

**Why it matters**:
- High interest = faster learning and better retention
- Aligns development with career goals
- Increases training effectiveness and ROI

---

#### 3. Business Criticality (Implicit)
While not explicitly multiplied in the current implementation, business criticality is reflected in the **required level** set for each skill.

**How it works**:
- Core business skills have higher required levels (4-5)
- Supporting skills have moderate required levels (3)
- Nice-to-have skills have lower required levels (1-2)

---

## Priority Calculation Examples

### Example 1: High Priority
```
Skill: Financial Reporting (IFRS)
Required Level: 5
Current Level: 2
Interest Level: 5
Gap: 3

Priority Score = 3 × 5 = 15 (HIGH PRIORITY)
```

**Interpretation**: Critical skill gap with high interest - perfect candidate for immediate training investment.

---

### Example 2: Medium Priority
```
Skill: Data Analytics
Required Level: 3
Current Level: 2
Interest Level: 3
Gap: 1

Priority Score = 1 × 3 = 3 (MEDIUM PRIORITY)
```

**Interpretation**: Small gap with moderate interest - suitable for ongoing development.

---

### Example 3: Lower Priority (Despite Gap)
```
Skill: Python for Accounting
Required Level: 4
Current Level: 1
Interest Level: 2
Gap: 3

Priority Score = 3 × 2 = 6 (MEDIUM-LOW PRIORITY)
```

**Interpretation**: Despite large gap, low interest means training may be less effective. Consider motivational approaches first.

---

### Example 4: No Priority
```
Skill: Excel Advanced Functions
Required Level: 4
Current Level: 5
Interest Level: 5
Gap: -1 (exceeds requirement)

Priority Score = 0 (NO PRIORITY)
```

**Interpretation**: Skill exceeds requirements. Focus resources elsewhere.

---

## Priority Bands

The algorithm categorizes priorities into bands for actionable recommendations:

| Score Range | Priority Level | Action |
|-------------|---------------|--------|
| 15-25 | **Critical** | Immediate training required |
| 10-14 | **High** | Plan training within next quarter |
| 5-9 | **Medium** | Include in annual development plan |
| 1-4 | **Low** | Consider when resources available |
| 0 | **None** | No action needed |

---

## Application in the Platform

### 1. Gap Analysis View
- Skills are sorted by priority score (highest first)
- Color-coded badges indicate urgency
- Filters allow focusing on specific priority bands

### 2. Development Planning
- Automatically suggests highest-priority skills for development plans
- Estimates training investment based on priority and gap size
- Groups related skills for efficient learning paths

### 3. Team Metrics
- Aggregates priority scores across the team
- Identifies collective skill gaps
- Highlights succession risks (skills with only one expert)

### 4. Resource Allocation
- Helps managers allocate training budget effectively
- Prioritizes training slots for highest-impact skills
- Tracks ROI by comparing priority reduction over time

---

## Customization

The algorithm can be customized per practice:

### Adjusting Weights
```typescript
// Current: Simple multiplication
Priority = Gap × Interest

// Can be enhanced to:
Priority = (Gap × Weight_Gap) + (Interest × Weight_Interest) + Business_Multiplier
```

### Adding Time Factors
```typescript
// Urgency multiplier for time-sensitive skills
Priority = Gap × Interest × Urgency_Factor

// Where Urgency_Factor considers:
// - Regulatory deadlines
// - Client project requirements
// - Practice growth goals
```

---

## Best Practices

### For Managers
1. **Review priorities quarterly** - Skills needs evolve
2. **Balance high-priority items** - Don't overload one person
3. **Consider team dynamics** - Pair high-interest learners with experts
4. **Track progress** - Reassess after training completion

### For Team Members
1. **Be honest about interest levels** - Better outcomes with genuine interest
2. **Update skills regularly** - Keep assessments current
3. **Document CPD activities** - Show progress toward gap closure
4. **Communicate barriers** - If low interest, explain why

---

## Technical Implementation

### Location
`src/components/accountancy/team/GapAnalysis.tsx`

### Key Code
```typescript
const priority = cell.gap * (cell.interestLevel || 1);
```

### Algorithm Selection
The platform supports two modes:
- **`weighted`**: Uses gap × interest (recommended)
- **`simple`**: Uses gap only (fallback)

Set via the `priorityAlgorithm` prop on the `GapAnalysis` component.

---

## Future Enhancements

1. **Machine Learning Integration**
   - Predict optimal training sequences
   - Learn from past success rates
   - Personalize recommendations

2. **Team-Level Optimization**
   - Balance skill coverage across team
   - Identify complementary skill pairs
   - Optimize for project requirements

3. **ROI Tracking**
   - Measure actual skill improvement vs. investment
   - Calculate training effectiveness by type
   - Adjust priorities based on historical data

---

## Questions?

For technical questions, see the code in:
- `src/components/accountancy/team/GapAnalysis.tsx`
- `src/pages/accountancy/team/AdvisorySkillsPage.tsx`

For methodology questions, contact your TORSOR administrator.

