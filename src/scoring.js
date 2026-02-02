/**
 * Normalize prices to USD for comparison
 * @param {Array} items - Array of scraped items
 * @returns {Array} Items with normalized prices
 */
function normalizePrices(items) {
  // Exchange rates (simplified - in production use real-time rates)
  const exchangeRates = {
    'USD': 1.0,
    'EUR': 1.07,    // 1 EUR = 1.07 USD
    'GBP': 1.27,    // 1 GBP = 1.27 USD
    'RUB': 0.011,   // 1 RUB = 0.011 USD
    'BRL': 0.20,    // 1 BRL = 0.20 USD
    'IDR': 0.000064,// 1 IDR = 0.000064 USD
    'CNY': 0.14     // 1 CNY = 0.14 USD
  };

  return items.map(item => {
    const rate = exchangeRates[item.currency.toUpperCase()] || 1.0;
    const normalizedPrice = parseFloat((item.price * rate).toFixed(2));
    
    return {
      ...item,
      normalizedPrice,
      normalizedCurrency: 'USD',
      originalPrice: item.price,
      originalCurrency: item.currency
    };
  });
}

/**
 * Find the cheapest listing
 * @param {Array} items - Normalized items
 * @returns {object|null} Cheapest item
 */
function findCheapestListing(items) {
  if (items.length === 0) return null;
  
  return items.reduce((cheapest, current) => {
    return current.normalizedPrice < cheapest.normalizedPrice ? current : cheapest;
  });
}

/**
 * Calculate best deal using scoring algorithm
 * @param {Array} items - Normalized items
 * @returns {object|null} Best deal with score
 */
function calculateBestDeal(items) {
  if (items.length === 0) return null;

  // Marketplace reputation scores (higher is better)
  const reputationScores = {
    'steam': 1.0,      // Official marketplace, most trusted
    'bitskins': 0.85,   // Well-established third party
    'skinport': 0.9,    // Good reputation
    'buff': 0.8,        // Popular but less regulated
    'csgomarket': 0.75, // Smaller marketplace
    'default': 0.5      // Unknown marketplace
  };

  const scoredItems = items.map(item => {
    // 1. Price score (40% weight) - lower price = higher score
    const prices = items.map(i => i.normalizedPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    const priceScore = priceRange > 0 
      ? 1 - ((item.normalizedPrice - minPrice) / priceRange)
      : 1.0;

    // 2. Marketplace reputation score (30% weight)
    const reputationScore = reputationScores[item.marketplace.toLowerCase()] || reputationScores.default;

    // 3. Recency score (20% weight) - more recent = higher score
    const now = new Date();
    const lastUpdated = new Date(item.lastUpdated);
    const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 1 - (hoursDiff / 72)); // 72 hour decay

    // 4. URL security score (10% weight) - HTTPS = better
    const urlScore = item.url.startsWith('https://') ? 1.0 : 0.5;

    // Calculate weighted total score
    const totalScore = (
      priceScore * 0.4 +        // 40% price
      reputationScore * 0.3 +    // 30% reputation
      recencyScore * 0.2 +       // 20% recency
      urlScore * 0.1             // 10% security
    );

    return {
      item,
      score: parseFloat(totalScore.toFixed(3)),
      scoreBreakdown: {
        price: parseFloat(priceScore.toFixed(3)),
        reputation: parseFloat(reputationScore.toFixed(3)),
        recency: parseFloat(recencyScore.toFixed(3)),
        url: parseFloat(urlScore.toFixed(3))
      }
    };
  });

  // Return item with highest score
  return scoredItems.reduce((best, current) => {
    return current.score > best.score ? current : best;
  });
}

/**
 * Filter listings by price range
 * @param {Array} items - Normalized items
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @returns {Array} Filtered items
 */
function filterByPriceRange(items, minPrice, maxPrice) {
  return items.filter(item => 
    item.normalizedPrice >= minPrice && item.normalizedPrice <= maxPrice
  );
}

/**
 * Sort listings by various criteria
 * @param {Array} items - Normalized items
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted items
 */
function sortListings(items, sortBy = 'price_asc') {
  const sorted = [...items];
  
  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => a.normalizedPrice - b.normalizedPrice);
    case 'price_desc':
      return sorted.sort((a, b) => b.normalizedPrice - a.normalizedPrice);
    case 'date_desc':
      return sorted.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    case 'date_asc':
      return sorted.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));
    case 'marketplace':
      return sorted.sort((a, b) => a.marketplace.localeCompare(b.marketplace));
    default:
      return sorted;
  }
}

module.exports = {
  normalizePrices,
  findCheapestListing,
  calculateBestDeal,
  filterByPriceRange,
  sortListings
};