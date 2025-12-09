# Quick Test Checklist - SRS Requirements

Use this checklist to quickly verify all SRS requirements.

## Setup (One-time)

```bash
# 1. Install dependencies
npm install

# 2. Create test admin user
npm run create-admin admin@test.com admin123 "Admin User"

# 3. Start dev server
npm run dev
```

---

## Quick Test Commands

### Automated Tests

```bash
# Run all E2E tests (includes requirements tests)
npm run test:e2e

# Run only requirements tests
npm run test:requirements

# Run API tests (bash script - Linux/Mac)
npm run test:api
# Or on Windows: bash scripts/test-requirements.sh

# Run unit tests
npm test
```

### Manual Testing

1. **Open browser**: `http://localhost:3000`

2. **Test each requirement** using the checklist below

---

## Test Checklist

### ✅ A.1 Public Access

- [ ] **Homepage Feed**
  - Go to `http://localhost:3000`
  - Verify articles display with title, image, description, category
  - **Pass/Fail**: ☐

- [ ] **Pagination**
  - Scroll down homepage
  - Verify new articles load
  - Check no duplicates appear
  - **Pass/Fail**: ☐

- [ ] **Article Detail**
  - Click any article
  - Verify full article body displays
  - **Pass/Fail**: ☐

- [ ] **Search**
  - Click search icon
  - Type "technology"
  - Verify results filter by title
  - Test case-insensitive: "TECHNOLOGY" should work
  - **Pass/Fail**: ☐

- [ ] **Category Filtering**
  - Check if category filters exist
  - Click a category (e.g., "trending")
  - Verify only that category's articles show
  - **Pass/Fail**: ☐

### ✅ A.2 Content Management

- [ ] **Article Creation**
  - Sign in as admin: `http://localhost:3000/signin`
  - Go to `/admin/upload`
  - Create article with title, category, body, image
  - Submit and verify success
  - **Pass/Fail**: ☐

- [ ] **Data Persistence**
  - Create article (from above)
  - Restart server: `npm run dev`
  - Verify article still exists on homepage
  - **Pass/Fail**: ☐

- [ ] **Backend Switching**
  - Set `ARTICLES_BACKEND=mock` in `.env.local`
  - Restart server
  - Verify articles load
  - Set `ARTICLES_BACKEND=cosmos` in `.env.local`
  - Restart server
  - Verify articles load from Cosmos
  - **Pass/Fail**: ☐

### ✅ A.3 Authentication & RBAC

- [ ] **Login**
  - Go to `/signin`
  - Enter: `admin@test.com` / `admin123`
  - Click "Sign in"
  - Verify redirect to admin dashboard
  - **Pass/Fail**: ☐

- [ ] **Role Protection**
  - Sign out (or use incognito)
  - Try to access `/admin`
  - Verify redirect to `/signin`
  - Sign in as admin
  - Access `/admin` - should work
  - **Pass/Fail**: ☐

- [ ] **Session Persistence**
  - Sign in as admin
  - Go to `/admin`
  - Refresh page (F5)
  - Verify still logged in
  - **Pass/Fail**: ☐

### ✅ A.4 PHE Scoring

- [ ] **Key Management**
  - Sign in as admin
  - Go to `/admin/crypto`
  - Verify public key (N, G, version) is displayed
  - Verify private key is NOT displayed
  - Check API: `http://localhost:3000/api/phe/public-key`
  - **Pass/Fail**: ☐

- [ ] **Encrypted Scoring**
  - Sign in as regular user
  - Open an article (triggers `open` event)
  - Read for >10s and scroll >50% (triggers `read`)
  - Click "Interested" (triggers `interested`)
  - Open browser DevTools → Network tab
  - Find POST `/api/phe/score` request
  - Verify payload contains encrypted values (base64 strings)
  - **Pass/Fail**: ☐

- [ ] **Client Anonymity**
  - Check server logs (terminal where `npm run dev` is running)
  - Verify only encrypted values appear
  - No plain numbers like "user likes politics: 50"
  - Check Cosmos DB `interests` container (if accessible)
  - Values should be encrypted strings
  - **Pass/Fail**: ☐

---

## Quick API Tests

Open terminal and run:

```bash
# Test homepage
curl http://localhost:3000

# Test articles API
curl http://localhost:3000/api/articles/latest?limit=5

# Test search
curl "http://localhost:3000/api/articles/search?q=technology"

# Test public key (should NOT expose private key)
curl http://localhost:3000/api/phe/public-key

# Test admin protection (should return 302/401/403)
curl -I http://localhost:3000/admin
```

---

## Browser DevTools Testing

1. **Open DevTools** (F12)
2. **Network Tab** - Monitor API calls
3. **Console Tab** - Check for errors
4. **Application Tab** - Check cookies/session

### Test PHE Events:
```javascript
// In browser console on article page:
// 1. Open article - should see PheEmitter.emitOpen()
// 2. Wait 10s + scroll - should see PheEmitter.emitRead()
// 3. Click Interested - should see PheEmitter.emitInterested()
// 4. Check Network tab for POST /api/phe/score
```

---

## Expected Results Summary

| Requirement | Expected Result | How to Verify |
|------------|----------------|---------------|
| Homepage Feed | Articles display | Visual check |
| Pagination | No duplicates | Scroll and count |
| Article Detail | Full content shown | Click article |
| Search | Filters by title | Use search box |
| Category Filter | Only category articles | Click category |
| Article Creation | Article saved | Create via `/admin/upload` |
| Data Persistence | Survives restart | Restart server |
| Backend Switch | Works with both | Change env var |
| Login | Redirects after login | Sign in |
| Role Protection | Blocks non-admins | Try `/admin` without auth |
| Session | Persists refresh | Refresh page |
| Public Key | Visible to client | Check `/admin/crypto` |
| Encrypted Scoring | Encrypted values stored | Check Network tab |
| Client Anonymity | Server never sees plain scores | Check logs/DB |

---

## Troubleshooting

**Articles not loading?**
- Check `ARTICLES_BACKEND` env var
- Verify Cosmos DB connection
- Check API: `curl http://localhost:3000/api/articles/latest`

**Can't sign in?**
- Verify user exists: Check Cosmos DB
- Check `NEXTAUTH_SECRET` is set
- Verify password hash is correct

**PHE not working?**
- Check `/api/phe/public-key` returns valid key
- Verify events are emitted (check console)
- Check Network tab for `/api/phe/score` requests

---

## Next Steps

After testing:
1. Document any failures
2. Create bug reports
3. Update requirements if gaps found
4. Add more automated tests

For detailed testing procedures, see `docs/TESTING_GUIDE.md`

