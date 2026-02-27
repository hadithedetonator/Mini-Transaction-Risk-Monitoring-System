const express = require('express');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Load Routes
app.use('/api', transactionRoutes);

// Simple health check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
