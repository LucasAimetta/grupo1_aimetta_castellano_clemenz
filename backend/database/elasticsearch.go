package database

import (
	"fmt"
	"log/slog"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/elastic/go-elasticsearch/v8"
)

// NewElasticsearchClient inicializa y retorna el cliente de ES con reintentos
func NewElasticsearchClient() *elasticsearch.Client {
	// Leemos la variable de entorno que configuramos en Docker o Doppler
	elasticURL := os.Getenv("ELASTIC_URL")
	if elasticURL == "" {
		// Fallback por si lo corren local sin Docker
		elasticURL = "http://localhost:9200"
	}

	cfg := elasticsearch.Config{}

	parsedURL, err := url.Parse(elasticURL)
	if err == nil && parsedURL.User != nil {
		cfg.Username = parsedURL.User.Username()
		cfg.Password, _ = parsedURL.User.Password()
		parsedURL.User = nil
		cfg.Addresses = []string{parsedURL.String()}
	} else {
		cfg.Addresses = []string{elasticURL}
	}

	if user := os.Getenv("ELASTIC_USERNAME"); user != "" {
		cfg.Username = user
	}
	if pass := os.Getenv("ELASTIC_PASSWORD"); pass != "" {
		cfg.Password = pass
	}
	if apiKey := os.Getenv("ELASTIC_API_KEY"); apiKey != "" {
		cfg.APIKey = apiKey
	}

	es, err := elasticsearch.NewClient(cfg)
	if err != nil {
		slog.Error("Error creando el cliente de Elasticsearch", slog.Any("error", err))
		os.Exit(1)
	}

	// Elasticsearch puede tardar unos segundos en inicializar en Docker.
	// Intentamos conectar varias veces antes de fallar.
	maxAttempts := 15
	connected := false

	slog.Debug("Intentando conectar con Elasticsearch", slog.String("url", elasticURL))
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		res, err := es.Info()
		if err == nil && !res.IsError() {
			res.Body.Close()
			connected = true
			slog.Info("Conexión a Elasticsearch exitosa")
			break
		}

		if res != nil {
			res.Body.Close()
		}

		slog.Warn("Esperando que Elasticsearch esté listo", slog.Int("attempt", attempt), slog.Int("max_attempts", maxAttempts))
		time.Sleep(2 * time.Second)
	}

	if !connected {
		slog.Error("No se pudo conectar a Elasticsearch tras superar intentos máximos", slog.String("url", elasticURL), slog.Int("max_attempts", maxAttempts))
		os.Exit(1)
	}

	// Aseguramos que el índice 'recipes' exista con el mapeo requerido
	if err := InitRecipesIndex(es); err != nil {
		slog.Error("Error al inicializar el índice recipes en Elasticsearch", slog.Any("error", err))
		os.Exit(1)
	}

	return es
}

// InitRecipesIndex verifica si el índice 'recipes' existe y lo crea con el mapeo adecuado si no existe.
func InitRecipesIndex(es *elasticsearch.Client) error {
	res, err := es.Indices.Exists([]string{"recipes"})
	if err != nil {
		return fmt.Errorf("error verificando existencia del índice recipes: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode == 200 {
		slog.Debug("Índice 'recipes' ya existe en Elasticsearch")
		return nil
	}

	mapping := `{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "userId": { "type": "keyword" },
      "title": {
        "type": "text",
        "analyzer": "spanish",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "description": {
        "type": "text",
        "analyzer": "spanish"
      },
      "visibility": { "type": "keyword" },
      "totalTime": { "type": "integer" },
      "dificultyLevel": { "type": "keyword" },
      "tags": { "type": "keyword" },
      "ingredients": {
        "properties": {
          "name": { "type": "text", "analyzer": "spanish" },
          "quantity": { "type": "float" }
        }
      },
      "image": { "type": "keyword", "index": false },
      "averageRating": { "type": "float" },
      "createdAt": { "type": "date" }
    }
  }
}`

	createRes, err := es.Indices.Create(
		"recipes",
		es.Indices.Create.WithBody(strings.NewReader(mapping)),
	)
	if err != nil {
		return fmt.Errorf("error creando el índice recipes: %w", err)
	}
	defer createRes.Body.Close()

	if createRes.IsError() {
		return fmt.Errorf("error en respuesta de creación del índice recipes: %s", createRes.String())
	}

	slog.Info("Índice 'recipes' creado exitosamente con mapeo en español")
	return nil
}


