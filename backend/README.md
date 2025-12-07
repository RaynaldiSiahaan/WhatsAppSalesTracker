# TOKO BACKEND - Seller Management API

![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg)

A robust backend for managing online stores, products, and inventory with separate portals for Sellers and Public Customers. This system is designed to scale, featuring a layered architecture, secure authentication, and comprehensive order management.

For detailed API documentation, including all endpoints and response formats, please refer to the **[API Contract](api_contract.md)**.

## Key Features

### 🛍️ For Sellers
*   **Authentication:** Secure registration and login with JWT (Access + Refresh Tokens).
*   **Store Management:** Create and manage multiple stores (currently limited to 1 per user for Phase 1).
*   **Product Inventory:** Add products, update stock levels, and manage product details.
*   **Dashboard:** View real-time sales statistics and order statuses.
*   **Order Management:** Track incoming orders from reception to completion.

### 🛒 For Customers (Public)
*   **Public Catalog:** Browse store catalogs via unique URL slugs.
*   **Order Placement:** Seamlessly place orders without requiring an account.

### 🔧 Technical Highlights
*   **Layered Architecture:** Separation of concerns (Controller -> Service -> Repository) for maintainability and testability.
*   **BigInt IDs:** Scalable database design using 64-bit integers for IDs.
*   **AES Encryption:** Database passwords are encrypted at rest using AES-256-CBC.
*   **Manual Validation:** Robust input validation logic without heavy external dependency reliance.

## Tech Stack

*   **Runtime:** Node.js (v20+)
*   **Framework:** Express.js
*   **Language:** TypeScript (Strict Mode)
*   **Database:** PostgreSQL 14
*   **ORM/Migration:** `pg` driver & `node-pg-migrate` (Raw SQL for performance)
*   **Authentication:** JWT (`jsonwebtoken`) & `bcryptjs`
*   **Containerization:** Docker & Docker Compose

## Prerequisites

Ensure you have the following installed on your system:

*   [Docker Desktop](https://www.docker.com/products/docker-desktop)
*   [Node.js](https://nodejs.org/) (v20 or higher)
*   [Go](https://go.dev/) (Required for generating encryption keys)
*   [PostgreSQL 14](https://www.postgresql.org/) (If running locally without Docker)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd backend
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

### 3. Security Setup (Crucial Step)
This project uses AES-256 encryption for sensitive database credentials. You **must** generate unique keys.

1.  Run the encryption tool:
    ```bash
    go run encrypt_pass_tool.go
    ```
2.  The tool will output `AES_KEY`, `AES_IV`, and an `ENCRYPTED_DB_PASSWORD`.
3.  Update your `.env` file with these values.

### 4. Database Migration
Ensure your PostgreSQL database is running and accessible. Then run the migrations to set up the schema:

```bash
npm install
npm run migrate:up
```

### 5. Running the Application

**Development Mode (Hot Reload):**
```bash
npm run dev
```

**Docker Mode:**
```bash
docker-compose up --build
```
*Note: The provided `docker-compose.yml` manages the backend and migrator services. Ensure your database is accessible to the container.*

## Usage Guide: User Journey

Here is a quick guide to interacting with the API.

### Scenario 1: Seller Setup 🏪

**1. Register a new Seller account:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{ "email": "seller@example.com", "password": "password123" }`
```

**2. Login to get Access Token:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{ "email": "seller@example.com", "password": "password123" }`
```
*Save the `accessToken` from the response for subsequent requests.*

**3. Create a Store:**
```bash
curl -X POST http://localhost:3000/api/stores \
-H "Authorization: Bearer <ACCESS_TOKEN>" \
-H "Content-Type: application/json" \
-d '{ "name": "My Awesome Store", "location": "Jakarta" }`
```

**4. Add a Product:**
```bash
curl -X POST http://localhost:3000/api/stores/<STORE_ID>/products \
-H "Authorization: Bearer <ACCESS_TOKEN>" \
-H "Content-Type: application/json" \
-d '{ "name": "Kopi Susu", "price": 18000, "stock_quantity": 50 }`
```

### Scenario 2: Customer Purchase 🛍️

**1. View Public Catalog:**
Access the store using its unique slug (returned during store creation).
```bash
curl -X GET http://localhost:3000/api/public/catalog/my-awesome-store
```

**2. Create an Order:**
```bash
curl -X POST http://localhost:3000/api/public/orders \
-H "Content-Type: application/json" \
-d '{
  "store_id": <STORE_ID>,
  "customer_name": "Budi",
  "customer_phone": "08123456789",
  "pickup_time": "2023-12-31T10:00:00Z",
  "items": [
    { "product_id": <PRODUCT_ID>, "quantity": 2 }
  ]
}'
```

## Project Structure

The project follows a clean, layered architecture:

```
src/
├── config/         # Environment and Database connection setup
├── controllers/    # Request handlers (input parsing, response formatting)
├── services/       # Business logic and transaction management
├── repositories/   # Data access layer (Raw SQL queries)
├── middleware/     # Authentication and Error handling
├── utils/          # Helper functions (Logger, Validation, Crypto)
├── entities/       # TypeScript interfaces for DB models
├── routes.ts       # API Route definitions
└── server.ts       # App entry point
```

## Database Schema (Simplified)

*   **Users:** Stores seller credentials (Soft Delete supported).
*   **Stores:** Seller's shop details. 1-to-1 relationship with Users initially.
*   **Products:** Inventory items linked to a Store. Prices are Gross (Tax Included).
*   **Orders:** Transaction headers containing customer info and total amount.
*   **OrderItems:** Individual line items for each order.

---
*Built with ❤️ for UMKM.*
