# Troubleshooting Guide

## Localhost Not Showing Latest Changes

If `localhost:3000` is not showing your latest development changes, try these solutions:

### 1. Clear Next.js Build Cache

```bash
# Stop the dev server (Ctrl+C)
# Then delete .next folder
rm -rf .next
# Or on Windows PowerShell:
Remove-Item -Recurse -Force .next

# Restart dev server
npm run dev
```

### 2. Hard Refresh Browser

- **Chrome/Edge**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
- Or open DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

### 3. Clear Browser Cache

1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Click "Clear site data" or "Clear storage"
4. Refresh the page

### 4. Restart Dev Server

```bash
# Stop the server (Ctrl+C in terminal)
# Then restart
npm run dev
```

### 5. Check for Service Workers

If you have service workers enabled:
1. Open DevTools (F12)
2. Go to Application → Service Workers
3. Click "Unregister"
4. Refresh the page

### 6. Clear Node Modules Cache (if needed)

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
npm run dev
```

### 7. Check File Watchers

If hot reload isn't working:
- Ensure you're editing files in the project directory
- Check if file watchers are working (should see "compiling..." in terminal)
- Try saving the file again

### 8. Disable Browser Extensions

Some browser extensions can interfere with hot reload:
- Try incognito/private mode
- Disable extensions temporarily

### 9. Check Environment Variables

Ensure `.env.local` is up to date:
```bash
# Check if file exists and has latest values
cat .env.local
```

### 10. Verify Dev Server is Running

Check terminal output:
- Should see "Ready in X ms"
- Should see "compiled successfully" when you save files
- Check for any error messages

---

## Common Issues

### Issue: Changes not reflecting after code update

**Solution**: 
1. Clear `.next` folder
2. Hard refresh browser (Ctrl+Shift+R)
3. Restart dev server

### Issue: Hot reload not working

**Solution**:
1. Check terminal for compilation errors
2. Ensure file is saved
3. Check if file watchers are working
4. Restart dev server

### Issue: Stale data showing

**Solution**:
1. Clear browser cache
2. Check if using cached API responses
3. Verify backend is using latest data source
4. Check `ARTICLES_BACKEND` environment variable

### Issue: Azure data not updating

**Note**: Localhost doesn't use Azure directly unless configured.

**If using Cosmos DB**:
1. Check `ARTICLES_BACKEND=cosmos` is set
2. Verify Cosmos DB connection
3. Check if data exists in Cosmos DB
4. Restart dev server after changing env vars

**If using mock data**:
- Changes to `app/api/articles/data.ts` require server restart
- In-memory store resets on server restart

---

## Quick Fix Commands

```bash
# Complete reset (Windows PowerShell)
Remove-Item -Recurse -Force .next
npm run dev

# Complete reset (Linux/Mac)
rm -rf .next
npm run dev

# With browser cache clear
# 1. Run above commands
# 2. Open browser in incognito mode
# 3. Navigate to localhost:3000
```

---

## Still Not Working?

1. **Check terminal for errors** - Look for compilation errors
2. **Check browser console** - Look for JavaScript errors (F12)
3. **Verify file changes** - Make a visible change (like adding a comment) to test
4. **Check Next.js version** - Ensure you're using Next.js 16
5. **Restart everything** - Close terminal, close browser, restart both

---

## Prevention

- Always hard refresh (Ctrl+Shift+R) after major changes
- Clear `.next` folder when switching branches
- Restart dev server after changing environment variables
- Use browser DevTools to verify network requests are fresh

