# Backend Improvements & Feature Roadmap

This document tracks recent changes, architectural decisions, and planned features for the WhatsApp Sales Tracker backend.

## 1. Recent Implementations

### 1.1. Dashboard Statistics Endpoint (`GET /api/seller/dashboard/stats`)
*   **Objective:** Provide summarized statistics for the seller dashboard.
*   **Status:** Implemented.
*   **Response Format:**
    ```json
    {
      "status_code": 200,
      "success": true,
      "message": "Dashboard stats retrieved successfully",
      "data": {
        "total_stores": 2,
        "total_products": 50,
        "total_orders_received": 120,
        "total_revenue": 15000000
      }
    }
    ```
*   **Filtering:** Supports query parameters `storeId`, `startDate`, and `endDate` to filter the statistics.
*   **Logic:** Aggregates data from `orders`, `products`, and `stores` tables based on the authenticated user.

### 1.2. Order Creation Error Handling
*   **Objective:** Provide clear, actionable error messages to the frontend when an order fails due to stock issues.
*   **Status:** Implemented.
*   **Behavior:** Returns a `400 Bad Request` with a specific message like `"Insufficient stock or invalid product for ID: 8"` when stock validation fails during `POST /api/public/orders`. The frontend has been updated to display this message in an alert dialog.

### 1.3. AI Chat Integration
*   **Objective:** Enable sellers to discuss business ideas and get suggestions via an AI assistant.
*   **Status:** Backend Implemented (Endpoints & Logic).
*   **Architecture:**
    *   **Endpoint:** `POST /api/ai/chat`
    *   **Service:** `AiService` proxies requests to the **Kolosal API**.
    *   **Model:** Uses `Qwen 3 30BA3B`.
    *   **System Prompt:** specialized for assisting Indonesian UMKM sellers with business ideas, marketing tips, and product descriptions.
    *   **Security:** API keys are stored in `KOLOSAL_API_KEY` env variable.

## 2. Frontend Integration Notes (Context)

*   **Seller Layout:** Updated to be responsive with a mobile hamburger menu and slide-in sidebar.
*   **Navigation:** Added a new "Diskusi Ide dengan AI" (Chat with AI) link in the seller sidebar.

## 3. Planned Features & Improvements

### 3.1. Authentication & Security
*   **Refinement:** Ensure token refresh logic is robust.
*   **Rate Limiting:** Implement rate limiting, especially for the new AI chat endpoint to prevent abuse and manage costs.

### 3.2. Product Management
*   **Bulk Upload:** Future consideration for uploading products via CSV/Excel.
*   **Image Optimization:** Integrate image resizing/compression during upload.
*   **AI Caption Generator:** Extend `AiService` to support generating product captions specifically (currently `chat` is generic but specialized via system prompt).

### 3.3. Order Management
*   **Notifications:** Send WhatsApp or Email notifications to the seller when a new order is placed.