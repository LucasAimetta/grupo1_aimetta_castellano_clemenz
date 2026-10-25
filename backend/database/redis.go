package database

import (
	"context"
	"log/slog"
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
			slog.Error("Error analizando REDIS_URL", slog.Any("error", err))
			os.Exit(1)
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
	slog.Debug("Intentando conectar con Redis", slog.String("addr", redisAddr))

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		err := client.Ping(ctx).Err()
		cancel()

		if err == nil {
			slog.Info("Conexión a Redis exitosa")
			return client
		}

		slog.Warn("Esperando que Redis esté listo", slog.Int("attempt", attempt), slog.Int("max_attempts", maxAttempts), slog.Any("error", err))
		time.Sleep(2 * time.Second)
	}

	slog.Error("Error fatal al conectar a Redis tras superar intentos máximos", slog.String("addr", redisAddr), slog.Int("max_attempts", maxAttempts))
	os.Exit(1)
	return nil
}

