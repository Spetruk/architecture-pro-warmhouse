const { Pool } = require('pg');
const { Sensor, SensorCreate, SensorUpdate } = require('../models/sensor');
const logger = require('../utils/logger');

/**
 * SensorRepository for database operations
 */
class SensorRepository {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
    }

    /**
     * Close database connection
     */
    async close() {
        await this.pool.end();
    }

    /**
     * Test database connection
     */
    async testConnection() {
        const client = await this.pool.connect();
        try {
            await client.query('SELECT NOW()');
            return true;
        } finally {
            client.release();
        }
    }

    /**
     * Get all sensors
     */
    async getSensors() {
        const query = `
      SELECT id, name, type, location, value, unit, status, last_updated, created_at
      FROM sensors
      ORDER BY id
    `;

        try {
            const result = await this.pool.query(query);
            return result.rows.map(row => new Sensor({
                id: row.id,
                name: row.name,
                type: row.type,
                location: row.location,
                value: row.value,
                unit: row.unit,
                status: row.status,
                lastUpdated: row.last_updated,
                createdAt: row.created_at
            }));
        } catch (err) {
            logger.error('Error getting sensors:', err);
            throw new Error(`Failed to get sensors: ${err.message}`);
        }
    }

    /**
     * Get sensor by ID
     */
    async getSensorById(id) {
        const query = `
      SELECT id, name, type, location, value, unit, status, last_updated, created_at
      FROM sensors
      WHERE id = $1
    `;

        try {
            const result = await this.pool.query(query, [id]);

            if (result.rows.length === 0) {
                throw new Error('Sensor not found');
            }

            const row = result.rows[0];
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
        } catch (err) {
            logger.error(`Error getting sensor ${id}:`, err);
            throw new Error(`Failed to get sensor: ${err.message}`);
        }
    }

    /**
     * Create a new sensor
     */
    async createSensor(sensorCreate) {
        const query = `
      INSERT INTO sensors (name, type, location, unit, status, last_updated, created_at)
      VALUES ($1, $2, $3, $4, 'inactive', $5, $5)
      RETURNING id, name, type, location, value, unit, status, last_updated, created_at
    `;

        const now = new Date();
        const values = [
            sensorCreate.name,
            sensorCreate.type,
            sensorCreate.location,
            sensorCreate.unit,
            now
        ];

        try {
            const result = await this.pool.query(query, values);
            const row = result.rows[0];

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
        } catch (err) {
            logger.error('Error creating sensor:', err);
            throw new Error(`Failed to create sensor: ${err.message}`);
        }
    }

    /**
     * Update a sensor
     */
    async updateSensor(id, sensorUpdate) {
        // First check if the sensor exists
        await this.getSensorById(id);

        // Build the update query dynamically based on which fields are provided
        let query = 'UPDATE sensors SET last_updated = $1';
        const args = [new Date()];
        let argCount = 2;

        if (sensorUpdate.name) {
            query += `, name = $${argCount}`;
            args.push(sensorUpdate.name);
            argCount++;
        }

        if (sensorUpdate.type) {
            query += `, type = $${argCount}`;
            args.push(sensorUpdate.type);
            argCount++;
        }

        if (sensorUpdate.location) {
            query += `, location = $${argCount}`;
            args.push(sensorUpdate.location);
            argCount++;
        }

        if (sensorUpdate.value !== undefined) {
            query += `, value = $${argCount}`;
            args.push(sensorUpdate.value);
            argCount++;
        }

        if (sensorUpdate.unit) {
            query += `, unit = $${argCount}`;
            args.push(sensorUpdate.unit);
            argCount++;
        }

        if (sensorUpdate.status) {
            query += `, status = $${argCount}`;
            args.push(sensorUpdate.status);
            argCount++;
        }

        // Add the WHERE clause and RETURNING clause
        query += ` WHERE id = $${argCount}
      RETURNING id, name, type, location, value, unit, status, last_updated, created_at`;
        args.push(id);

        try {
            const result = await this.pool.query(query, args);
            const row = result.rows[0];

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
        } catch (err) {
            logger.error(`Error updating sensor ${id}:`, err);
            throw new Error(`Failed to update sensor: ${err.message}`);
        }
    }

    /**
     * Update sensor value and status
     */
    async updateSensorValue(id, value, status) {
        const query = `
    UPDATE sensors
    SET value = $1, status = $2, last_updated = $3
    WHERE id = $4
  `;

        try {
            const result = await this.pool.query(query, [value, status, new Date(), id]);

            if (result.rowCount === 0) {
                throw new Error('Sensor not found');
            }

            return { message: 'Sensor value updated successfully' };
        } catch (err) {
            logger.error(`Error updating sensor value ${id}:`, err);
            throw new Error(`Failed to update sensor value: ${err.message}`);
        }
    }

    /**
     * Delete a sensor
     */
    async deleteSensor(id) {
        const query = 'DELETE FROM sensors WHERE id = $1';

        try {
            const result = await this.pool.query(query, [id]);

            if (result.rowCount === 0) {
                throw new Error('Sensor not found');
            }

            return true;
        } catch (err) {
            logger.error(`Error deleting sensor ${id}:`, err);
            throw new Error(`Failed to delete sensor: ${err.message}`);
        }
    }
}

module.exports = SensorRepository;