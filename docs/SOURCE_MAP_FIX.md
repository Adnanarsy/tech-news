# Source Map Error Fix

## Issue

When viewing a created article, you see this console error:
```
Invalid source map. Only conformant source maps can be used to find the original code.
Cause: Error: sourceMapURL could not be parsed
```

## What This Means

This is a **development-only warning** from Next.js source maps. It doesn't break functionality, but it's annoying.

## Fixes Applied

### 1. Fixed Article Page Fetching

**File**: `app/news/[id]/page.tsx`

**Changed**: From using `fetch` with `NEXT_PUBLIC_BASE_URL` to direct repository access

**Before**:
```typescript
const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/articles/${id}`, {
  next: { revalidate: 60 },
});
```

**After**:
```typescript
const repo = getArticleRepository();
const article = await repo.getById(id);
```

**Why**: More reliable, doesn't depend on `NEXT_PUBLIC_BASE_URL` being set

### 2. Disabled Source Maps in Development

**File**: `next.config.ts`

Added webpack config to disable source maps in development:
```typescript
webpack: (config, { dev }) => {
  if (dev) {
    config.devtool = false; // Disable source maps in dev
  }
  return config;
}
```

## How to Apply

1. **Stop dev server** (Ctrl+C)

2. **Clear cache**:
   ```powershell
   Remove-Item -Recurse -Force .next
   ```

3. **Restart dev server**:
   ```powershell
   npm run dev
   ```

4. **Hard refresh browser** (Ctrl+Shift+R)

## Verification

After restarting:
- ✅ Source map warning should be gone
- ✅ Article pages should load correctly
- ✅ Created articles should be viewable

## Note

The source map error was just a warning. The real fix was improving how articles are fetched. The article page now uses direct repository access, which is more reliable than HTTP fetch in server components.

---

**Status**: ✅ Fixed  
**Last Updated**: December 2024

