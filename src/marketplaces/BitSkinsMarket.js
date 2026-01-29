const BaseMarketplace = require('./BaseMarketplace');

class BitSkinsMarket extends BaseMarketplace {
  constructor() {
    super('bitskins');
  }

  async search(itemName) {
    return [
      {
        marketplace: this.name,
        itemName,
        price: 11.90,
        currency: 'USD',
        url: 'https://bitskins.com',
        lastUpdated: new Date().toISOString()
      }
    ];
  }
}

module.exports = BitSkinsMarket;
