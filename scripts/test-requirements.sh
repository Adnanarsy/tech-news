#!/bin/bash

# Test Script for SRS Requirements
# Usage: ./scripts/test-requirements.sh

set -e

BASE_URL="${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing TechNews SRS Requirements"
echo "===================================="
echo ""

# Test 1: Homepage loads
echo -n "Testing Homepage Feed... "
if curl -s "$BASE_URL" | grep -q "article\|Article"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Test 2: Articles API
echo -n "Testing Articles API... "
RESPONSE=$(curl -s "$BASE_URL/api/articles/latest?limit=5")
if echo "$RESPONSE" | jq -e '.items' > /dev/null 2>&1; then
    ITEM_COUNT=$(echo "$RESPONSE" | jq '.items | length')
    if [ "$ITEM_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} ($ITEM_COUNT items)"
    else
        echo -e "${YELLOW}⚠${NC} (API works but no items)"
    fi
else
    echo -e "${RED}✗${NC}"
fi

# Test 3: Pagination
echo -n "Testing Pagination... "
CURSOR_RESPONSE=$(curl -s "$BASE_URL/api/articles/latest?limit=2")
CURSOR=$(echo "$CURSOR_RESPONSE" | jq -r '.nextCursor // empty')
if [ -n "$CURSOR" ] && [ "$CURSOR" != "null" ]; then
    PAGE2_RESPONSE=$(curl -s "$BASE_URL/api/articles/latest?limit=2&cursor=$CURSOR")
    PAGE2_COUNT=$(echo "$PAGE2_RESPONSE" | jq '.items | length')
    if [ "$PAGE2_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠${NC} (Cursor exists but page 2 empty)"
    fi
else
    echo -e "${YELLOW}⚠${NC} (No cursor returned - might be last page)"
fi

# Test 4: Search
echo -n "Testing Search API... "
SEARCH_RESPONSE=$(curl -s "$BASE_URL/api/articles/search?q=technology")
if echo "$SEARCH_RESPONSE" | jq -e '.items' > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Test 5: Category Filtering
echo -n "Testing Category Filtering... "
CATEGORY_RESPONSE=$(curl -s "$BASE_URL/api/articles?category=trending")
if echo "$CATEGORY_RESPONSE" | jq -e '.items' > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} (Category endpoint might not be implemented)"
fi

# Test 6: Public Key Endpoint
echo -n "Testing PHE Public Key... "
PUBKEY_RESPONSE=$(curl -s "$BASE_URL/api/phe/public-key")
if echo "$PUBKEY_RESPONSE" | jq -e '.n, .g, .version' > /dev/null 2>&1; then
    # Check private key is NOT exposed
    if echo "$PUBKEY_RESPONSE" | jq -e '.lambda, .mu' > /dev/null 2>&1; then
        echo -e "${RED}✗${NC} (Private key exposed!)"
    else
        echo -e "${GREEN}✓${NC}"
    fi
else
    echo -e "${RED}✗${NC}"
fi

# Test 7: Authentication Required for Admin
echo -n "Testing Admin Route Protection... "
ADMIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/admin")
if [ "$ADMIN_RESPONSE" = "302" ] || [ "$ADMIN_RESPONSE" = "401" ] || [ "$ADMIN_RESPONSE" = "403" ]; then
    echo -e "${GREEN}✓${NC} (Protected: $ADMIN_RESPONSE)"
else
    echo -e "${YELLOW}⚠${NC} (Unexpected status: $ADMIN_RESPONSE)"
fi

# Test 8: PHE Score Endpoint Requires Auth
echo -n "Testing PHE Score Auth... "
SCORE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/phe/score" \
    -H "Content-Type: application/json" \
    -d '{"articleId":"test","events":{"open":true}}')
if [ "$SCORE_RESPONSE" = "401" ] || [ "$SCORE_RESPONSE" = "403" ]; then
    echo -e "${GREEN}✓${NC} (Requires auth: $SCORE_RESPONSE)"
else
    echo -e "${YELLOW}⚠${NC} (Unexpected status: $SCORE_RESPONSE)"
fi

echo ""
echo "===================================="
echo "✅ Basic API tests completed"
echo ""
echo "For full testing, run:"
echo "  npm run test:e2e"
echo "  npm test"
echo ""
echo "See docs/TESTING_GUIDE.md for detailed manual testing steps"

