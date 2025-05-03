package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type TelemetryPayload struct {
	Unit       string    `json:"unit"`
	Value      float64   `json:"value"`
	Location   string    `json:"location"`
	SensorID   string    `json:"sensor_id"`
	Status     string    `json:"status"`
	SensorType string    `json:"sensor_type"`
	Timestamp  time.Time `json:"timestamp"`
}

func main() {
	app := gin.Default()

	// By location
	app.GET("/temperature", func(c *gin.Context) {
		loc := c.Query("location")
		if loc == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Location is required"})
			return
		}
		resp := synthData(loc, "")
		c.JSON(http.StatusOK, resp)
	})

	// By sensor ID
	app.GET("/temperature/:id", func(c *gin.Context) {
		sid := c.Param("id")
		if sid == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Sensor ID is required"})
			return
		}
		resp := synthData("", sid)
		c.JSON(http.StatusOK, resp)
	})

	log.Println("Launching service on :8081")
	if err := app.Run(":8081"); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

func synthData(loc, sid string) TelemetryPayload {
	// Простейшая псевдорандомизация
	v := 18.0 + float64(time.Now().UnixNano()%10) + float64(time.Now().UnixNano()%100)/100.0

	if loc == "" {
		switch sid {
		case "1":
			loc = "Living Room"
		case "2":
			loc = "Bedroom"
		case "3":
			loc = "Kitchen"
		default:
			loc = "Unknown"
		}
	}

	if sid == "" {
		switch loc {
		case "Living Room":
			sid = "1"
		case "Bedroom":
			sid = "2"
		case "Kitchen":
			sid = "3"
		default:
			sid = "0"
		}
	}

	return TelemetryPayload{
		Value:      v,
		Unit:       "°C",
		Timestamp:  time.Now(),
		Location:   loc,
		Status:     "active",
		SensorID:   sid,
		SensorType: "temperature",
	}
}
