const app = require('./app');
const SensorRepository = require('./repositories/sensor-repository');
const logger = require('./utils/logger');

const port = process.env.PORT || 8083;
const sensorRepository = new SensorRepository();

// Database connection test
sensorRepository.testConnection()
    .then(() => {
        logger.info('Database connected successfully');

        // Start server
        app.listen(port, () => {
            logger.info(`Sensor service listening on port ${port}`);
        });
    })
    .catch(err => {
        logger.error('Database connection error:', err);
        process.exit(1);
    });

// Handle graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down server...');
    try {
        await sensorRepository.close();
        logger.info('Database connection closed');
        process.exit(0);
    } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
    }
});