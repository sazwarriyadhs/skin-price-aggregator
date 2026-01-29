# Application Workflow

This document describes the workflow of the **Skinscanner** application, from data retrieval to presentation to the user.

1.  **Data Fetching**
    -   The application periodically or on-demand fetches skin price data from various third-party marketplace APIs.
    -   Each data source has a separate fetching process to handle different API formats.

2.  **Data Processing & Aggregation**
    -   Raw data received from various sources is processed and standardized into a uniform format.
    -   Prices, item names, and other attributes are normalized to ensure consistency.
    -   The clean data is then aggregated based on the same skin item.

3.  **Data Storage**
    -   The aggregated data is stored in a database. This allows for fast data access and reduces the load on third-party APIs.
    -   Data storage also enables historical price analysis in the future.

4.  **Data Presentation**
    -   When a user accesses the application, the frontend requests data from the backend.
    -   The backend retrieves the processed data from the database and sends it to the frontend.
    -   The frontend displays the skin price data in an easy-to-read format, such as a comparison table, product list, or detail page.

5.  **User Interaction**
    -   Users can use the search and filter features to find the desired skins.
    -   Each search or filter request triggers a new request to the backend to get the relevant data from the database.