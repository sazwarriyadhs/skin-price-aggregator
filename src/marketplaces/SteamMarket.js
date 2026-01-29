const BaseMarketplace = require('./BaseMarketplace');

class SteamMarket extends BaseMarketplace {
  constructor() {
    super('steam');
  }

  async search(itemName) {
    return [
      {
        marketplace: this.name,
        itemName,
        price: 12.75,
        currency: 'USD',
        url: 'https://steamcommunity.com/market',
        lastUpdated: new Date().toISOString()
      }
    ];
  }
}

module.exports = SteamMarket;
