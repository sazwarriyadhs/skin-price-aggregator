const express = require('express');
const { aggregate } = require('./aggregator');
const cache = require('./cache');

const SteamMarket = require('./marketplaces/SteamMarket');
const BitSkinsMarket = require('./marketplaces/BitSkinsMarket');

const app = express();

const marketplaces = [
  new SteamMarket(),
  new BitSkinsMarket()
];

app.get('/price', async (req, res) => {
  const { item } = req.query;

  if (!item) {
    return res.status(400).json({ error: 'item query required' });
  }

  const cached = cache.get(item);
  if (cached) {
    return res.json({ cached: true, ...cached });
  }

  const data = await aggregate(item, marketplaces);
  cache.set(item, data);

  res.json({ cached: false, ...data });
});

app.listen(3000, () => {
  console.log('Skin Price Aggregator running on http://localhost:3000');
});
