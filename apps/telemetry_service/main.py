from flask import Flask, request, jsonify
import requests
from datetime import datetime
import os

app = Flask(__name__)

# Get the GO service URL from environment variable with a fallback
TEMPERATURE_API_URL = os.environ.get("TEMPERATURE_API_URL", "")

# Route for getting telemetry by location and type
@app.route('/telemetry', methods=['GET'])
def get_telemetry_by_location_and_type():

    # Get query parameters
    telemetry_type = request.args.get('type')
    location = request.args.get('location')

    # Check if required parameters are provided
    if not telemetry_type or not location:
        error_response = {
            "error": "Missing required parameters: type and location",
            "code": 400,
            "timestamp": datetime.now().isoformat()
        }
        return jsonify(error_response), 400

    # Validate telemetry type
    valid_types = ["temperature", "humidity", "light", "motion", "air_quality", "pressure"]
    if telemetry_type not in valid_types:
        error_response = {
            "error": f"Invalid telemetry type. Must be one of: {', '.join(valid_types)}",
            "code": 400,
            "timestamp": datetime.now().isoformat()
        }
        return jsonify(error_response), 400

    # For now, we only have temperature endpoint in the Go service
    if telemetry_type == "temperature":
        try:
            # Call the Go service
            response = requests.get(f"{TEMPERATURE_API_URL}/temperature", params={"location": location})

            if response.status_code == 200:
                # Transform the response to match our API specification
                go_data = response.json()
                telemetry_response = {
                    "value": go_data["value"],
                    "unit": go_data["unit"],
                    "timestamp": go_data["timestamp"],
                    "location": go_data["location"],
                    "status": go_data["status"],
                    "sensor_id": go_data["sensor_id"],
                    "sensor_type": go_data["sensor_type"]
                }
                return jsonify(telemetry_response), 200
            else:
                error_response = {
                    "error": "Error retrieving data from sensor service",
                    "code": response.status_code,
                    "timestamp": datetime.now().isoformat()
                }
                return jsonify(error_response), response.status_code
        except requests.RequestException as e:
            error_response = {
                "error": f"Failed to connect to sensor service: {str(e)}",
                "code": 500,
                "timestamp": datetime.now().isoformat()
            }
            return jsonify(error_response), 500
    else:
        # For other telemetry types that aren't implemented in the Go service
        error_response = {
            "error": f"Telemetry type '{telemetry_type}' is not currently supported",
            "code": 404,
            "timestamp": datetime.now().isoformat()
        }
        return jsonify(error_response), 404

# Route for getting telemetry by sensor ID
@app.route('/telemetry/<sensor_id>', methods=['GET'])
def get_telemetry_by_sensor_id(sensor_id):
    try:
        #TODO: now supports only temperature, but it future it will take from database with telemetry and meta info like type of sensor
        response = requests.get(f"{TEMPERATURE_API_URL}/temperature/{sensor_id}")

        if response.status_code == 200:
            # Transform the response to match our API specification
            go_data = response.json()
            telemetry_response = {
                "value": go_data["value"],
                "unit": go_data["unit"],
                "timestamp": go_data["timestamp"],
                "location": go_data["location"],
                "status": go_data["status"],
                "sensor_id": go_data["sensor_id"],
                "sensor_type": go_data["sensor_type"]
            }
            return jsonify(telemetry_response), 200
        else:
            error_response = {
                "error": f"Sensor with ID '{sensor_id}' not found",
                "code": 404,
                "timestamp": datetime.now().isoformat()
            }
            return jsonify(error_response), 404
    except requests.RequestException as e:
        error_response = {
            "error": f"Failed to connect to sensor service: {str(e)}",
            "code": 500,
            "timestamp": datetime.now().isoformat()
        }
        return jsonify(error_response), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8082, debug=True)