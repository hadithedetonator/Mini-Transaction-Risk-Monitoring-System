# Mini Transaction Risk Monitoring System

A lightweight, monolithic REST application designed to process transactions and evaluate fraud risk in real-time. Built with a focus on simplicity, readability, and immediate feedback.

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or higher)
- npm (installed automatically with Node)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/hadithedetonator/Mini-Transaction-Risk-Monitoring-System.git
   cd Mini-Transaction-Risk-Monitoring-System
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application
Start the server:
```bash
npm start
```
The system will be available at [http://localhost:3000](http://localhost:3000).

---

## Architecture

The system follows a classic **Layered Monolith** architecture to ensure a clean separation of concerns without the overhead of microservices:

- **Frontend (Static UI)**: Vanilla HTML/JS/CSS served directly by Express.
- **API Layer (`src/routes`)**: Handles HTTP requests, input validation, and coordinates between the Risk Engine and the Database.
- **Risk Engine (`src/services`)**: A decoupled logic layer that evaluates fraud rules as pure functions.
- **Database Layer (`src/db`)**: SQLite relational database. Uses a file-based storage model for zero-config persistence.

---

## Fraud Rule Structure

The system evaluates transactions against two specific rules:

| Rule | Trigger Condition | Priority | Flag |
| :--- | :--- | :--- | :--- |
| **Rule 1** | Amount > $20,000 | Primary | `HIGH_RISK` |
| **Rule 2** | Pre-existing transactions for user ≥ 3 | Secondary | `SUSPICIOUS` |

### Logic Implementation
1. The **Risk Engine** receives the incoming transaction and the current history count for that user.
2. **Rule 1** is checked first. If triggered, evaluation stops and the flags are returned.
3. **Rule 2** is checked only if Rule 1 passes. This ensures that a high-value transaction from a frequent user is correctly categorized by its highest risk factor.

---

## Assumptions
- **Transaction Uniqueness**: `transaction_id` is client-provided and expected to be unique per transaction. The system enforces this at the database level via a `PRIMARY KEY` constraint and returns a `409 Conflict` error if a duplicate is submitted, allowing the caller to handle it gracefully.
- **Real-time Processing**: Fraud evaluation must happen before the transaction is saved (synchronously).
- **Relational Data**: SQL is preferred over NoSQL to ensure consistent count aggregations for Rule 2.

---

## Scaling to 1M Transactions/Day
To scale this system effectively to handle **1.15 million transactions per day** (approx. 13.3 transactions per second), the following upgrades would be implemented:

1.  **Database Migration**: Moving from SQLite to a dedicated relational database like **PostgreSQL** to handle concurrent writes more efficiently.
2.  **Indexing**: Ensuring strict indexing on `user_id` and `timestamp` to keep Rule 2 checks (count aggregations) at O(log n) complexity.
3.  **Caching Layer**: Introducing **Redis** to store ephemeral transaction counts for active users, reducing the load on the primary database for frequency-based checks.
4.  **Load Balancing**: Deploying the Node.js application across multiple instances using a load balancer to handle incoming HTTP traffic.
5.  **Read/Write Splitting**: Utilizing read replicas for the dashboard and history table to keep the primary node optimized for high-throughput writes.

---

## AI Usage Disclosure

This project was developed with the assistance of an AI coding assistant (Antigravity).

- **What was used**: The AI was utilized for boilerplate generation, UI/UX styling suggestions (Vanilla CSS), SQL query optimization for the dashboard aggregation, and the creation of the database seeding script.
- **Why it was used**: To accelerate the development of standard utility components and ensure a clean, responsive design for the frontend dashboard within an efficient timeframe.
- **AI-Assisted Parts**:
    - **Frontend Styling**: Modern CSS patterns for the dashboard cards and table highlighting.
    - **Dashboard Aggregation**: Refinement of the `SUM(CASE ...)` SQL logic to ensure efficient single-query stats.
    - **Seeding Script**: Generation of the `seed.js` script to automate data entry for testing.
    - **Documentation**: Structuring and formatting the project documentation.

*Note: The core architecture patterns, database schema definitions, and the specific fraud rule logic were implemented based on human-provided constraints.*
