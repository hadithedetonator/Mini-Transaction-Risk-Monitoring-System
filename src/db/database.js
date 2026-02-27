const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      timestamp DATETIME NOT NULL,
      device_id TEXT NOT NULL,
      risk_flag TEXT,
      rule_triggered TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_user_id ON transactions(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_risk_flag ON transactions(risk_flag)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON transactions(created_at)`);
});

/**
 * Executes a SELECT query to get the number of transactions for a user.
 * @param {string} user_id 
 * @returns {Promise<number>}
 */
const getUserTransactionCount = (user_id) => {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?',
            [user_id],
            (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            }
        );
    });
};

/**
 * Inserts a new transaction into the database.
 * @param {Object} transaction 
 * @returns {Promise<void>}
 */
const saveTransaction = (transaction) => {
    const {
        transaction_id,
        user_id,
        amount,
        timestamp,
        device_id,
        risk_flag,
        rule_triggered
    } = transaction;

    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO transactions (transaction_id, user_id, amount, timestamp, device_id, risk_flag, rule_triggered) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [transaction_id, user_id, amount, timestamp, device_id, risk_flag, rule_triggered],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
};

/**
 * Retrieves all transactions from the database.
 * @returns {Promise<Array>}
 */
const getAllTransactions = () => {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM transactions ORDER BY created_at DESC',
            [],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
};

/**
 * Retrieves dashboard statistics from the database.
 * @returns {Promise<Object>}
 */
const getDashboardStats = () => {
    return new Promise((resolve, reject) => {
        const query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN risk_flag IS NOT NULL THEN 1 ELSE 0 END) as flagged_transactions,
        SUM(CASE WHEN risk_flag = 'HIGH_RISK' THEN 1 ELSE 0 END) as high_risk,
        SUM(CASE WHEN risk_flag = 'SUSPICIOUS' THEN 1 ELSE 0 END) as suspicious
      FROM transactions
    `;
        db.get(query, [], (err, row) => {
            if (err) reject(err);
            else {
                resolve({
                    total_transactions: row.total_transactions || 0,
                    flagged_transactions: row.flagged_transactions || 0,
                    high_risk: row.high_risk || 0,
                    suspicious: row.suspicious || 0
                });
            }
        });
    });
};

module.exports = {
    db,
    getUserTransactionCount,
    saveTransaction,
    getAllTransactions,
    getDashboardStats
};
