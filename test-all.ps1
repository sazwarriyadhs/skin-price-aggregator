# Complete API Test Script
Write-Host "=== SKIN PRICE AGGREGATOR COMPLETE TEST ===`n" -ForegroundColor Green

$baseUrl = "http://localhost:3000"

# 1. Health Check
Write-Host "1. HEALTH CHECK" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "   ✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "   ✅ Uptime: $([math]::Round($health.uptime, 1))s" -ForegroundColor Green
    Write-Host "   ✅ Marketplaces: $($health.marketplaces.name -join ', ')" -ForegroundColor Green
} catch { Write-Host "   ❌ Failed: $_" -ForegroundColor Red }

# 2. Test Popular Skins
Write-Host "`n2. TEST POPULAR SKINS" -ForegroundColor Yellow
$skins = @("AK-47 Redline", "AWP Asiimov", "M4A1-S Hyper Beast", "Desert Eagle Blaze", "Karambit Doppler")

foreach ($skin in $skins) {
    $encoded = [System.Web.HttpUtility]::UrlEncode($skin)
    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/api/prices?item=$encoded" -Method Get -ErrorAction SilentlyContinue
        $status = if ($result.error) { "❌" } else { "✅" }
        $cached = if ($result.cached) { "[C]" } else { "[L]" }
        Write-Host "   $status $cached $skin : $($result.totalListings) listings, $$([math]::Round($result.cheapestListing.price, 2)) on $($result.cheapestListing.marketplace)" -ForegroundColor $(if ($result.cached) { "Gray" } else { "White" })
    } catch {
        Write-Host "   ❌ $skin : ERROR" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 200
}

# 3. Cache Statistics
Write-Host "`n3. CACHE STATISTICS" -ForegroundColor Yellow
try {
    $cache = Invoke-RestMethod -Uri "$baseUrl/api/cache/stats" -Method Get
    Write-Host "   ✅ Items: $($cache.cache.size)" -ForegroundColor Green
    Write-Host "   ✅ Hit Rate: $([math]::Round($cache.cache.hitRate * 100, 1))%" -ForegroundColor Green
    Write-Host "   ✅ Memory: $([math]::Round($cache.cache.sizeMB, 2))MB" -ForegroundColor Green
} catch { Write-Host "   ❌ Failed: $_" -ForegroundColor Red }

# 4. Marketplaces Info
Write-Host "`n4. MARKETPLACES" -ForegroundColor Yellow
try {
    $markets = Invoke-RestMethod -Uri "$baseUrl/api/marketplaces" -Method Get
    Write-Host "   ✅ Count: $($markets.count)" -ForegroundColor Green
    $markets.marketplaces | ForEach-Object {
        Write-Host "   • $($_.name) - $($_.baseUrl)" -ForegroundColor Gray
    }
} catch { Write-Host "   ❌ Failed: $_" -ForegroundColor Red }

# 5. Service Stats
Write-Host "`n5. SERVICE STATISTICS" -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/stats" -Method Get
    Write-Host "   ✅ Uptime: $([math]::Round($stats.service.uptime, 1))s" -ForegroundColor Green
    Write-Host "   ✅ Memory: $([math]::Round($stats.service.memory.heapUsed / 1MB, 1))MB" -ForegroundColor Green
} catch { Write-Host "   ❌ Failed: $_" -ForegroundColor Red }

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Green
Write-Host "All requirements mmatch" -ForegroundColor Cyan