package logger

import (
	"log/slog"
	"os"
	"strings"
	"time"
)

// Init inicializa y establece el logger global basado en log/slog con formato JSON
// y nombres de atributos estándar para DataDog.
func Init() *slog.Logger {
	service := os.Getenv("DD_SERVICE")
	if service == "" {
		service = "burned-backend"
	}

	env := os.Getenv("DD_ENV")
	if env == "" {
		env = os.Getenv("ENV")
	}
	if env == "" {
		env = "development"
	}

	version := os.Getenv("DD_VERSION")
	if version == "" {
		version = "1.0.0"
	}

	levelStr := strings.ToUpper(os.Getenv("LOG_LEVEL"))
	var level slog.Level
	switch levelStr {
	case "DEBUG":
		level = slog.LevelDebug
	case "WARN", "WARNING":
		level = slog.LevelWarn
	case "ERROR":
		level = slog.LevelError
	default:
		level = slog.LevelInfo
	}

	// Mapeo de atributos al formato estándar de DataDog
	replaceAttr := func(groups []string, a slog.Attr) slog.Attr {
		switch a.Key {
		case slog.MessageKey:
			// DataDog busca "message" por defecto
			a.Key = "message"
		case slog.LevelKey:
			// DataDog usa "status" en minúsculas (info, warn, error, debug)
			a.Key = "status"
			if lvl, ok := a.Value.Any().(slog.Level); ok {
				switch lvl {
				case slog.LevelDebug:
					a.Value = slog.StringValue("debug")
				case slog.LevelInfo:
					a.Value = slog.StringValue("info")
				case slog.LevelWarn:
					a.Value = slog.StringValue("warn")
				case slog.LevelError:
					a.Value = slog.StringValue("error")
				}
			}
		case slog.TimeKey:
			// DataDog reconoce "timestamp" en formato ISO-8601
			a.Key = "timestamp"
			if t, ok := a.Value.Any().(time.Time); ok {
				a.Value = slog.StringValue(t.UTC().Format(time.RFC3339Nano))
			}
		}
		return a
	}

	opts := &slog.HandlerOptions{
		Level:       level,
		ReplaceAttr: replaceAttr,
	}

	baseHandler := slog.NewJSONHandler(os.Stdout, opts)

	// Inyectar etiquetas globales recomendadas por DataDog (Unified Service Tagging)
	l := slog.New(baseHandler).With(
		slog.String("service", service),
		slog.String("env", env),
		slog.String("version", version),
	)

	// Establecer como logger predeterminado para toda la aplicación
	slog.SetDefault(l)

	return l
}

