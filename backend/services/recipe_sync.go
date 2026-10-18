package services

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"burned/backend/repositories"

	"github.com/robfig/cron/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RecipeSyncServiceInterface interface {
	SyncToElasticsearch(ctx context.Context) error
	StartCronJob(spec string) (*cron.Cron, error)
}

type RecipeSyncService struct {
	recipeRepo        repositories.RecipeRepositoryInterface
	searchRepo        repositories.RecipeSearchRepositoryInterface
	syncRepo          repositories.SyncRepositoryInterface
	deletedRecipeRepo repositories.DeletedRecipeRepositoryInterface
}

func NewRecipeSyncService(
	recipeRepo repositories.RecipeRepositoryInterface,
	searchRepo repositories.RecipeSearchRepositoryInterface,
	syncRepo repositories.SyncRepositoryInterface,
	deletedRecipeRepo repositories.DeletedRecipeRepositoryInterface,
) *RecipeSyncService {
	return &RecipeSyncService{
		recipeRepo:        recipeRepo,
		searchRepo:        searchRepo,
		syncRepo:          syncRepo,
		deletedRecipeRepo: deletedRecipeRepo,
	}
}

// SyncToElasticsearch ejecuta un ciclo de sincronización incremental hacia Elasticsearch
func (s *RecipeSyncService) SyncToElasticsearch(ctx context.Context) error {
	lastSync, err := s.syncRepo.GetLastSyncTime(ctx)
	if err != nil {
		log.Printf(" [Sync Cron] No se pudo leer lastSync de Redis: %v. Se sincronizará todo.", err)
	}

	syncStartTime := time.Now()

	// 1. Obtener recetas creadas o modificadas desde la última sincronización
	recipes, err := s.recipeRepo.GetRecipesUpdatedAfter(ctx, lastSync)
	if err != nil {
		return fmt.Errorf("error obteniendo recetas actualizadas de MongoDB: %w", err)
	}

	// 2. Indexar en lote en Elasticsearch si hay novedades
	if len(recipes) > 0 {
		if err := s.searchRepo.BulkIndexRecipes(ctx, recipes); err != nil {
			return fmt.Errorf("error indexando bulk en Elasticsearch: %w", err)
		}
		log.Printf(" [Sync Cron] Sincronizadas %d recetas en Elasticsearch (desde %v)", len(recipes), lastSync.Format(time.RFC3339))
	}

	// 3. Procesar eliminaciones pendientes desde MongoDB (donde process == false)
	if s.deletedRecipeRepo != nil {
		unprocessed, err := s.deletedRecipeRepo.GetUnprocessedDeletedRecipes(ctx)
		if err != nil {
			log.Printf(" [Sync Cron] Error consultando recetas eliminadas de MongoDB: %v", err)
		} else if len(unprocessed) > 0 {
			recipeIDs := make([]string, 0, len(unprocessed))
			docIDs := make([]primitive.ObjectID, 0, len(unprocessed))
			for _, item := range unprocessed {
				recipeIDs = append(recipeIDs, item.RecipeID)
				docIDs = append(docIDs, item.ID)
			}

			// Eliminar de Elasticsearch
			if err := s.searchRepo.BulkDeleteRecipes(ctx, recipeIDs); err != nil {
				log.Printf(" [Sync Cron] Error eliminando recetas de Elasticsearch: %v", err)
			} else {
				// Marcar en MongoDB como process = true
				if err := s.deletedRecipeRepo.MarkAsProcessed(ctx, docIDs); err != nil {
					log.Printf(" [Sync Cron] Error marcando recetas como procesadas en MongoDB: %v", err)
				} else {
					log.Printf(" [Sync Cron] Eliminadas %d recetas de Elasticsearch y marcadas como procesadas en MongoDB", len(recipeIDs))
				}
			}
		}
	}

	// 3.1 Limpieza residual de Redis si hubieran IDs anteriores
	if s.syncRepo != nil {
		deletedIDs, err := s.syncRepo.GetDeletedRecipeIDs(ctx)
		if err == nil && len(deletedIDs) > 0 {
			_ = s.searchRepo.BulkDeleteRecipes(ctx, deletedIDs)
			_ = s.syncRepo.ClearDeletedRecipeIDs(ctx, deletedIDs)
		}
	}

	// 4. Actualizar puntero en Redis con el timestamp de inicio de este ciclo
	if err := s.syncRepo.SetLastSyncTime(ctx, syncStartTime); err != nil {
		log.Printf(" [Sync Cron] Error actualizando timestamp en Redis: %v", err)
	}

	return nil
}

// StartCronJob inicia el scheduler en segundo plano con la expresión cron especificada
func (s *RecipeSyncService) StartCronJob(spec string) (*cron.Cron, error) {
	if spec == "" {
		spec = os.Getenv("RECIPE_SYNC_CRON")
	}
	if spec == "" {
		spec = "@every 1m" // Valor por defecto: cada 1 minuto
	}

	c := cron.New()
	_, err := c.AddFunc(spec, func() {
		ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
		defer cancel()

		if err := s.SyncToElasticsearch(ctx); err != nil {
			log.Printf(" [Sync Cron] Fallo en ciclo de sincronización: %v", err)
		}
	})
	if err != nil {
		return nil, fmt.Errorf("error configurando cron expression '%s': %w", spec, err)
	}

	c.Start()
	log.Printf(" [Sync Cron] Job periódico iniciado con frecuencia '%s'", spec)

	// Ejecutar una primera sincronización inicial en segundo plano al arrancar
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()
		if err := s.SyncToElasticsearch(ctx); err != nil {
			log.Printf(" [Sync Cron] Error en sincronización inicial: %v", err)
		}
	}()

	return c, nil
}

