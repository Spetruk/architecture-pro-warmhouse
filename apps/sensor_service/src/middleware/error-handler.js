const ApiResponse = require('../models/api-response');
const logger = require('../utils/logger');

/**
 * Error handling middleware
 */
function errorHandler(err, req, res, next) {
    logger.error(err.stack);

    // Default to 500 server error
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

    // Handle known errors
    if (err.message === 'Sensor not found') {
        return ApiResponse.notFound(err.message).send(res);
    }

    // General error response
    return ApiResponse.serverError(err.message || 'Internal Server Error').send(res);
}

module.exports = errorHandler;