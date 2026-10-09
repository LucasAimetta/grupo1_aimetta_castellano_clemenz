package database

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// Inicializa y retorna el cliente de Redis con reintentos
func NewRedisClient() *redis.Client {
	redisAddr := os.Getenv("REDIS_URL")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	redisPassword := os.Getenv("REDIS_PASSWORD")

	var client *redis.Client
	if strings.HasPrefix(redisAddr, "redis://") || strings.HasPrefix(redisAddr, "rediss://") {
		opt, err := redis.ParseURL(redisAddr)
		if err != nil {
			log.Fatalf("Error analizando REDIS_URL: %v", err)
		}
		if redisPassword != "" {
			opt.Password = redisPassword
		}
		client = redis.NewClient(opt)
	} else {
		client = redis.NewClient(&redis.Options{
			Addr:     redisAddr,
			Password: redisPassword,
			DB:       0,
		})
	}

	maxAttempts := 15
	log.Printf("Intentando conectar con Redis en %s...", redisAddr)

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		err := client.Ping(ctx).Err()
		cancel()

		if err == nil {
			log.Println("Conectado a Redis exitosamente")
			return client
		}

		log.Printf("Esperando que Redis esté listo (intento %d/%d): %v", attempt, maxAttempts, err)
		time.Sleep(2 * time.Second)
	}

	log.Fatalf("Error FATAL al conectar a Redis en %s", redisAddr)
	return nil
}

