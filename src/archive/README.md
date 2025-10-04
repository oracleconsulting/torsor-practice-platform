
# Archive Folder

This folder contains components that have been archived as part of the frontend consolidation effort.

## Archived Components

### `pages/FullRoadmapView.tsx`
- **Archived Date**: Current
- **Reason**: Redundant standalone roadmap page - functionality consolidated into dashboard
- **Replacement**: `src/components/dashboard/RoadmapDisplay.tsx`
- **Previous Routes**: 
  - `/roadmap/full/:groupId`
  - `/roadmap/:groupId`
- **New Navigation**: All roadmap viewing happens within `/dashboard`

## Why These Were Archived

1. **Single Source of Truth**: Consolidated all roadmap display logic into one component
2. **Better UX**: Users don't need to navigate away from their dashboard
3. **Consistent Experience**: Roadmap always shown with full context (board, progress, etc.)
4. **Reduced Maintenance**: Fewer components to maintain and debug
5. **No Redundancy**: Eliminated duplicate functionality

## Restoration Notes

If any of these components need to be restored:
1. Move from `src/archive/` back to their original location
2. Update the routes in `App.tsx`
3. Fix any import references
4. Update navigation links throughout the app

## Related Changes

- Updated `App.tsx` to redirect old roadmap routes to dashboard
- Removed `src/components/roadmap/RoadmapDisplay.tsx` (duplicate)
- Enhanced `src/components/dashboard/RoadmapDisplay.tsx` with full functionality
