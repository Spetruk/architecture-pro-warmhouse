/**
 * Sensor type constants
 */
const SensorTypes = {
    TEMPERATURE: 'temperature',
    HUMIDITY: 'humidity',
    LIGHT: 'light',
    MOTION: 'motion',
    AIR_QUALITY: 'air_quality',
    PRESSURE: 'pressure'
};

/**
 * Sensor model
 */
class Sensor {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.type = data.type || '';
        this.location = data.location || '';
        this.value = data.value !== undefined ? data.value : null;
        this.unit = data.unit || '';
        this.status = data.status || 'inactive';
        this.lastUpdated = data.lastUpdated || data.last_updated || new Date();
        this.createdAt = data.createdAt || data.created_at || new Date();
        this.telemetryStatus = data.telemetryStatus || '';
    }

    /**
     * Convert database row to Sensor
     */
    static fromDb(row) {
        return new Sensor({
            id: row.id,
            name: row.name,
            type: row.type,
            location: row.location,
            value: row.value,
            unit: row.unit,
            status: row.status,
            lastUpdated: row.last_updated,
            createdAt: row.created_at
        });
    }

    /**
     * Validate complete sensor
     */
    validate() {
        const errors = [];

        if (!this.name) errors.push('Name is required');
        if (!this.type) {
            errors.push('Type is required');
        } else if (!Object.values(SensorTypes).includes(this.type)) {
            errors.push(`Type must be one of: ${Object.values(SensorTypes).join(', ')}`);
        }
        if (!this.location) errors.push('Location is required');
        if (!this.unit) errors.push('Unit is required');

        return errors.length ? errors : null;
    }
}

/**
 * SensorCreate model for creating new sensors
 */
class SensorCreate {
    constructor(data = {}) {
        this.name = data.name || '';
        this.type = data.type || '';
        this.location = data.location || '';
        this.unit = data.unit || '';
    }

    /**
     * Validate sensor creation data
     */
    validate() {
        const errors = [];

        if (!this.name) errors.push('Name is required');
        if (!this.type) {
            errors.push('Type is required');
        } else if (!Object.values(SensorTypes).includes(this.type)) {
            errors.push(`Type must be one of: ${Object.values(SensorTypes).join(', ')}`);
        }
        if (!this.location) errors.push('Location is required');
        if (!this.unit) errors.push('Unit is required');

        return errors.length ? errors : null;
    }
}

/**
 * SensorUpdate model for updating sensors
 */
class SensorUpdate {
    constructor(data = {}) {
        this.name = data.name;
        this.type = data.type;
        this.location = data.location;
        this.value = data.value;
        this.unit = data.unit;
        this.status = data.status;
    }

    /**
     * Validate sensor update data
     */
    validate() {
        const errors = [];

        if (this.type && !Object.values(SensorTypes).includes(this.type)) {
            errors.push(`Type must be one of: ${Object.values(SensorTypes).join(', ')}`);
        }

        return errors.length ? errors : null;
    }
}

module.exports = {
    SensorTypes,
    Sensor,
    SensorCreate,
    SensorUpdate
};