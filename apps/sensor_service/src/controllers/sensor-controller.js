const ApiResponse = require('../models/api-response');
const { SensorCreate, SensorUpdate } = require('../models/sensor');
const logger = require('../utils/logger');

/**
 * SensorController for handling sensor operations
 */
class SensorController {
    constructor(sensorRepository, telemetryServiceClient) {
        this.sensorRepository = sensorRepository;
        this.telemetryServiceClient = telemetryServiceClient;
    }

    /**
     * Get all sensors
     */
    async getSensors(req, res) {
        try {
            const sensors = await this.sensorRepository.getSensors();

            // Создаем массив промисов для параллельного запроса телеметрии
            const telemetryPromises = sensors
                .filter(sensor => sensor.type === 'temperature')
                .map(async (sensor) => {
                    try {
                        const telemetryData = await this.telemetryServiceClient.getTelemetryBySensor(sensor.id.toString());
                        return {
                            sensorId: sensor.id,
                            data: telemetryData,
                            success: true
                        };
                    } catch (err) {
                        logger.error(`Не удалось получить данные телеметрии для датчика ${sensor.id}: ${err.message}`);
                        return {
                            sensorId: sensor.id,
                            error: err.message,
                            success: false
                        };
                    }
                });

            // Ждем завершения всех запросов телеметрии
            const results = await Promise.all(telemetryPromises);

            // Обновляем датчики полученными данными телеметрии
            results.forEach(result => {
                if (result.success) {
                    const sensor = sensors.find(s => s.id === result.sensorId);
                    if (sensor) {
                        sensor.value = result.data.value;
                        sensor.lastUpdated = result.data.timestamp;
                        sensor.telemetryStatus = "updated";

                        logger.info(`Обновлены данные температуры для датчика ${sensor.id} из сервиса телеметрии`);
                    }
                } else {
                    const sensor = sensors.find(s => s.id === result.sensorId);
                    if (sensor) {
                        sensor.telemetryStatus = "error";
                        sensor.telemetryError = result.error;
                    }
                }
            });

            return ApiResponse.success(sensors).send(res);
        } catch (err) {
            logger.error('Ошибка при получении датчиков:', err);
            return ApiResponse.serverError(err.message).send(res);
        }
    }

    /**
     * Get a sensor by ID
     */
    async getSensorById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return ApiResponse.badRequest('Invalid sensor ID').send(res);
            }

            const sensor = await this.sensorRepository.getSensorById(id);

            // If this is a temperature sensor, fetch real-time data from the telemetry service
            if (sensor.type === 'temperature') {
                try {
                    const telemetryData = await this.telemetryServiceClient.getTelemetryBySensor(id.toString());

                    // Only update if we got a successful response
                    if (!(telemetryData instanceof ApiResponse) || telemetryData.statusCode === 200) {
                        // Update sensor with real-time data
                        sensor.value = telemetryData.value;
                        sensor.status = telemetryData.status;
                        sensor.lastUpdated = telemetryData.timestamp;

                        logger.info(`Updated temperature data for sensor ${id} from telemetry service`);
                    }
                } catch (err) {
                    logger.error(`Failed to fetch temperature data for sensor ${id}: ${err.message}`);
                }
            }

            return ApiResponse.success(sensor).send(res);
        } catch (err) {
            if (err.message === 'Sensor not found') {
                return ApiResponse.notFound(err.message).send(res);
            }
            logger.error(`Error getting sensor by ID:`, err);
            return ApiResponse.serverError(err.message).send(res);
        }
    }

    /**
     * Create a new sensor
     */
    async createSensor(req, res) {
        try {
            const sensorCreate = new SensorCreate(req.body);
            const validationErrors = sensorCreate.validate();

            if (validationErrors) {
                return ApiResponse.badRequest(validationErrors.join(', ')).send(res);
            }

            const newSensor = await this.sensorRepository.createSensor(sensorCreate);
            return ApiResponse.created(newSensor).send(res);
        } catch (err) {
            logger.error('Error creating sensor:', err);
            return ApiResponse.serverError(err.message).send(res);
        }
    }

    /**
     * Update a sensor
     */
    async updateSensor(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return ApiResponse.badRequest('Invalid sensor ID').send(res);
            }

            const sensorUpdate = new SensorUpdate(req.body);
            const validationErrors = sensorUpdate.validate();

            if (validationErrors) {
                return ApiResponse.badRequest(validationErrors.join(', ')).send(res);
            }

            const updatedSensor = await this.sensorRepository.updateSensor(id, sensorUpdate);
            return ApiResponse.success(updatedSensor).send(res);
        } catch (err) {
            if (err.message === 'Sensor not found') {
                return ApiResponse.notFound(err.message).send(res);
            }
            logger.error(`Error updating sensor:`, err);
            return ApiResponse.serverError(err.message).send(res);
        }
    }

    /**
     * Delete a sensor
     */
    async deleteSensor(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return ApiResponse.badRequest('Invalid sensor ID').send(res);
            }

            await this.sensorRepository.deleteSensor(id);
            return ApiResponse.success(null, 'Sensor deleted successfully').send(res);
        } catch (err) {
            if (err.message === 'Sensor not found') {
                return ApiResponse.notFound(err.message).send(res);
            }
            logger.error(`Error deleting sensor:`, err);
            return ApiResponse.serverError(err.message).send(res);
        }
    }

    async updateSensorValue(req, res) {
        try {
            console.log("Request received:", {
                method: req.method,
                url: req.url,
                body: req.body,
                headers: req.headers
            });

            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                console.log("Invalid ID:", req.params.id);
                return ApiResponse.badRequest('Invalid sensor ID').send(res);
            }

            const { value, status } = req.body;
            console.log("Parsed body:", { value, status });

            if (value === undefined || !status) {
                console.log("Missing required fields");
                return ApiResponse.badRequest('Value and status are required').send(res);
            }

            await this.sensorRepository.updateSensorValue(id, value, status);

            console.log("Update successful");
            return ApiResponse.success(null, 'Sensor value updated successfully').send(res);
        } catch (err) {
            console.log("Error in updateSensorValue:", err);
            if (err.message === 'Sensor not found') {
                return ApiResponse.notFound(err.message).send(res);
            }
            logger.error(`Error updating sensor value:`, err);
            return ApiResponse.serverError(err.message).send(res);
        }
    }

    /**
     * Get telemetry by location
     */
    async getTelemetryByLocation(req, res, location) {
        try {
            // Use location from parameter if provided, otherwise from request params
            const locationValue = location || req.params.location;

            if (!locationValue) {
                return ApiResponse.badRequest('Location is required').send(res);
            }

            try {
                const telemetryData = await this.telemetryServiceClient.getTelemetryByLocation(locationValue);

                // Return the telemetry data
                return ApiResponse.success({
                    location: telemetryData.location,
                    value: telemetryData.value,
                    unit: telemetryData.unit,
                    status: telemetryData.status,
                    timestamp: telemetryData.timestamp,
                    type: telemetryData.type,
                    sensorId: telemetryData.sensorId
                }).send(res);
            } catch (err) {
                return ApiResponse.serverError(err.message).send(res);
            }
        } catch (err) {
            logger.error(`Error getting telemetry by location:`, err);
            return ApiResponse.serverError(err.message).send(res);
        }
    }
}

module.exports = SensorController;