# Verify Function Deployment

## Check if accept-invitation is Actually Deployed

### 1. List All Functions
```bash
supabase functions list --project-ref mvdejlkiqslwrbarwxkw
```

You should see `accept-invitation` in the list.

### 2. Test Function Directly
```bash
# Replace YOUR_TOKEN with an actual invitation token
curl -X GET \
  "https://mvdejlkiqslwrbarwxkw.supabase.co/functions/v1/accept-invitation?action=validate&token=YOUR_TOKEN" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### 3. Check Function Logs in Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/mvdejlkiqslwrbarwxkw
2. Navigate to Edge Functions
3. Click on `accept-invitation`
4. Go to Logs tab
5. Try clicking an invitation link
6. Check if any logs appear

### 4. Verify Function Code is Deployed
The function should handle GET requests with `?action=validate&token=...`

### 5. Check Environment Variables
In Supabase Dashboard → Edge Functions → Settings → Secrets:
- `SUPABASE_URL` should be set
- `SUPABASE_SERVICE_ROLE_KEY` should be set

## Common Issues

### Function Returns 404
- Function name might be wrong
- Function might not be deployed to the correct project
- Check the exact URL being called matches the function name

### Function Returns 500
- Check environment variables are set
- Check function logs for errors
- Verify database tables exist (`client_invitations`)

### Email Still Has White Text
- Make sure `send-client-invitation` function was redeployed
- Send a NEW invitation after redeploying (old emails won't update)
- Check Resend dashboard to see the actual email HTML
