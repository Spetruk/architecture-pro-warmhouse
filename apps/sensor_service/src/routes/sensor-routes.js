// In src/routes/sensor-routes.js
const express = require('express');
const router = express.Router();
const SensorController = require('../controllers/sensor-controller');
const SensorRepository = require('../repositories/sensor-repository');
const TelemetryServiceClient = require('../clients/telemetry-service-client');

// Create dependencies
const sensorRepository = new SensorRepository();
const telemetryServiceClient = new TelemetryServiceClient();
const sensorController = new SensorController(sensorRepository, telemetryServiceClient);

// GET /api/v1/sensors/telemetry (with query param)
router.get('/telemetry', (req, res) => {
    const location = req.query.location;
    if (!location) {
        return res.status(400).json({
            success: false,
            data: null,
            message: "Location query parameter is required",
            timestamp: new Date().toISOString()
        });
    }

    // Remove quotes if they exist in the location string
    const cleanLocation = location.replace(/^"(.*)"$/, '$1');
    return sensorController.getTelemetryByLocation(req, res, cleanLocation);
});


// PATCH /api/v1/sensors/:id/value
router.patch('/:id/value', (req, res) => sensorController.updateSensorValue(req, res));


// GET /api/v1/sensors
router.get('/', (req, res) => sensorController.getSensors(req, res));

// GET /api/v1/sensors/:id
router.get('/:id', (req, res) => sensorController.getSensorById(req, res));

// POST /api/v1/sensors
router.post('/', (req, res) => sensorController.createSensor(req, res));

// PUT /api/v1/sensors/:id
router.put('/:id', (req, res) => sensorController.updateSensor(req, res));

// DELETE /api/v1/sensors/:id
router.delete('/:id', (req, res) => sensorController.deleteSensor(req, res));





module.exports = router;