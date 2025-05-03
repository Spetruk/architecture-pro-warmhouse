const express = require('express');
const cors = require('cors');
const sensorRoutes = require('./routes/sensor-routes');
const errorHandler = require('./middleware/error-handler');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/v1/sensors', sensorRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;