# Torsor V2 - Clean Rebuild

A clean, focused rebuild of the Torsor Practice Platform.

## What's Different

- ✅ **Simple**: Direct queries, no complex abstractions
- ✅ **Focused**: One feature at a time
- ✅ **Maintainable**: Flat structure, clear components
- ✅ **Fast**: Minimal dependencies, optimized rendering

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Supabase (existing database with all data)
- React Query (server state)

## Get Started

```bash
npm install
npm run dev
```

## Current Features

### Phase 1: ✅ Complete
- Login/logout
- Skills Heatmap (all 16 team members, 123 skills, 1,663 assessments)

### Coming Next
- Service Line Readiness
- Assessment Views
- Assessment Forms

## Project Structure

```
src/
  pages/           # One page per route
  components/      # Reusable UI components  
  hooks/           # Data fetching hooks
  lib/             # Supabase client, types
```

## Philosophy

**Build one feature. Get it working. Move to the next.**

No over-engineering. No premature optimization. Just clean, working code.
