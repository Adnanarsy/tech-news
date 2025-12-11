# Clear Next.js Cache Script (PowerShell)
# Usage: .\scripts\clear-cache.ps1

Write-Host "Clearing Next.js build cache..." -ForegroundColor Yellow

if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ .next folder deleted" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next folder not found" -ForegroundColor Gray
}

Write-Host "`nCache cleared! Now restart your dev server:" -ForegroundColor Green
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host "`nAnd hard refresh your browser: Ctrl+Shift+R" -ForegroundColor Cyan

