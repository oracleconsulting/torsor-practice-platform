# Discovery & Accounts Migrations Index

**Last synced:** 2026-02-10  
**Purpose:** Ordered list of discovery-related and accounts-upload migrations in `supabase/migrations/`. For full schema and data flow see `DISCOVERY_SYSTEM_COMPLETE_ARCHITECTURE.md`.

---

## Discovery + Accounts migrations (chronological)

| Order | Migration file | Purpose |
|-------|----------------|---------|
| 1 | `20251223_fix_destination_discovery_duplicates.sql` | Prevent duplicate destination_discovery rows |
| 2 | `20260115_discovery_assessment_v2.sql` | Core discovery tables (destination_discovery, discovery_engagements, etc.) |
| 3 | `20260115_discovery_report_system.sql` | discovery_reports, report generation |
| 4 | `20260115_discovery_destination_focused.sql` | Destination-focused questions |
| 5 | `20260115_migrate_legacy_discovery.sql` | Legacy data migration |
| 6 | `20260115_discovery_data_completeness.sql` | Data validation |
| 7 | `20260115_fix_discovery_trigger.sql` | Trigger fixes |
| 8 | `20260120_accounts_upload.sql` | client_accounts_uploads, client_financial_data (P&L, balance sheet, revenue, etc.), RLS, get_client_financial_summary |
| 9 | `20260123_discovery_learning_system.sql` | Learning/feedback loop |
| 10 | `20260125_discovery_7dimension_analysis.sql` | 7-dimension analysis |
| 11 | `20260129_fix_discovery_reports_client_rls.sql` | Client portal RLS for discovery_reports |
| 12 | `20260203_add_show_in_client_view_to_opportunities.sql` | show_in_client_view on opportunities |
| 13 | `20260204_expand_context_note_types.sql` | Context note types |
| 14 | `20260205_add_discovery_admin_context.sql` | Admin context for discovery |
| 15 | `20260206_add_followup_responses.sql` | Follow-up responses |
| 16 | `20260207103430_discovery_opportunity_enhancements.sql` | Opportunity enhancements, pinned_services, blocked_services |
| 17 | `20260208120000_discovery_three_phase_pipeline.sql` | Three-phase pipeline |
| 18 | `20260209120000_reset_discovery_pipeline_for_client.sql` | Reset pipeline for client |
| 19 | `20260209140000_discovery_data_audit.sql` | discovery_data_audit_for_client, discovery_data_audit_for_engagement |
| 20 | `20260210180000_add_staff_costs_client_financial_data.sql` | Add staff_costs to client_financial_data |
| 21 | `20260210200000_add_directors_operating_profit_financial_data.sql` | Add directors_remuneration, operating_profit to client_financial_data |

---

## Key tables added by these migrations

- **Discovery:** destination_discovery, discovery_engagements, discovery_reports, discovery_opportunities, client_context, client_financial_context, assessment_patterns, discovery_analysis_comments, etc.
- **Accounts / financial:** client_accounts_uploads, client_financial_data (revenue, staff_costs, directors_remuneration, operating_profit, P&L, balance sheet, fiscal_year), client_financial_data_audit.

---

*Edit live migrations in `torsor-practice-platform/supabase/migrations/`. Copies in this folder are reference only.*
