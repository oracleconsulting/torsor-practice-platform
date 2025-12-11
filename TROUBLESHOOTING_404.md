# Troubleshooting 404 Error for accept-invitation Function

## Issue
Getting 404 error when clicking invitation links:
```
Failed to load resource: 404
https://mvdejlkiqslwrbarwxkw.supabase.co/functions/v1/accept-invitation?action=validate&token=...
```

## Steps to Fix

### 1. Verify Function is Deployed
```bash
# Check if function exists in Supabase
supabase functions list --project-ref mvdejlkiqslwrbarwxkw
```

### 2. Redeploy the Function
```bash
cd torsor-practice-platform
supabase functions deploy accept-invitation --project-ref mvdejlkiqslwrbarwxkw
```

### 3. Verify Environment Variables
Make sure these are set in Supabase Edge Function secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Check Function Logs
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → `accept-invitation`
3. Check the Logs tab
4. Try clicking an invitation link
5. See if any errors appear in the logs

### 5. Test Function Directly
```bash
# Test with curl
curl "https://mvdejlkiqslwrbarwxkw.supabase.co/functions/v1/accept-invitation?action=validate&token=YOUR_TOKEN" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 6. Verify Function Name
Make sure the function folder name matches exactly:
- Folder: `supabase/functions/accept-invitation/`
- Function name in code: `accept-invitation`
- URL: `/functions/v1/accept-invitation`

### 7. Check CORS Headers
The function should return CORS headers. Verify in the code that `corsHeaders` are included in all responses.

## Common Issues

1. **Function not deployed**: Most common cause - redeploy the function
2. **Wrong project ref**: Make sure you're deploying to the correct Supabase project
3. **Missing environment variables**: Check Supabase Dashboard → Edge Functions → Settings → Secrets
4. **Function name mismatch**: Folder name must match the function name exactly
