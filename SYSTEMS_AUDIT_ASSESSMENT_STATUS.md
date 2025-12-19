# Systems Audit Assessment Status

## Current Situation

There are **TWO different Systems Audit assessment configurations**:

### 1. Old Assessment (Currently Active)
- **Location**: `apps/client-portal/src/config/serviceLineAssessments.ts`
- **Format**: `ServiceLineAssessment` (15 questions, 5 sections)
- **Status**: ✅ Working in client portal
- **Used by**: Client portal assessment page

### 2. New Stage 1 Discovery (Not Active)
- **Location**: `apps/platform/src/config/assessments/systems-audit-discovery.ts`
- **Format**: `AssessmentConfig` (19 questions, 6 sections)
- **Status**: ❌ Not connected to client portal
- **Used by**: Should be used for Systems Audit Stage 1

## Issues

1. **Client Portal**: Shows blank page due to React infinite loop error #310
2. **Admin Portal**: Can't see questions because they're in codebase config, not database
3. **Mismatch**: Client portal uses old 15-question assessment, not new 19-question Stage 1

## Solutions Needed

1. **Fix React Infinite Loop**: The `useEffect` at line 240 in `ServiceAssessmentPage.tsx` is causing infinite re-renders
2. **Update Client Portal**: Replace old assessment with new Stage 1 Discovery config (convert format)
3. **Update Admin Portal**: Import and display questions from codebase config instead of database

## Next Steps

1. Convert `systemsAuditDiscoveryConfig` to `ServiceLineAssessment` format
2. Replace `SYSTEMS_AUDIT_ASSESSMENT` in client portal config
3. Update admin page to import and display from config file
4. Test that React error is resolved

