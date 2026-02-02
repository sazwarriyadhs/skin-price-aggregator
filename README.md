# Skin Price Aggregator

Skin price aggregator for MaestroAI/SkinScanner technical interview.

A web service that aggregates skin prices from multiple marketplaces for games like Counter-Strike.

## Features

- ✅ Scrapes prices from multiple marketplaces (Steam, BitSkins, Skinport)
- ✅ Normalizes prices to USD for comparison
- ✅ 60-second caching for performance
- ✅ Error handling with stale cache fallback
- ✅ Best deal calculation using a scoring algorithm
- ✅ RESTful API with comprehensive endpoints
- ✅ Batch processing support for multiple items
- ✅ Dynamic marketplace registration
- ✅ Rate limiting to prevent abuse

## Technologies Used

- **Backend:** Node.js, Express.js
- **Web Scraping:** Axios, Cheerio
- **Testing:** Jest
- **Development:** Nodemon

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/skin-price-aggregator.git
    cd skin-price-aggregator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Application

-   **Development Mode (with auto-reload):**
    ```bash
    npm run dev
    ```

-   **Production Mode:**
    ```bash
    npm start
    ```

-   **Running Tests:**
    ```bash
    npm test
    ```

The API will be available at `http://localhost:3000`.

## API Endpoints

### Health

-   `GET /health`
    -   Provides a detailed health check of the service, including uptime, memory usage, marketplace status, and cache statistics.

### Prices

-   `GET /api/prices?item=<skin_name>`
    -   Fetches aggregated prices for a specific skin.
    -   **Query Parameter:** `item` (required) - The name of the skin (e.g., `AK-47%20Redline`).

-   `POST /api/prices/batch`
    -   Fetches prices for multiple skins in a single request.
    -   **Request Body:** `{ "items": ["<skin_name_1>", "<skin_name_2>"] }`

### Marketplaces

-   `GET /api/marketplaces`
    -   Lists all configured marketplaces.

-   `POST /api/marketplaces`
    -   Dynamically adds a new (mock) marketplace.
    -   **Request Body:** `{ "name": "NewMarket", "baseUrl": "https://newmarket.com" }`

### Cache

-   `GET /api/cache/stats`
    -   Returns statistics about the cache, including hit rate and memory usage.

-   `DELETE /api/cache`
    -   Clears the entire cache.

-   `DELETE /api/cache/:item`
    -   Clears the cache for a specific item.

### Service Stats

-   `GET /api/stats`
    -   Provides overall service statistics, including uptime and request counts.

## Project Structure

```
/
├── src/
│   ├── marketplaces/       # Marketplace-specific scraping logic
│   │   ├── BitSkinsMarket.js
│   │   ├── SkinportMarket.js
│   │   └── SteamMarket.js
│   ├── aggregator.js       # Main aggregation logic
│   ├── app.js              # Express server setup and routes
│   └── cache.js            # In-memory caching implementation
├── tests/                  # Unit and integration tests
├── package.json            # Project dependencies and scripts
└── README.md               # This file
```

## License

This project is licensed under the MIT License.bash
npm install