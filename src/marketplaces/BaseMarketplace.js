class BaseMarketplace {
  constructor(name) {
    this.name = name;
  }

  async search(itemName) {
    throw new Error('search() must be implemented');
  }
}

module.exports = BaseMarketplace;
