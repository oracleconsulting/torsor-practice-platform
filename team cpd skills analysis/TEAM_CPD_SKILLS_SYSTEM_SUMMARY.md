# Team / CPD / Skills / Interests / Mentoring — System Summary & Scope

**Purpose:** Reference for assessing everything related to team, CPD, skills assessment, interests, mentoring, and service readiness in torsor-practice-platform. This folder contains read-only copies of the live files for use in a separate Claude project.

**This folder and summary are read-only in normal work; update the summary only when explicitly requested.**

**Last updated:** February 2026.

---

## 1. Scope

| Area | Contents (flat copies in this folder) |
|------|----------------------------------------|
| **Admin pages** | CPDTrackerPage, TrainingPlansPage, TeamAnalyticsPage, SkillsManagementPage, SkillsHeatmapPage, ServiceReadinessPage. |
| **Admin components** | SkillsHeatmapGrid, ServiceReadinessCard. |
| **Lib** | service-calculations (readiness, skill gaps), advisory-services (required skills per service line), types (Skill, PracticeMember, SkillAssessment). |
| **Hooks** | useServiceReadiness, useTeamMembers. |
| **Migrations** | practice_members (client_owner, hide_discovery_in_portal), skills / skill_assessments (where defined), service_skill_requirements, service_line_interests (where defined), staff RLS, service_line_assessments RLS staff. Plus any migration that references skills, skill_assessments, practice_members, service_line_interests, service_skill_requirements. |
| **Docs** | SERVICE_LINE_SKILLS_MAPPING.md (if present at repo root). |
| **Master reference** | TORSOR_PRACTICE_PLATFORM_MASTER.md — source of truth: docs/TORSOR_PRACTICE_PLATFORM_MASTER.md. |

---

## 2. Data model (from master doc and migrations)

- **practice_members:** Staff and clients; `client_owner_id` for assignment; `hide_discovery_in_portal` for client visibility.
- **skills:** 111 active skills in 10 categories (Advisory & Consulting, Client Management, Communication, Financial Analysis, etc.).
- **skill_assessments:** Per-member, per-skill current level (member_id, skill_id, current_level).
- **service_skill_requirements:** Maps services to required skills (service_id, skill_id, importance, minimum_level, ideal_level).
- **service_line_interests:** Per-member, per-service interest (practice_member_id, service_line, interest_rank, current_experience_level, desired_involvement_pct). Used by service readiness and team analytics.

Readiness is derived from service line → required skills (advisory-services or DB) and member assessments + interests.

---

## 3. Key UI surfaces

- **Skills heatmap:** SkillsHeatmapPage + SkillsHeatmapGrid — member × skill levels.
- **Service readiness:** ServiceReadinessPage + ServiceReadinessCard + useServiceReadiness — readiness per service line, gaps, team members capable.
- **Team analytics:** TeamAnalyticsPage.
- **Skills management:** SkillsManagementPage (CRUD/config for skills).
- **CPD:** CPDTrackerPage.
- **Training / mentoring:** TrainingPlansPage (and any related components).

---

## 4. Refresh and rules

- **To refresh copies after live changes:** from repo root run  
  **`./torsor-practice-platform/scripts/sync-team-cpd-skills-assessment-copies.sh`**
- **Do not edit** files in this folder during normal development; make changes in the live codebase and re-run the script.
- **Update this summary** only when the user explicitly asks to update or refresh the Team/CPD/Skills summary.
