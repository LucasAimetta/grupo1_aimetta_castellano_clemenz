package database

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/elastic/go-elasticsearch/v8"
)

// NewElasticsearchClient inicializa y retorna el cliente de ES con reintentos
func NewElasticsearchClient() *elasticsearch.Client {
	// Leemos la variable de entorno que configuramos en Docker
	elasticURL := os.Getenv("ELASTIC_URL")
	if elasticURL == "" {
		// Fallback por si lo corren local sin Docker
		elasticURL = "http://localhost:9200"
	}

	cfg := elasticsearch.Config{
		Addresses: []string{
			elasticURL,
		},
	}

	es, err := elasticsearch.NewClient(cfg)
	if err != nil {
		log.Fatalf("Error creando el cliente de Elasticsearch: %s", err)
	}

	// Elasticsearch puede tardar unos segundos en inicializar en Docker.
	// Intentamos conectar varias veces antes de fallar.
	maxAttempts := 15
	connected := false

	log.Printf("Intentando conectar con Elasticsearch en %s...", elasticURL)
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		res, err := es.Info()
		if err == nil && !res.IsError() {
			res.Body.Close()
			connected = true
			log.Println(" Conectado a Elasticsearch exitosamente!")
			break
		}

		if res != nil {
			res.Body.Close()
		}

		log.Printf("Elasticsearch no está listo aún (intento %d/%d). Reintentando en 2 segundos...", attempt, maxAttempts)
		time.Sleep(2 * time.Second)
	}

	if !connected {
		log.Fatalf("Error: No se pudo conectar a Elasticsearch en %s tras %d intentos.", elasticURL, maxAttempts)
	}

	// Aseguramos que el índice 'recipes' exista con el mapeo requerido
	if err := InitRecipesIndex(es); err != nil {
		log.Fatalf("Error al inicializar el índice recipes: %s", err)
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
		log.Println(" Índice 'recipes' ya existe en Elasticsearch.")
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

	log.Println(" Índice 'recipes' creado exitosamente con mapeo en español.")
	return nil
}


