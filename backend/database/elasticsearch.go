package database

import (
	"log"
	"os"

	"github.com/elastic/go-elasticsearch/v8"
)

// NewElasticsearchClient inicializa y retorna el cliente de ES
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

	// Hacemos un ping de prueba para confirmar que el contenedor responde
	res, err := es.Info()
	if err != nil {
		log.Fatalf("Error al conectar con Elasticsearch: %s", err)
	}
	defer res.Body.Close()

	log.Println(" Conectado a Elasticsearch exitosamente!")

	return es
}
