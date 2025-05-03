// handlers/sensor_handler.go
package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"smarthome/models"
	"smarthome/services"

	"github.com/gin-gonic/gin"
)

// SensorHandler обрабатывает запросы, связанные с датчиками
type SensorHandler struct {
	SensorService *services.SensorService
}

// NewSensorHandler создает новый SensorHandler
func NewSensorHandler(sensorService *services.SensorService) *SensorHandler {
	return &SensorHandler{
		SensorService: sensorService,
	}
}

// RegisterRoutes регистрирует маршруты датчиков
func (h *SensorHandler) RegisterRoutes(router *gin.RouterGroup) {
	sensors := router.Group("/sensors")
	{
		sensors.GET("", h.GetSensors)
		sensors.GET("/:id", h.GetSensorByID)
		sensors.POST("", h.CreateSensor)
		sensors.PUT("/:id", h.UpdateSensor)
		sensors.DELETE("/:id", h.DeleteSensor)
		sensors.PATCH("/:id/value", h.UpdateSensorValue)
		sensors.GET("/temperature/:location", h.GetTemperatureByLocation)
	}
}

// GetSensors обрабатывает GET /api/v1/sensors
func (h *SensorHandler) GetSensors(c *gin.Context) {
	sensors, err := h.SensorService.GetSensors()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sensors)
}

// GetSensorByID обрабатывает GET /api/v1/sensors/:id
func (h *SensorHandler) GetSensorByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sensor ID"})
		return
	}

	sensor, err := h.SensorService.GetSensorByID(id)
	if err != nil {
		if err.Error() == "sensor not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sensor not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, sensor)
}

// GetTemperatureByLocation обрабатывает GET /api/v1/sensors/temperature/:location
func (h *SensorHandler) GetTemperatureByLocation(c *gin.Context) {
	location := c.Param("location")
	if location == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Location is required"})
		return
	}

	// Получаем температурные данные из sensor-service
	tempData, err := h.SensorService.GetTemperatureByLocation(location)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Возвращаем температурные данные
	c.JSON(http.StatusOK, gin.H{
		"location":    tempData.Location,
		"value":       tempData.Value,
		"unit":        tempData.Unit,
		"status":      tempData.Status,
		"lastUpdated": tempData.LastUpdated,
		"createdAt":   tempData.CreatedAt,
		"type":        tempData.Type,
		"sensor_id":   tempData.ID,
	})
}

// CreateSensor обрабатывает POST /api/v1/sensors
func (h *SensorHandler) CreateSensor(c *gin.Context) {
	var sensorCreate models.SensorCreate
	if err := c.ShouldBindJSON(&sensorCreate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sensor, err := h.SensorService.CreateSensor(sensorCreate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, sensor)
}

// UpdateSensor обрабатывает PUT /api/v1/sensors/:id
func (h *SensorHandler) UpdateSensor(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sensor ID"})
		return
	}

	var sensorUpdate models.SensorUpdate
	if err := c.ShouldBindJSON(&sensorUpdate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sensor, err := h.SensorService.UpdateSensor(id, sensorUpdate)
	if err != nil {
		if err.Error() == "sensor not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sensor not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, sensor)
}

// DeleteSensor обрабатывает DELETE /api/v1/sensors/:id
func (h *SensorHandler) DeleteSensor(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sensor ID"})
		return
	}

	err = h.SensorService.DeleteSensor(id)
	if err != nil {
		if err.Error() == "sensor not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sensor not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sensor deleted successfully"})
}

// UpdateSensorValue обрабатывает PATCH /api/v1/sensors/:id/value
func (h *SensorHandler) UpdateSensorValue(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"data":      nil,
			"message":   "Invalid sensor ID",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	var request struct {
		Value  float64 `json:"value" binding:"required"`
		Status string  `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"data":      nil,
			"message":   err.Error(),
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	fmt.Println("Before calling UpdateSensorValue service method")
	err = h.SensorService.UpdateSensorValue(id, request.Value, request.Status)
	fmt.Println("After calling UpdateSensorValue service method")

	if err != nil {
		if err.Error() == "sensor not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"success":   false,
				"data":      nil,
				"message":   "Sensor not found",
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success":   false,
				"data":      nil,
				"message":   err.Error(),
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      nil,
		"message":   "Sensor value updated successfully",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}
