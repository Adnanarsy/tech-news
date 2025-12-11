# Fix: Localhost Not Updating

## Problem

Your `localhost:3000` is not showing the latest changes even though:
- ✅ Branches are in sync (main = deployment)
- ✅ Code is committed
- ✅ Azure App Service is using main branch

## Root Cause

The local development server is running with **cached build files** from the `.next` folder. Even though your code is updated, Next.js is serving old compiled files.

## Solution (3 Steps)

### Step 1: Stop Dev Server

**Find and stop the dev server:**
```powershell
# Find Node processes
Get-Process -Name node | Where-Object {$_.Path -like "*node.exe*"}

# Stop the dev server process (or just press Ctrl+C in the terminal running npm run dev)
```

**Or simply:**
- Go to the terminal where `npm run dev` is running
- Press `Ctrl+C` to stop it

### Step 2: Clear Cache

```powershell
# Clear Next.js build cache
Remove-Item -Recurse -Force .next

# Or use the script
.\scripts\clear-cache.ps1
```

### Step 3: Restart & Hard Refresh

```powershell
# Restart dev server
npm run dev
```

**Then in browser:**
- Press `Ctrl+Shift+R` (hard refresh)
- Or open DevTools (F12) → Right-click refresh → "Empty Cache and Hard Reload"

## Quick One-Liner Fix

```powershell
# Stop server (Ctrl+C), then run:
Remove-Item -Recurse -Force .next; npm run dev
```

Then hard refresh browser: `Ctrl+Shift+R`

## Why This Happens

1. **Next.js caches builds** in `.next` folder for performance
2. **Hot reload doesn't always catch** all changes (especially config changes)
3. **Browser caches** JavaScript/CSS files
4. **Old processes** may still be running

## Prevention

- Always restart dev server after:
  - Changing `next.config.ts`
  - Changing environment variables
  - Switching branches
  - Major code refactoring

- Use hard refresh (`Ctrl+Shift+R`) when:
  - Changes don't appear
  - After clearing cache
  - After restarting server

## Verify It's Working

After restarting:
1. Check terminal shows: `✓ Ready in X ms`
2. Make a visible change (add a comment in code)
3. Save the file
4. Terminal should show: `○ Compiling...` then `✓ Compiled`
5. Browser should auto-refresh

## Still Not Working?

1. **Check if dev server is actually running:**
   ```powershell
   # Should see Next.js process
   Get-Process -Name node
   ```

2. **Check terminal for errors:**
   - Look for compilation errors
   - Check for missing dependencies

3. **Try incognito mode:**
   - Opens browser without cache
   - Tests if it's a browser cache issue

4. **Nuclear option:**
   ```powershell
   # Complete reset
   Remove-Item -Recurse -Force .next
   Remove-Item -Recurse -Force node_modules
   npm install
   npm run dev
   ```

---

**Note**: This is a **local development issue**, not related to Azure. Azure App Service uses the code from your `main` branch, which is up to date. The localhost issue is just cached files on your machine.

