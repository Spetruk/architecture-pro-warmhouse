package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"smarthome/handlers"
	"smarthome/services"

	"github.com/gin-gonic/gin"
)

func main() {

	// Initialize router
	router := gin.Default()

	sensorServiceURL := os.Getenv("SENSOR_SERVICE_URL")
	if sensorServiceURL == "" {
		sensorServiceURL = "http://sensor-service:8083" // Значение по умолчанию
	}

	// Создаем сервис датчиков
	sensorService := services.NewSensorService(sensorServiceURL)

	// Инициализируем обработчик с сервисом датчиков
	sensorHandler := handlers.NewSensorHandler(sensorService)

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	// API routes
	apiRoutes := router.Group("/api/v1")
	sensorHandler.RegisterRoutes(apiRoutes)

	// Start server
	srv := &http.Server{
		Addr:    getEnv("PORT", ":8080"),
		Handler: router,
	}

	// Start the server in a goroutine
	go func() {
		log.Printf("Server starting on %s\n", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Create a deadline for server shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v\n", err)
	}

	log.Println("Server exited properly")
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
