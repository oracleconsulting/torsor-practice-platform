# 🔧 Forcing Node 20 with nixpacks.toml

## The Issue

Railway keeps using Node 22.11.0 (cached) even though we specified Node 20 in:
- ❌ `.nvmrc`
- ❌ `package.json` engines
- ❌ `railway.json`

## The Solution

Created **`nixpacks.toml`** which has the HIGHEST priority for Nixpacks build configuration.

```toml
[phases.setup]
nixPkgs = ['nodejs_20']
```

This will **force** Railway to use Node 20 no matter what.

## Why This Works

Nixpacks reads configuration in this order (highest to lowest priority):
1. **`nixpacks.toml`** ← We just added this
2. `railway.json`
3. Auto-detection
4. Defaults

So now it MUST use Node 20.

## What's Next

Railway is redeploying now (3-4 minutes).

You should see in the build logs:
```
setup │ nodejs_20, npm-9_x
```

Instead of:
```
setup │ nodejs_22, npm-9_x  ← BAD
```

Once it shows `nodejs_20`, the deployment will work! 🎉

---

**This is the final fix** - nixpacks.toml is the authoritative configuration file.

