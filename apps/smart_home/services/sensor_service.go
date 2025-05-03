package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"smarthome/models"
)

// SensorService handles communication with the sensor service API
type SensorService struct {
	BaseURL    string
	HTTPClient *http.Client
}

// NewSensorService creates a new sensor service client
func NewSensorService(baseURL string) *SensorService {
	return &SensorService{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// GetSensors fetches all sensors
func (s *SensorService) GetSensors() ([]models.Sensor, error) {
	url := fmt.Sprintf("%s/api/v1/sensors", s.BaseURL)

	resp, err := s.HTTPClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("error fetching sensors: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var response struct {
		Success   bool            `json:"success"`
		Data      []models.Sensor `json:"data"`
		Message   string          `json:"message"`
		Timestamp string          `json:"timestamp"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("error decoding response: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("service error: %s", response.Message)
	}

	return response.Data, nil
}

// GetSensorByID fetches a sensor by its ID
func (s *SensorService) GetSensorByID(id int) (models.Sensor, error) {
	url := fmt.Sprintf("%s/api/v1/sensors/%d", s.BaseURL, id)

	resp, err := s.HTTPClient.Get(url)
	if err != nil {
		return models.Sensor{}, fmt.Errorf("error fetching sensor: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return models.Sensor{}, fmt.Errorf("sensor not found")
	}

	if resp.StatusCode != http.StatusOK {
		return models.Sensor{}, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var response struct {
		Success   bool          `json:"success"`
		Data      models.Sensor `json:"data"`
		Message   string        `json:"message"`
		Timestamp string        `json:"timestamp"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return models.Sensor{}, fmt.Errorf("error decoding response: %w", err)
	}

	if !response.Success {
		return models.Sensor{}, fmt.Errorf("service error: %s", response.Message)
	}

	return response.Data, nil
}

// CreateSensor creates a new sensor
func (s *SensorService) CreateSensor(sensorCreate models.SensorCreate) (models.Sensor, error) {
	url := fmt.Sprintf("%s/api/v1/sensors", s.BaseURL)

	bodyData, err := json.Marshal(sensorCreate)
	if err != nil {
		return models.Sensor{}, fmt.Errorf("error marshaling request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyData))
	if err != nil {
		return models.Sensor{}, fmt.Errorf("error creating request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return models.Sensor{}, fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return models.Sensor{}, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var response struct {
		Success   bool          `json:"success"`
		Data      models.Sensor `json:"data"`
		Message   string        `json:"message"`
		Timestamp string        `json:"timestamp"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return models.Sensor{}, fmt.Errorf("error decoding response: %w", err)
	}

	if !response.Success {
		return models.Sensor{}, fmt.Errorf("service error: %s", response.Message)
	}

	return response.Data, nil
}

// UpdateSensor updates an existing sensor
func (s *SensorService) UpdateSensor(id int, sensorUpdate models.SensorUpdate) (models.Sensor, error) {
	url := fmt.Sprintf("%s/api/v1/sensors/%d", s.BaseURL, id)

	bodyData, err := json.Marshal(sensorUpdate)
	if err != nil {
		return models.Sensor{}, fmt.Errorf("error marshaling request: %w", err)
	}

	req, err := http.NewRequest("PUT", url, bytes.NewBuffer(bodyData))
	if err != nil {
		return models.Sensor{}, fmt.Errorf("error creating request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return models.Sensor{}, fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return models.Sensor{}, fmt.Errorf("sensor not found")
	}

	if resp.StatusCode != http.StatusOK {
		return models.Sensor{}, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var response struct {
		Success   bool          `json:"success"`
		Data      models.Sensor `json:"data"`
		Message   string        `json:"message"`
		Timestamp string        `json:"timestamp"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return models.Sensor{}, fmt.Errorf("error decoding response: %w", err)
	}

	if !response.Success {
		return models.Sensor{}, fmt.Errorf("service error: %s", response.Message)
	}

	return response.Data, nil
}

// DeleteSensor deletes a sensor
func (s *SensorService) DeleteSensor(id int) error {
	url := fmt.Sprintf("%s/api/v1/sensors/%d", s.BaseURL, id)

	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return fmt.Errorf("error creating request: %w", err)
	}

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return fmt.Errorf("sensor not found")
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var response struct {
		Success   bool        `json:"success"`
		Data      interface{} `json:"data"`
		Message   string      `json:"message"`
		Timestamp string      `json:"timestamp"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return fmt.Errorf("error decoding response: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("service error: %s", response.Message)
	}

	return nil
}

// UpdateSensorValue updates a sensor's value and status

// GetTemperatureByLocation fetches temperature data for a specific location
func (s *SensorService) GetTemperatureByLocation(location string) (models.Sensor, error) {
	url := fmt.Sprintf("%s/api/v1/sensors/telemetry?location=%s", s.BaseURL, location)

	resp, err := s.HTTPClient.Get(url)
	if err != nil {
		return models.Sensor{}, fmt.Errorf("error fetching temperature data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return models.Sensor{}, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var response struct {
		Success   bool          `json:"success"`
		Data      models.Sensor `json:"data"`
		Message   string        `json:"message"`
		Timestamp string        `json:"timestamp"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return models.Sensor{}, fmt.Errorf("error decoding response: %w", err)
	}

	if !response.Success {
		return models.Sensor{}, fmt.Errorf("service error: %s", response.Message)
	}

	return response.Data, nil
}

// UpdateSensorValue updates a sensor's value and status
func (s *SensorService) UpdateSensorValue(id int, value float64, status string) error {
	url := fmt.Sprintf("%s/api/v1/sensors/%d/value", s.BaseURL, id)

	// Create request body as JSON
	requestBody := map[string]interface{}{
		"value":  value,
		"status": status,
	}

	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return fmt.Errorf("error marshaling request: %w", err)
	}

	// Debug output
	fmt.Println("Request body:", string(bodyBytes))

	// Create request with body
	req, err := http.NewRequest("PATCH", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return fmt.Errorf("error creating request: %w", err)
	}

	// IMPORTANT: set Content-Type header
	req.Header.Set("Content-Type", "application/json")

	// Debug output
	fmt.Println("Request headers:", req.Header)

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("error reading response: %w", err)
	}

	// Debug output
	fmt.Println("Response status:", resp.Status)
	fmt.Println("Response body:", string(respBody))

	// Check status code
	if resp.StatusCode == http.StatusNotFound {
		return fmt.Errorf("sensor not found")
	}

	if resp.StatusCode != http.StatusOK {
		// Try to parse the error response
		var errorResponse struct {
			Success   bool        `json:"success"`
			Data      interface{} `json:"data"`
			Message   string      `json:"message"`
			Timestamp string      `json:"timestamp"`
		}

		if err := json.Unmarshal(respBody, &errorResponse); err == nil && errorResponse.Message != "" {
			return fmt.Errorf("%s", errorResponse.Message)
		}

		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}
