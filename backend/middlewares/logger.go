package middlewares

import (
	"log/slog"
	"net/http"
	"os"
	"runtime/debug"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// HTTPLoggerMiddleware emite un único log estructurado en JSON por cada petición HTTP,
// mapeando los atributos al estándar semántico de DataDog.
func HTTPLoggerMiddleware() gin.HandlerFunc {
	slowThresholdMs := 1000.0 // Valor por defecto: 1000ms
	if envThreshold := os.Getenv("SLOW_REQUEST_THRESHOLD_MS"); envThreshold != "" {
		if val, err := strconv.ParseFloat(envThreshold, 64); err == nil && val > 0 {
			slowThresholdMs = val
		}
	}

	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		rawQuery := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		durationMs := float64(latency.Microseconds()) / 1000.0
		statusCode := c.Writer.Status()
		clientIP := c.ClientIP()
		method := c.Request.Method
		userAgent := c.Request.UserAgent()
		dataSize := c.Writer.Size()

		fullPath := path
		if rawQuery != "" {
			fullPath = path + "?" + rawQuery
		}

		isSlow := durationMs > slowThresholdMs

		attrs := []slog.Attr{
			slog.Group("http",
				slog.String("method", method),
				slog.String("url", fullPath),
				slog.Int("status_code", statusCode),
				slog.String("useragent", userAgent),
				slog.Int("response_bytes", dataSize),
			),
			slog.Group("network",
				slog.String("client_ip", clientIP),
			),
			slog.Float64("duration_ms", durationMs),
		}

		if isSlow {
			attrs = append(attrs, slog.Bool("slow_request", true))
		}

		// Si la petición fue autenticada, incluir el user_id para trazabilidad
		if userID, exists := c.Get("user_id"); exists {
			if idStr, ok := userID.(string); ok && idStr != "" {
				attrs = append(attrs, slog.String("user_id", idStr))
			}
		}

		// Si ocurrieron errores registrados por Gin (c.Error)
		if len(c.Errors) > 0 {
			attrs = append(attrs, slog.String("error", c.Errors.String()))
		}

		// Determinar severidad según el código de estado HTTP y tiempo de respuesta
		switch {
		case statusCode >= 500:
			slog.LogAttrs(c.Request.Context(), slog.LevelError, "HTTP Request Error", attrs...)
		case statusCode >= 400:
			slog.LogAttrs(c.Request.Context(), slog.LevelWarn, "HTTP Request Warning", attrs...)
		case isSlow:
			slog.LogAttrs(c.Request.Context(), slog.LevelWarn, "HTTP Request (Slow)", attrs...)
		default:
			slog.LogAttrs(c.Request.Context(), slog.LevelInfo, "HTTP Request", attrs...)
		}
	}
}

// RecoveryMiddleware captura cualquier panic no manejado, emite un log estructurado con el stack trace y retorna 500.
func RecoveryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				stack := string(debug.Stack())
				slog.Error("Panic recuperado en petición HTTP",
					slog.Any("error", err),
					slog.String("stack", stack),
					slog.String("path", c.Request.URL.Path),
					slog.String("method", c.Request.Method),
					slog.String("client_ip", c.ClientIP()),
				)
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error": "Error interno del servidor",
				})
			}
		}()
		c.Next()
	}
}

