/**
 * Telemetry model
 */
class Telemetry {
    constructor(data = {}) {
        this.id = data.id || null;
        this.sensorId = data.sensorId || data.sensor_id || null;
        this.type = data.type || data.sensor_type || '';
        this.unit = data.unit || '';
        this.location = data.location || '';
        this.value = data.value !== undefined ? data.value : null;
        this.status = data.status || '';
        this.timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    }
}

module.exports = Telemetry;