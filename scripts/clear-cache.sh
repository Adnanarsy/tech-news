#!/bin/bash
# Clear Next.js Cache Script (Bash)
# Usage: bash scripts/clear-cache.sh

echo "Clearing Next.js build cache..."

if [ -d ".next" ]; then
    rm -rf .next
    echo "✅ .next folder deleted"
else
    echo "ℹ️  .next folder not found"
fi

echo ""
echo "Cache cleared! Now restart your dev server:"
echo "  npm run dev"
echo ""
echo "And hard refresh your browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)"

