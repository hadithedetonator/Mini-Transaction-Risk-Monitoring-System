# Mini Transaction Risk Monitoring System

A full-stack web application that processes financial transactions, evaluates fraud risk in real-time using deterministic rule-based logic, and presents results through a live dashboard. Built with a minimal, maintainable monolithic architecture.

---

## Tech Stack

| Layer | Technology | Reason |
|:---|:---|:---|
| **Backend** | Node.js + Express | Minimal REST API setup, no boilerplate overhead |
| **Database** | SQLite | Relational DB with zero server config, file-based persistence |
| **Frontend** | React (Vite) | Lightweight component-based UI, no extra libraries |

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v16.x or higher
- npm

### 1. Clone the repository
```bash
git clone https://github.com/hadithedetonator/Mini-Transaction-Risk-Monitoring-System.git
cd Mini-Transaction-Risk-Monitoring-System
```

### 2. Install backend dependencies
```bash
npm install
```

### 3. Install frontend dependencies
```bash
cd client
npm install
cd ..
```

### 4. Run the backend
```bash
npm start
```
Backend API will be live at: `http://localhost:3000`

### 5. Run the frontend (in a separate terminal)
```bash
cd client
npm run dev
```
Frontend UI will be live at: `http://localhost:5173`

---

## Project Structure

```
mini-risk-system/
├── client/               # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx       # Single component: form, table, dashboard
│   │   └── App.css       # Styles
│   ├── vite.config.js    # Vite proxy config (forwards /api → localhost:3000)
│   └── index.html
├── src/                  # Express backend
│   ├── routes/
│   │   └── transactions.js  # POST /transactions, GET /transactions, GET /dashboard
│   ├── services/
│   │   └── riskEngine.js    # Fraud rule evaluation (decoupled from routes)
│   ├── db/
│   │   └── database.js      # SQLite connection, schema init, query helpers
│   └── server.js            # Express app entry point
├── seed.js               # API seeding script (test data)
├── database.sqlite       # Created automatically on first run
└── package.json
```

---

## API Reference

### `POST /api/transactions`
Submit a new transaction. Timestamp is **generated server-side** to ensure consistency across all clients and devices.

**Request Body:**
```json
{
  "transaction_id": "TX123",
  "user_id": "U1001",
  "amount": 25000,
  "device_id": "D777"
}
```

**Response `201`:**
```json
{
  "transaction_id": "TX123",
  "user_id": "U1001",
  "amount": 25000,
  "timestamp": "2026-02-28T00:07:06.000Z",
  "device_id": "D777",
  "risk_flag": "HIGH_RISK",
  "rule_triggered": "Rule1"
}
```

**Error Responses:**
- `400` — Missing required fields
- `409` — Duplicate `transaction_id`

---

### `GET /api/transactions`
Returns all stored transactions ordered by most recent first.

---

### `GET /api/dashboard`
Returns aggregated risk statistics using a single SQL query.

**Response:**
```json
{
  "total_transactions": 60,
  "flagged_transactions": 22,
  "high_risk": 15,
  "suspicious": 7
}
```

---

### `GET /health`
Verifies both the HTTP server and the database are operational.

**Response `200`:**
```json
{
  "status": "OK",
  "database": "connected",
  "uptime": 3672.4,
  "timestamp": "2026-02-28T00:07:06.000Z"
}
```

**Response `503`** (if DB is unreachable):
```json
{
  "status": "ERROR",
  "database": "unreachable",
  "uptime": 124.1,
  "timestamp": "2026-02-28T00:07:06.000Z"
}
```

---

## Database Schema

```sql
CREATE TABLE transactions (
    transaction_id TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL,
    amount         REAL NOT NULL,
    timestamp      DATETIME NOT NULL,
    device_id      TEXT NOT NULL,
    risk_flag      TEXT,              -- 'HIGH_RISK', 'SUSPICIOUS', or NULL
    rule_triggered TEXT,              -- 'Rule1', 'Rule2', or NULL
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_id   ON transactions(user_id);
CREATE INDEX idx_risk_flag ON transactions(risk_flag);
CREATE INDEX idx_timestamp ON transactions(timestamp);
```

`idx_user_id` is the most critical index — it enables O(log n) lookups when counting a user's transaction history for Rule 2.

---

## Fraud Rule Structure

Rules are evaluated inside `src/services/riskEngine.js`, which is intentionally **decoupled from the route layer**. The function is stateless — it receives the transaction and the pre-fetched user transaction count, making it independently testable.

| Rule | Condition | Priority | Flag |
|:---|:---|:---|:---|
| **Rule 1** | `amount > 20000` | Primary | `HIGH_RISK` |
| **Rule 2** | User already has ≥ 3 transactions | Secondary | `SUSPICIOUS` |

**Evaluation Order:**
1. Rule 1 is checked first. If it triggers, evaluation stops immediately.
2. Rule 2 is only checked if Rule 1 does not trigger.
3. This means a high-amount transaction from a repeat user is always treated as `HIGH_RISK`, never `SUSPICIOUS`.

---

## Timestamp Design Decision

Timestamps are generated **server-side** at the moment the `POST /api/transactions` request is received. This ensures:
- Consistent timezone-aware timestamps regardless of the submitting device's local time.
- No client clock drift or timezone mismatch between simultaneous submissions from different devices.

Clients do **not** send a `timestamp` field — it is intentionally excluded from request validation.

---

## Assumptions

- **Transaction Uniqueness**: `transaction_id` is client-provided and expected to be unique per transaction. The system enforces this at the database level via a `PRIMARY KEY` constraint and returns a `409 Conflict` error if a duplicate is submitted, allowing the caller to handle it gracefully.
- **Real-time Processing**: Fraud evaluation happens synchronously before any record is written to the database.
- **Relational Data**: SQL aggregation (`COUNT`, `SUM(CASE ...)`) is preferred over application-level logic to ensure accurate statistics.

---

## Seeding Test Data

A seeding script is provided to populate the database with 60 sample transactions via the API:

```bash
node seed.js
```

The script sends each transaction to `POST /api/transactions` sequentially and prints the result and fraud flag for each. Duplicate `transaction_id` entries (TX059, TX060) are handled gracefully and reported as `409` without stopping the script.

---

## Scaling to 1M Transactions/Day

At 1M transactions/day the system processes roughly **11–12 transactions per second** on average with peak spikes considerably higher. The following upgrades would be required:

1. **Database Migration**: Replace SQLite with **PostgreSQL**. SQLite does not support concurrent writes and is unsuitable for multi-process or networked deployments.
2. **Indexing**: The `idx_user_id` index already ensures Rule 2 checks stay at O(log n). This design carries forward directly to PostgreSQL.
3. **Caching Layer**: Introduce **Redis** to cache the per-user transaction count. This replaces the SQL `COUNT(*)` query on every POST with a fast in-memory read, significantly reducing database write-path load.
4. **Load Balancing**: Run multiple Node.js instances behind an **Nginx** load balancer to distribute inbound HTTP traffic.
5. **Read Replicas**: Separate read-heavy endpoints (`GET /transactions`, `GET /dashboard`) onto PostgreSQL read replicas, keeping the primary node dedicated to high-throughput writes.

---

## AI Usage Disclosure

This project was developed with the assistance of an AI coding assistant (Antigravity).

- **What was used**: The AI was utilized for boilerplate generation, UI/UX styling suggestions (Vanilla CSS and React), SQL query optimization for the dashboard aggregation, and the creation of the database seeding script.
- **Why it was used**: To accelerate the development of standard utility components and ensure a clean, responsive design for the frontend dashboard within an efficient timeframe.
- **AI-Assisted Parts**:
    - **Frontend Styling**: Modern CSS patterns for the dashboard cards and table highlighting.
    - **Dashboard Aggregation**: Refinement of the `SUM(CASE ...)` SQL logic to ensure efficient single-query stats.
    - **Seeding Script**: Generation of the `seed.js` script to automate data entry for testing.
    - **Documentation**: Structuring and formatting the project documentation.

*Note: The core architecture patterns, database schema definitions, and the specific fraud rule logic were implemented based on human-provided constraints.*
