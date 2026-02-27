const express = require('express');
const router = express.Router();
const database = require('../db/database');
const { evaluateRisk } = require('../services/riskEngine');

/**
 * POST /transactions
 * Processes a new transaction, evaluates risk, and stores it.
 */
router.post('/transactions', async (req, res) => {
    const { transaction_id, user_id, amount, device_id } = req.body;

    // 1. Basic Validation 
    if (!transaction_id || !user_id || amount === undefined || !device_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate timestamp on the server to ensure consistency across all devices
    const timestamp = new Date().toISOString();

    try {
        // 2. Evaluate Fraud Rules
        const userTransactionCount = await database.getUserTransactionCount(user_id);
        const { risk_flag, rule_triggered } = evaluateRisk({ amount }, userTransactionCount);

        // 3. Save to Database
        const transaction = {
            transaction_id,
            user_id,
            amount,
            timestamp,
            device_id,
            risk_flag,
            rule_triggered
        };

        await database.saveTransaction(transaction);

        // 4. Return saved transaction
        return res.status(201).json(transaction);

    } catch (error) {
        // Handle duplicate transaction_id (Primary Key constraint)
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Duplicate transaction_id' });
        }

        console.error('Error processing transaction:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * GET /transactions
 * Returns all transactions stored in the database.
 */
router.get('/transactions', async (req, res) => {
    try {
        const transactions = await database.getAllTransactions();
        return res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * GET /dashboard
 * Returns overall risk statistics.
 */
router.get('/dashboard', async (req, res) => {
    try {
        const stats = await database.getDashboardStats();
        return res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
