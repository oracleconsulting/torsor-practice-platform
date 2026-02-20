# Deploying Edge Functions

## Why am I still hitting 150s timeout on Pro?

If you're on **Pro** but Edge Functions still die at ~150 seconds, the usual cause is **project compute size**, not billing:

- **Nano** (free-tier compute) → **150s** max for Edge Functions.
- **Micro** and above (paid compute) → **400s** max.

Projects that started on Free and then upgraded to Pro often **stay on Nano compute**. Supabase does not auto-upgrade it (there’s a short downtime). So you can be on the Pro *plan* but still have Nano *compute*, which keeps the 150s limit.

**Fix:** In the [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings** → **Compute and Disk**, check the compute size. If it says **Nano**, change it to **Micro**. On Pro you get $10/month compute credits that cover Micro; the upgrade usually takes under 2 minutes of downtime. After that, Edge Functions can run up to 400s.

### I'm already on Micro but still hit 150s

Then the limit may be applied elsewhere (e.g. gateway or per-function default):

1. **Deploy with an explicit timeout** so the function is set to use the higher limit:
   ```bash
   supabase functions deploy process-sa-transcript --project-ref mvdejlkiqslwrbarwxkw --max-timeout 400
   ```
   (Use `--timeout 400` if your CLI uses that instead of `--max-timeout`.)

2. **Ask Supabase** – In the dashboard, open **Support** or the [community](https://github.com/supabase/supabase/discussions) and ask: “Edge Function hits 150s on Pro with Micro compute; is there a gateway or per-function timeout we need to set?” They can confirm whether a 150s cap exists in front of the worker and how to change it.

3. **Stay under 150s in code** – The `process-sa-transcript` function can use a faster model for large transcripts/gap counts so the run finishes in under 150s; see the function’s model selection logic.

---

## 1. Verify project link

From the repo root (or `supabase/`):

```bash
supabase status
```

You should see your **project ref** (e.g. `mvdejlkiqslwrbarwxkw`). If you see an error or a different project:

```bash
supabase link --project-ref mvdejlkiqslwrbarwxkw
```

Then run `supabase status` again to confirm.

## 2. Deploy a function

From the **repo root** (so `supabase/functions/` is the functions dir):

```bash
supabase functions deploy process-sa-transcript --project-ref mvdejlkiqslwrbarwxkw
```

For **Pro plan** projects you can set a custom timeout (up to 400s):

```bash
supabase functions deploy process-sa-transcript --project-ref mvdejlkiqslwrbarwxkw --max-timeout 300
```

Watch the terminal output. You should see something like:

- `Deployed function process-sa-transcript (deployment 4)`  
- or an error message (permissions, network, invalid ref, etc.)

If the count doesn’t increase, the deploy didn’t succeed — copy the full terminal output to debug.

## 3. Timeout limits (wall clock)

Supabase **does not** let you increase the limit per function. The limit is per **plan**:

| Plan | Max duration |
|------|----------------|
| Free | **150 seconds** |
| Pro  | **400 seconds** |

- **Free:** If `process-sa-transcript` hits 150s (long transcript or many gaps), the function is killed (546 / wall clock). Fix: upgrade to Pro, or keep transcripts shorter / fewer gaps per run.
- **Pro:** 400s is usually enough for one transcript run. Use `--max-timeout 300` on deploy if you want a 300s cap; otherwise the function can run up to 400s.

No per-function config in `config.toml` or dashboard changes this; the only way to get a higher limit is a higher plan or self-hosting.

## 4. If you still hit timeout (Pro)

- Shorten the transcript or send it in chunks.
- Reduce the number of gaps per request (e.g. process in two calls).
- The function already writes to the DB before responding; if the **client** times out, the work may still complete — user can refresh to see results (see log message about “Client connection closed”).
