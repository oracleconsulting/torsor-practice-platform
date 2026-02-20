# UI/UX — System Summary & Scope

**Purpose:** Reference for assessing the UI/UX of the admin side of torsor.co.uk and the client portal. This folder contains **display-only** copies: pages, components, layouts, config, types, and migrations that define where data is sourced for the UI. Edge functions are out of scope (focus on display).

**This folder and summary are read-only in normal work; update the summary only when explicitly requested.**

**Last updated:** February 2026.

---

## 1. Scope

| Area | Contents (flat copies in this folder) |
|------|----------------------------------------|
| **Admin (torsor.co.uk)** | `src/`: App, Navigation, Layout, pages/*, components/*, config/*, types/*, hooks/*, selected lib (service-registry, advisory-services-full, issue-service-mapping, service-calculations, types). |
| **Platform app** | `apps/platform/src/`: full tree flattened with prefix `platform-` (App, pages, components, contexts, hooks, config, types, lib). |
| **Client portal** | `apps/client-portal/src/`: full tree flattened with prefix `client-` (App, pages, components, hooks, config, etc.). |
| **Data source** | All `supabase/migrations/*.sql` copied as `migrations-<name>.sql` — RLS, tables, and views that feed the UI. |
| **Master reference** | `TORSOR_PRACTICE_PLATFORM_MASTER.md` — same file as in other analysis folders; source of truth: `docs/TORSOR_PRACTICE_PLATFORM_MASTER.md`. |

---

## 2. Admin (src/) — Key display surfaces

- **Navigation / Layout:** `admin-Navigation.tsx`, `admin-Layout.tsx`, `admin-App.tsx`
- **Pages:** All under `admin-pages-*` (e.g. ClientServicesPage, DeliveryManagementPage, SkillsHeatmapPage, ServiceReadinessPage, CPDTrackerPage, TechDatabasePage, GADashboardPage, etc.)
- **Components:** All under `admin-components-*` (benchmarking, discovery, management-accounts, admin, etc.)
- **Config / types:** `admin-config-*`, `admin-types-*` — drive assessments and service display
- **Hooks / lib:** `admin-hooks-*`, `admin-lib-*` — data and calculations for UI

---

## 3. Platform app (apps/platform)

- **Entry:** `platform-App.tsx`, `platform-main.tsx`
- **Pages:** e.g. `platform-pages-ClientsPage.tsx`, `platform-pages-ClientDetailPage.tsx`, `platform-pages-DashboardPage.tsx`, `platform-pages-LoginPage.tsx`, RoadmapReviewPage, MAPreCallPage
- **Components:** roadmap, services (management-accounts, systems-audit), Layout, AuthContext, etc.
- **Config / types:** assessments (systems-audit-discovery, process-deep-dives), types (systems-audit, management-accounts-v2)

---

## 4. Client portal (apps/client-portal)

- **Entry:** `client-App.tsx`, `client-main.tsx`
- **Pages:** Dashboard, UnifiedDashboardPage, discovery (DestinationDiscoveryPage, DiscoveryReportPage, DiscoveryFollowUpPage, etc.), services (ServiceAssessmentPage, SystemInventoryPage, ProcessDeepDivesPage, SAReportPage, BenchmarkingReportPage, MADashboardPage, RoadmapPage, TasksPage), assessments (Part1/2/3, ReviewPage), sprint (SprintDashboardPage), progress, LifeThreadPage, ReportsPage, LoginPage, SignupPage, InvitationPage, etc.
- **Components:** assessment, progress, sprint, discovery, management-accounts, bi-dashboard, Layout, ProtectedRoute, etc.
- **Config:** `client-config-serviceLineAssessments.ts`, `client-config-staffInterviewQuestions.ts`, `client-lib-service-registry.ts`

---

## 5. Migrations (data for display)

All migrations in `supabase/migrations/` are copied as `migrations-<timestamp_name>.sql`. They define:

- Tables and views that the admin and client UIs read from
- RLS policies that control what each role (staff vs client) sees
- Columns and statuses that drive display (e.g. report status, shared flags, client_owner_id)

Use these when analysing where displayed data comes from and how access is controlled.

---

## 6. Refresh and rules

- **To refresh copies after live changes:** from repo root run  
  **`./torsor-practice-platform/scripts/sync-ui-ux-assessment-copies.sh`**
- **Do not edit** files in this folder during normal development; make changes in the live codebase and re-run the script.
- **Update this summary** only when the user explicitly asks to update or refresh the UI/UX summary.
