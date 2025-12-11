# Deploy accept-invitation Edge Function

The `accept-invitation` edge function needs to be deployed to Supabase for client invitations to work.

## Quick Deploy

```bash
cd torsor-practice-platform
supabase functions deploy accept-invitation --project-ref mvdejlkiqslwrbarwxkw
```

## What This Function Does

- Validates invitation tokens (GET request)
- Accepts invitations and creates client accounts (POST request)
- Creates auth users, practice_members records, and service enrollments

## Verify Deployment

After deploying, test the function:

```bash
# Test validation endpoint
curl "https://mvdejlkiqslwrbarwxkw.supabase.co/functions/v1/accept-invitation?action=validate&token=YOUR_TOKEN" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Environment Variables Required

Make sure these are set in Supabase Edge Function secrets:
- `SUPABASE_URL` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (required for creating users)
