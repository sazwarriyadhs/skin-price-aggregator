const { normalizePrices, findCheapestListing, calculateBestDeal } = require('./scoring');

/**
 * Aggregate prices from multiple marketplaces
 */
async function aggregate(skinName, marketplaces) {
  const startTime = Date.now();
  const results = [];
  const errors = [];
  const marketplaceStatus = [];

  console.log(`\n=== Starting aggregation for "${skinName}" ===`);
  console.log(`Scraping from ${marketplaces.length} marketplaces...`);

  // Scrape from all marketplaces in parallel with better error handling
  const scrapePromises = marketplaces.map(async (marketplace) => {
    const marketplaceStartTime = Date.now();
    
    try {
      console.log(`\n🔄 [${marketplace.name.toUpperCase()}] Starting scrape...`);
      
      // Add timeout to prevent hanging (15 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout after 15000ms`)), 15000);
      });
      
      const items = await Promise.race([
        marketplace.scrapeItem(skinName),
        timeoutPromise
      ]);
      
      const scrapeTime = Date.now() - marketplaceStartTime;
      
      if (Array.isArray(items) && items.length > 0) {
        results.push(...items);
        marketplaceStatus.push({
          marketplace: marketplace.name,
          status: 'success',
          itemsFound: items.length,
          scrapeTimeMs: scrapeTime,
          error: null
        });
        console.log(`✅ [${marketplace.name.toUpperCase()}] Success! Found ${items.length} items (${scrapeTime}ms)`);
      } else {
        marketplaceStatus.push({
          marketplace: marketplace.name,
          status: 'no_results',
          itemsFound: 0,
          scrapeTimeMs: scrapeTime,
          error: 'No items found'
        });
        console.log(`⚠️ [${marketplace.name.toUpperCase()}] No items found (${scrapeTime}ms)`);
      }
      
    } catch (error) {
      const scrapeTime = Date.now() - marketplaceStartTime;
      const errorMsg = `[${marketplace.name}] failed after ${scrapeTime}ms: ${error.message}`;
      errors.push(errorMsg);
      marketplaceStatus.push({
        marketplace: marketplace.name,
        status: 'error',
        itemsFound: 0,
        scrapeTimeMs: scrapeTime,
        error: error.message
      });
      console.error(`❌ ${errorMsg}`);
    }
  });

  // Wait for all marketplaces to complete (or fail)
  await Promise.allSettled(scrapePromises);

  console.log(`\n=== Aggregation complete ===`);
  console.log(`Total items found: ${results.length}`);
  console.log(`Successful marketplaces: ${marketplaceStatus.filter(m => m.status === 'success').length}/${marketplaces.length}`);

  // Normalize and process results
  const normalizedItems = normalizePrices(results);
  const cheapestListing = findCheapestListing(normalizedItems);
  const bestDeal = calculateBestDeal(normalizedItems);

  const processingTime = Date.now() - startTime;

  // Build result object
  const result = {
    skinName,
    searchQuery: skinName,
    totalListings: normalizedItems.length,
    marketplacesScraped: marketplaces.length,
    marketplacesSuccessful: marketplaceStatus.filter(m => m.status === 'success').length,
    marketplaceStatus,
    listings: normalizedItems,
    cheapestListing: cheapestListing ? {
      ...cheapestListing,
      notes: 'Lowest price among all marketplaces'
    } : null,
    bestDeal: bestDeal ? {
      ...bestDeal.item,
      score: bestDeal.score,
      scoreBreakdown: bestDeal.scoreBreakdown,
      notes: 'Best value based on price, reputation, and recency'
    } : null,
    summary: {
      priceRange: normalizedItems.length > 0 ? {
        min: Math.min(...normalizedItems.map(i => i.price)),
        max: Math.max(...normalizedItems.map(i => i.price)),
        avg: parseFloat((normalizedItems.reduce((sum, i) => sum + i.price, 0) / normalizedItems.length).toFixed(2)),
        currency: 'USD'
      } : null,
      currencyDistribution: getCurrencyDistribution(normalizedItems),
      marketplaceDistribution: getMarketplaceDistribution(normalizedItems)
    },
    metadata: {
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      cacheable: true,
      queryType: 'single'
    }
  };

  // Add errors if any
  if (errors.length > 0) {
    result.errors = errors;
    result.warning = 'Some marketplaces failed to respond';
  }

  console.log(`Processing time: ${processingTime}ms`);
  console.log(`Cached: Yes (60 seconds TTL)\n`);

  return result;
}

/**
 * Get currency distribution
 */
function getCurrencyDistribution(items) {
  const distribution = {};
  items.forEach(item => {
    distribution[item.currency] = (distribution[item.currency] || 0) + 1;
  });
  return distribution;
}

/**
 * Get marketplace distribution
 */
function getMarketplaceDistribution(items) {
  const distribution = {};
  items.forEach(item => {
    distribution[item.marketplace] = (distribution[item.marketplace] || 0) + 1;
  });
  return distribution;
}

module.exports = { aggregate };