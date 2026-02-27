const express = require('express');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Load Routes
app.use('/api', transactionRoutes);

// Health check - verifies server is alive AND database is reachable
app.get('/health', (req, res) => {
    const { db } = require('./db/database');
    db.get('SELECT 1', [], (err) => {
        if (err) {
            return res.status(503).json({
                status: 'ERROR',
                database: 'unreachable',
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        }
        return res.status(200).json({
            status: 'OK',
            database: 'connected',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
