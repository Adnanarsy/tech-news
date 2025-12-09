# Testing Guide - SRS Requirements Verification

This guide helps you systematically test your TechNews application against the Software Requirements Specification (SRS).

## Prerequisites

1. **Environment Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Set up environment variables in .env.local
   # See .env.example for required variables
   ```

2. **Create Test Users**
   ```bash
   # Create admin user
   npm run create-admin admin@test.com admin123 "Admin User"
   
   # Create regular user (via API or script)
   node scripts/create-admin.js user@test.com user123 "Regular User"
   # Then update role to "user" in Cosmos DB or via /admin/users
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

---

## Part 1: Functional Requirements Testing

### A.1 Public Access (News Reader)

#### ✅ Homepage Feed

**Test Steps:**
1. Navigate to `http://localhost:3000/`
2. Verify the homepage loads without authentication
3. Check that articles are displayed with:
   - Title
   - Image
   - Description/Content preview
   - Category badge

**Expected Result:**
- Homepage displays articles in a grid/list format
- Each article card shows all required fields
- No authentication required

**Verification:**
```bash
# Manual: Open browser and check homepage
# Automated: Run E2E test
npm run test:e2e -- e2e/homepage.spec.ts
```

---

#### ✅ Pagination

**Test Steps:**
1. Navigate to homepage
2. Scroll down to trigger infinite scroll (or click "Load More" if implemented)
3. Verify new articles load
4. Check that no articles are duplicated
5. Note the cursor/offset mechanism

**Expected Result:**
- New articles appear as you scroll
- No duplicate articles in the feed
- Cursor-based pagination works correctly

**Verification:**
```javascript
// Check browser console for API calls
// Look for: /api/articles/latest?cursor=...
// Verify cursor changes between requests
```

**Test Script:**
```bash
# Test pagination API directly
curl "http://localhost:3000/api/articles/latest?limit=5" | jq '.items | length'
curl "http://localhost:3000/api/articles/latest?limit=5&cursor=<cursor_from_previous>" | jq '.items | length'
# Verify different articles returned
```

---

#### ✅ Article Detail

**Test Steps:**
1. Click on any article card from the homepage
2. Verify the article detail page loads (`/news/[id]`)
3. Check that full article body is displayed
4. Verify all article metadata is shown (title, category, date, tags)

**Expected Result:**
- Article detail page shows complete article content
- Markdown/rich text is properly rendered
- Image is displayed if present
- Navigation back to homepage works

**Verification:**
```bash
# Manual: Click article and verify content
# Check URL pattern: /news/{article-id}
```

---

#### ✅ Search

**Test Steps:**
1. Click the search icon/button in navigation
2. Enter a search term (e.g., "technology")
3. Verify search results appear
4. Test case-insensitive search (try "Technology", "TECHNOLOGY", "technology")
5. Test partial matches (e.g., "tech" should match "technology")

**Expected Result:**
- Search modal/page opens
- Results filter by title substring
- Case-insensitive matching works
- Results update in real-time or on submit

**Verification:**
```bash
# Test search API
curl "http://localhost:3000/api/articles/search?q=technology" | jq '.items[] | .title'
curl "http://localhost:3000/api/articles/search?q=TECHNOLOGY" | jq '.items[] | .title'
# Should return same results
```

---

#### ✅ Category Filtering

**Test Steps:**
1. Navigate to homepage
2. Look for category filters (if implemented in UI)
3. Click on a category (e.g., "trending", "deep", "analysis")
4. Verify only articles from that category are shown
5. Test switching between categories

**Expected Result:**
- Category filter works correctly
- Only articles matching the selected category are displayed
- No articles from other categories appear

**Verification:**
```bash
# Test category filtering API
curl "http://localhost:3000/api/articles?category=trending" | jq '.items[] | .category'
# All should be "trending"
curl "http://localhost:3000/api/articles?category=deep" | jq '.items[] | .category'
# All should be "deep"
```

---

### A.2 Content Management (CMS)

#### ✅ Article Creation

**Test Steps:**
1. Sign in as admin (`/signin`)
2. Navigate to `/admin/upload`
3. Fill in the article form:
   - Title
   - Category (dropdown)
   - Body/Content
   - Tags (if supported)
   - Image (upload or URL)
4. Submit the form
5. Verify success message

**Expected Result:**
- Form accepts all required fields
- Image upload works (if implemented)
- Article is created successfully
- Success confirmation is shown

**Verification:**
```bash
# Check if article appears in API
curl "http://localhost:3000/api/articles/latest" | jq '.items[0] | {title, category}'
# Should show your newly created article
```

---

#### ✅ Data Persistence

**Test Steps:**
1. Create an article via `/admin/upload`
2. Note the article ID
3. Restart the server (`npm run dev`)
4. Navigate to homepage
5. Verify the article still exists
6. Check Cosmos DB directly (if configured)

**Expected Result:**
- Article persists after server restart
- Article appears in Cosmos DB `Articles` container (if backend is Cosmos)
- Article is retrievable via API

**Verification:**
```bash
# Check Cosmos DB (if configured)
# Or check API after restart
curl "http://localhost:3000/api/articles/{article-id}" | jq
```

---

#### ✅ Backend Switching

**Test Steps:**
1. Set `ARTICLES_BACKEND=mock` in `.env.local`
2. Restart server
3. Check articles are served from mock data
4. Set `ARTICLES_BACKEND=cosmos` in `.env.local`
5. Restart server
6. Verify articles are served from Cosmos DB

**Expected Result:**
- System switches between backends based on env var
- No errors when switching
- Articles load correctly from both backends

**Verification:**
```bash
# Check which repository is used
# Look for logs or check API response format
# Mock: Deterministic test data
# Cosmos: Real database data
```

---

### A.3 Authentication & RBAC

#### ✅ Login

**Test Steps:**
1. Navigate to `/signin`
2. Enter valid credentials (email + password)
3. Click "Sign in"
4. Verify redirect to homepage or dashboard
5. Check that user session is established

**Expected Result:**
- Login form accepts credentials
- Successful login redirects appropriately
- User session persists (check nav shows user info)

**Verification:**
```bash
# Test login API (if exposed)
# Or use browser dev tools to check session cookie
# Check NextAuth session: http://localhost:3000/api/auth/session
```

---

#### ✅ Role Protection

**Test Steps:**
1. Sign in as regular user (`role: "user"`)
2. Try to access `/admin`
3. Verify redirect to `/signin` or 403 error
4. Sign in as admin (`role: "admin"`)
5. Access `/admin`
6. Verify admin dashboard loads

**Expected Result:**
- Regular users cannot access `/admin` routes
- Admin users can access `/admin` routes
- Middleware properly enforces role checks

**Verification:**
```bash
# Test as regular user
curl -H "Cookie: next-auth.session-token=<user-token>" http://localhost:3000/admin
# Should return 403 or redirect

# Test as admin
curl -H "Cookie: next-auth.session-token=<admin-token>" http://localhost:3000/admin
# Should return 200
```

**Automated Test:**
```bash
npm run test:e2e -- e2e/auth.spec.ts
```

---

#### ✅ Session Persistence

**Test Steps:**
1. Sign in as admin
2. Navigate to `/admin`
3. Refresh the page (F5)
4. Verify you're still logged in
5. Close browser and reopen
6. Navigate to `/admin`
7. Check if session persists (depends on cookie settings)

**Expected Result:**
- Session persists across page refreshes
- JWT token is stored in cookie
- User remains authenticated

**Verification:**
```bash
# Check browser cookies
# Look for: next-auth.session-token
# Check expiration time
```

---

### A.4 PHE (Privacy-Preserving Interest Scoring)

#### ✅ Key Management

**Test Steps:**
1. Sign in as admin
2. Navigate to `/admin/crypto`
3. Verify public key metadata is displayed:
   - Modulus (N)
   - Generator (G)
   - Version
4. Verify private key is NOT displayed
5. Check `/api/phe/public-key` endpoint

**Expected Result:**
- Public key is visible to clients
- Private key is never exposed
- Key metadata is accessible

**Verification:**
```bash
# Test public key endpoint
curl "http://localhost:3000/api/phe/public-key" | jq
# Should return: { n, g, version, generated }
# Should NOT return: lambda, mu (private key parts)

# Check admin page
# Navigate to /admin/crypto and verify UI
```

---

#### ✅ Encrypted Scoring

**Test Steps:**
1. Sign in as a regular user
2. Navigate to homepage
3. Open an article (triggers `open` event)
4. Read the article for >10 seconds and scroll >50% (triggers `read` event)
5. Click "Interested" button (triggers `interested` event)
6. Check browser network tab for `/api/phe/score` requests
7. Verify encrypted payloads are sent
8. Check Cosmos DB `interests` container (if accessible)
9. Verify scores are stored as encrypted blobs

**Expected Result:**
- Events are tracked and sent to server
- Scores are encrypted before storage
- Server performs homomorphic addition without decryption
- Encrypted values are stored in database

**Verification:**
```bash
# Check network requests in browser dev tools
# Look for POST /api/phe/score
# Verify request body contains encrypted values (base64 strings)

# Check Cosmos DB interests container
# Values should be encrypted (large base64 strings)
# Not readable plain numbers
```

**Test Script:**
```javascript
// Open browser console on article page
// Check PheEmitter is working
console.log('Testing PHE events...');
// Open article - should trigger emitOpen
// Wait 10s and scroll - should trigger emitRead
// Click Interested - should trigger emitInterested
// Check Network tab for /api/phe/score requests
```

---

#### ✅ Client Anonymity

**Test Steps:**
1. Monitor server logs while user interacts with articles
2. Check database queries
3. Verify server never sees plain interest scores
4. Check that only encrypted blobs are processed

**Expected Result:**
- Server logs show encrypted values only
- Database contains encrypted scores
- No plain-text interest profiles visible to server

**Verification:**
```bash
# Check server logs
# Should see encrypted values (base64 strings)
# Should NOT see plain numbers like "user likes politics: 50"

# Check database
# SELECT * FROM interests WHERE userId = '...'
# Values should be encrypted strings, not numbers
```

---

## Automated Testing

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Specific Test Suite
```bash
npm run test:e2e -- e2e/homepage.spec.ts
npm run test:e2e -- e2e/auth.spec.ts
```

### Run Unit Tests
```bash
npm test
```

---

## Test Checklist Summary

Use this checklist to track your testing progress:

### Public Access
- [ ] Homepage Feed displays articles correctly
- [ ] Pagination works without duplicates
- [ ] Article detail page shows full content
- [ ] Search filters by title (case-insensitive)
- [ ] Category filtering works

### Content Management
- [ ] Admins can create articles
- [ ] Articles persist in database
- [ ] Backend switching works (mock ↔ cosmos)

### Authentication & RBAC
- [ ] Users can sign in
- [ ] Role protection works (admin routes protected)
- [ ] Session persists across refreshes

### PHE Scoring
- [ ] Public key visible, private key hidden
- [ ] Encrypted scoring works (homomorphic addition)
- [ ] Server never sees plain interest scores

---

## Troubleshooting

### Articles Not Loading
- Check `ARTICLES_BACKEND` env var
- Verify Cosmos DB connection (if using cosmos backend)
- Check API routes are working: `curl http://localhost:3000/api/articles/latest`

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check Cosmos DB users container exists
- Verify user exists with correct password hash

### PHE Not Working
- Check PHE keys are configured in env vars
- Verify `/api/phe/public-key` returns valid key
- Check browser console for errors
- Verify events are being emitted (check Network tab)

---

## Next Steps

After completing all tests:

1. Document any issues found
2. Create bug reports for failures
3. Update requirements if gaps are discovered
4. Add additional automated tests for critical paths
5. Perform security testing (rate limiting, input validation)

