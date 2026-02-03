# Skin Price Aggregator
![Dashboard Preview](ss.png)
Skin Price Aggregator for **MaestroAI / SkinScanner technical interview**.

A lightweight web service that aggregates Counter-Strike skin prices from multiple marketplaces and returns normalized, comparable pricing data.

The primary focus of this project is **architecture, scalability, and failure isolation**, rather than aggressive scraping.

---

## 🎯 Goals

- Aggregate skin prices from multiple marketplaces
- Normalize heterogeneous marketplace data into a unified schema
- Scale easily to 10+ marketplaces without core logic changes
- Handle partial marketplace failures gracefully
- Provide cheapest listing and a higher-quality “best deal” signal
- Keep the solution simple, readable, and interview-friendly

---

## ✨ Features

- ✅ Multiple marketplace support (Steam, BitSkins, Skinport)
- ✅ Pluggable marketplace architecture
- ✅ Normalized JSON output (price, currency, URL, timestamps)
- ✅ Cheapest listing selection
- ✅ Best deal scoring algorithm
- ✅ Graceful error handling with partial results
- ✅ 60-second in-memory caching
- ✅ Batch price lookup
- ✅ Dynamic marketplace registration (mock)
- ✅ Basic rate limiting
- ✅ RESTful API with health & stats endpoints

---

## 🧱 Architecture Overview

The system is designed around a **pluggable marketplace architecture**.

Each marketplace is implemented as an isolated adapter responsible for:
- Fetching raw listing data
- Normalizing results into a unified schema
- Handling marketplace-specific errors internally

The **aggregator** orchestrates concurrent requests to all registered marketplaces and:
- Collects partial results
- Computes the cheapest listing
- Computes a “best deal” using a scoring function
- Returns a single normalized response

Marketplace failures are **isolated** and never cause the entire service to fail.

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

## Author

-   **Azwar Riyadh Subarkah** - [sazwarriyadhs](https://github.com/sazwarriyadhs)

## License

This project is licensed under the MIT License.bash
npm install
