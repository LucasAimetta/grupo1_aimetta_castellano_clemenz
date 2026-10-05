package repositories

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"burned/backend/dtos"
	"burned/backend/models"

	"github.com/elastic/go-elasticsearch/v8"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RecipeSearchRepositoryInterface interface {
	IndexRecipe(ctx context.Context, recipe models.Recipe) error
	DeleteRecipe(ctx context.Context, id string) error
	SearchRecipes(ctx context.Context, filters dtos.RecipeSearchRequest) ([]models.Recipe, error)
}

type RecipeSearchRepository struct {
	es *elasticsearch.Client
}

func NewRecipeSearchRepository(es *elasticsearch.Client) *RecipeSearchRepository {
	return &RecipeSearchRepository{es: es}
}

// IndexRecipe inserta o actualiza una receta en el índice 'recipes' de Elasticsearch
func (r *RecipeSearchRepository) IndexRecipe(ctx context.Context, recipe models.Recipe) error {
	data, err := json.Marshal(recipe)
	if err != nil {
		return fmt.Errorf("error serializando receta para Elasticsearch: %w", err)
	}

	docID := recipe.ID.Hex()
	res, err := r.es.Index(
		"recipes",
		bytes.NewReader(data),
		r.es.Index.WithDocumentID(docID),
		r.es.Index.WithContext(ctx),
		r.es.Index.WithRefresh("true"),
	)
	if err != nil {
		return fmt.Errorf("error indexando receta en Elasticsearch: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		return fmt.Errorf("error en respuesta de Elasticsearch al indexar: %s", res.String())
	}

	return nil
}

// DeleteRecipe elimina una receta del índice 'recipes' en Elasticsearch
func (r *RecipeSearchRepository) DeleteRecipe(ctx context.Context, id string) error {
	res, err := r.es.Delete(
		"recipes",
		id,
		r.es.Delete.WithContext(ctx),
		r.es.Delete.WithRefresh("true"),
	)
	if err != nil {
		return fmt.Errorf("error eliminando receta de Elasticsearch: %w", err)
	}
	defer res.Body.Close()

	// Si no existe (404), no lo consideramos error crítico
	if res.IsError() && res.StatusCode != 404 {
		return fmt.Errorf("error en respuesta de Elasticsearch al eliminar: %s", res.String())
	}

	return nil
}

// SearchRecipes realiza una búsqueda avanzada utilizando queries booleanas, fuzzy y filtros exactos
func (r *RecipeSearchRepository) SearchRecipes(ctx context.Context, filters dtos.RecipeSearchRequest) ([]models.Recipe, error) {
	var mustClauses []map[string]interface{}
	var filterClauses []map[string]interface{}

	// Búsqueda por texto (Título, ingredientes, descripción) con tolerancia a errores (fuzziness)
	if filters.Title != "" {
		mustClauses = append(mustClauses, map[string]interface{}{
			"multi_match": map[string]interface{}{
				"query":     filters.Title,
				"fields":    []string{"title^3", "description", "ingredients.name^2"},
				"fuzziness": "AUTO",
			},
		})
	}

	if filters.Description != "" {
		mustClauses = append(mustClauses, map[string]interface{}{
			"match": map[string]interface{}{
				"description": map[string]interface{}{
					"query":     filters.Description,
					"fuzziness": "AUTO",
				},
			},
		})
	}

	// Filtros de visibilidad (por defecto solo recetas públicas)
	vis := "public"
	if filters.Visibility != "" {
		vis = filters.Visibility
	}
	filterClauses = append(filterClauses, map[string]interface{}{
		"term": map[string]interface{}{"visibility": vis},
	})

	// Filtro por dificultad
	if filters.DificultyLevel != "" {
		filterClauses = append(filterClauses, map[string]interface{}{
			"term": map[string]interface{}{"dificultyLevel": filters.DificultyLevel},
		})
	}

	// Filtro por tiempo máximo de preparación
	if filters.TotalTime > 0 {
		filterClauses = append(filterClauses, map[string]interface{}{
			"range": map[string]interface{}{
				"totalTime": map[string]interface{}{"lte": filters.TotalTime},
			},
		})
	}

	// Filtro por etiquetas (tags)
	for _, tag := range filters.Tags {
		trimmedTag := strings.TrimSpace(tag)
		if trimmedTag != "" {
			filterClauses = append(filterClauses, map[string]interface{}{
				"term": map[string]interface{}{"tags": trimmedTag},
			})
		}
	}

	boolQuery := map[string]interface{}{}
	if len(mustClauses) > 0 {
		boolQuery["must"] = mustClauses
	} else {
		boolQuery["must"] = map[string]interface{}{"match_all": map[string]interface{}{}}
	}

	if len(filterClauses) > 0 {
		boolQuery["filter"] = filterClauses
	}

	searchBody := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": boolQuery,
		},
		"size": 100,
	}

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(searchBody); err != nil {
		return nil, fmt.Errorf("error codificando consulta de búsqueda: %w", err)
	}

	res, err := r.es.Search(
		r.es.Search.WithContext(ctx),
		r.es.Search.WithIndex("recipes"),
		r.es.Search.WithBody(&buf),
		r.es.Search.WithTrackTotalHits(true),
	)
	if err != nil {
		return nil, fmt.Errorf("error ejecutando búsqueda en Elasticsearch: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		return nil, fmt.Errorf("error en respuesta de búsqueda de Elasticsearch: %s", res.String())
	}

	var esResponse struct {
		Hits struct {
			Hits []struct {
				ID     string        `json:"_id"`
				Source models.Recipe `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}

	if err := json.NewDecoder(res.Body).Decode(&esResponse); err != nil {
		return nil, fmt.Errorf("error decodificando respuesta de búsqueda: %w", err)
	}

	recipes := make([]models.Recipe, 0, len(esResponse.Hits.Hits))
	for _, hit := range esResponse.Hits.Hits {
		recipe := hit.Source
		if recipe.ID.IsZero() {
			if oid, err := primitive.ObjectIDFromHex(hit.ID); err == nil {
				recipe.ID = oid
			}
		}
		recipes = append(recipes, recipe)
	}

	return recipes, nil
}

