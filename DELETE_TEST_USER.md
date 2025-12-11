# Delete Test Auth User

If you have a test user that's causing login issues, you can delete it using this utility function.

## Option 1: Use the Edge Function (Recommended)

### Deploy the function first:
```bash
cd torsor-practice-platform
supabase functions deploy delete-test-user --project-ref mvdejlkiqslwrbarwxkw
```

### Then call it:
```bash
curl -X POST \
  "https://mvdejlkiqslwrbarwxkw.supabase.co/functions/v1/delete-test-user" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "james@ivcaccounting.co.uk", "practiceId": "8624cd8c-b4c2-4fc3-85b8-e559d14b0568"}'
```

## Option 2: Delete via Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user by email
3. Click the 3 dots menu → Delete User
4. Confirm deletion

## Option 3: Reset Password Instead

If you just want to reset the password:

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user by email
3. Click the 3 dots menu → Send password reset email
4. Or manually set a new password in the user details

## Option 4: SQL Script (Advanced)

Run this in Supabase SQL Editor:

```sql
-- Delete auth user and related records
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'james@ivcaccounting.co.uk';
BEGIN
  -- Find user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NOT NULL THEN
    -- Delete related records
    DELETE FROM client_service_lines WHERE client_id = v_user_id;
    DELETE FROM practice_members WHERE email = v_email AND member_type = 'client';
    DELETE FROM client_invitations WHERE email = v_email;
    
    -- Delete auth user (requires admin privileges)
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Deleted user: %', v_email;
  ELSE
    RAISE NOTICE 'User not found: %', v_email;
  END IF;
END $$;
```

**Note:** Deleting from `auth.users` directly requires super admin privileges. Use the Edge Function or Dashboard instead.
