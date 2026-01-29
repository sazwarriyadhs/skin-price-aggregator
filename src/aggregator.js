const { scoreListing } = require('./scoring');

async function aggregate(itemName, marketplaces) {
  const listings = [];

  await Promise.all(
    marketplaces.map(async (market) => {
      try {
        const results = await market.search(itemName);
        listings.push(...results);
      } catch (err) {
        console.error(`Marketplace ${market.name} failed`);
      }
    })
  );

  if (!listings.length) {
    return { listings: [], cheapest: null, bestDeal: null };
  }

  const cheapest = listings.reduce((a, b) =>
    a.price < b.price ? a : b
  );

  const bestDeal = listings
    .map(l => ({ ...l, score: scoreListing(l) }))
    .sort((a, b) => b.score - a.score)[0];

  return { listings, cheapest, bestDeal };
}

module.exports = { aggregate };
