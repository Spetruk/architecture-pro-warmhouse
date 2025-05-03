const axios = require('axios');
const logger = require('../utils/logger');

// Import Telemetry class (make sure the path is correct)
const Telemetry = require('../models/telemetry');

/**
 * TelemetryServiceClient for communicating with telemetry service
 */
class TelemetryServiceClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || process.env.TELEMETRY_SERVICE_URL || 'http://telemetry_service:8082';
        this.httpClient = axios.create({
            baseURL: this.baseUrl,
            timeout: 5000
        });
    }

    /**
     * Get telemetry data for a specific sensor ID
     */
    async getTelemetryBySensor(sensorId) {
        try {
            logger.info(`Fetching telemetry for sensor ID: ${sensorId}`);
            const response = await this.httpClient.get(`/telemetry/${sensorId}`);

            logger.info(`Response received for sensor ${sensorId}:`, response.data);

            return new Telemetry({
                sensorId: response.data.sensor_id,
                type: response.data.sensor_type,
                unit: response.data.unit,
                location: response.data.location,
                value: response.data.value,
                status: response.data.status,
                timestamp: response.data.timestamp
            });
        } catch (error) {
            logger.error(`Error fetching telemetry for sensor ${sensorId}:`, error);

            if (error.response) {
                throw new Error(`Telemetry service error: ${error.response.data.error || 'Unknown error'}`);
            } else if (error.request) {
                throw new Error('Could not connect to telemetry service');
            } else {
                throw new Error(`Error setting up telemetry request: ${error.message}`);
            }
        }
    }

    /**
     * Get telemetry data for a specific location
     */
    async getTelemetryByLocation(location) {
        try {
            logger.info(`Fetching telemetry for location: ${location}`);

            const response = await this.httpClient.get('/telemetry', {
                params: {
                    type: 'temperature',
                    location: location
                }
            });

            logger.info(`Response received for location ${location}:`, response.data);

            return new Telemetry({
                sensorId: response.data.sensor_id,
                type: response.data.sensor_type,
                unit: response.data.unit,
                location: response.data.location,
                value: response.data.value,
                status: response.data.status,
                timestamp: response.data.timestamp
            });
        } catch (error) {
            logger.error(`Error fetching telemetry for location ${location}:`, error);

            if (error.response) {
                throw new Error(`Telemetry service error: ${error.response.data.error || 'Unknown error'}`);
            } else if (error.request) {
                throw new Error('Could not connect to telemetry service');
            } else {
                throw new Error(`Error setting up telemetry request: ${error.message}`);
            }
        }
    }
}

module.exports = TelemetryServiceClient;