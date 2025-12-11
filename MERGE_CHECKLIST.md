# Merge Checklist - Before Merging Branches

## Current Status

- **Branch**: `deployment`
- **Uncommitted Files**: 
  - `package.json` (modified)
  - `docs/TROUBLESHOOTING.md` (new)
  - `scripts/clear-cache.ps1` (new)
  - `scripts/clear-cache.sh` (new)
  - `.env.example` (new - should be created)

## Issues Found & Fixed

### ✅ 1. Missing `.env.example` File
**Status**: Created  
**File**: `.env.example`  
**Action**: Commit this file

### ✅ 2. Uncommitted Changes
**Status**: Need to commit  
**Files**: package.json, docs/, scripts/  
**Action**: Commit before merging

### ⚠️ 3. Branch Strategy
**Current**: On `deployment` branch  
**Recommendation**: 
- If merging `deployment` → `main`: Good
- If updating `main` → `deployment`: Also good
- Make sure both branches are in sync

## Pre-Merge Steps

### Step 1: Commit Current Changes

```bash
# Add all new and modified files
git add package.json
git add docs/TROUBLESHOOTING.md
git add scripts/clear-cache.ps1
git add scripts/clear-cache.sh
git add .env.example

# Commit
git commit -m "Add troubleshooting docs, cache scripts, and env.example template"
```

### Step 2: Test Everything Works

```bash
# Install dependencies
npm install

# Test build
npm run build

# Test dev (in another terminal)
npm run dev
```

### Step 3: Merge Strategy

#### Option A: Merge deployment → main

```bash
# Switch to main
git checkout main

# Pull latest
git pull origin main

# Merge deployment
git merge deployment

# Push
git push origin main
```

#### Option B: Update deployment from main

```bash
# Stay on deployment
git checkout deployment

# Merge main into deployment
git merge main

# Push
git push origin deployment
```

## Files That Should Be Committed

✅ **Must Commit**:
- `.env.example` - Template for environment variables
- `package.json` - Updated with new scripts
- `docs/TROUBLESHOOTING.md` - Troubleshooting guide
- `scripts/clear-cache.ps1` - PowerShell cache script
- `scripts/clear-cache.sh` - Bash cache script

## Files That Should NOT Be Committed

❌ **Already in .gitignore**:
- `.env.local` - Your local secrets
- `.env` - Environment variables
- `.next/` - Build cache
- `node_modules/` - Dependencies

## Common Merge Issues & Solutions

### Issue: Merge Conflicts

**Solution**:
```bash
# See conflicts
git status

# Resolve conflicts in files
# Then:
git add <resolved-files>
git commit
```

### Issue: Branch Diverged

**Solution**:
```bash
# Pull with rebase
git pull --rebase origin main

# Or merge
git pull origin main
```

### Issue: Missing Files After Merge

**Solution**:
```bash
# Check what's missing
git status

# Add missing files
git add <files>
git commit -m "Add missing files"
```

## Verification After Merge

1. ✅ All files committed
2. ✅ No merge conflicts
3. ✅ `npm install` works
4. ✅ `npm run build` succeeds
5. ✅ `npm run dev` starts
6. ✅ Application loads in browser

---

**Created**: December 2024

