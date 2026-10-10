package repositories

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	RedisKeyLastRecipesSync  = "sync:elasticsearch:last_recipes_sync"
	RedisKeyDeletedRecipeIDs = "sync:elasticsearch:deleted_recipe_ids"
)

type SyncRepositoryInterface interface {
	GetLastSyncTime(ctx context.Context) (time.Time, error)
	SetLastSyncTime(ctx context.Context, t time.Time) error
	AddDeletedRecipeID(ctx context.Context, id string) error
	GetDeletedRecipeIDs(ctx context.Context) ([]string, error)
	ClearDeletedRecipeIDs(ctx context.Context, ids []string) error
}

type SyncRepository struct {
	client *redis.Client
}

func NewSyncRepository(client *redis.Client) *SyncRepository {
	return &SyncRepository{client: client}
}

// GetLastSyncTime retorna el timestamp de la última sincronización guardado en Redis
func (r *SyncRepository) GetLastSyncTime(ctx context.Context) (time.Time, error) {
	val, err := r.client.Get(ctx, RedisKeyLastRecipesSync).Result()
	if err == redis.Nil {
		// Primera vez: nunca se ha sincronizado
		return time.Time{}, nil
	}
	if err != nil {
		return time.Time{}, err
	}
	//constante de texto (string) que define un formato estándar para leer o escribir fechas y horas
	return time.Parse(time.RFC3339, val)
}

// SetLastSyncTime guarda la fecha y hora de la sincronización actual en Redis
func (r *SyncRepository) SetLastSyncTime(ctx context.Context, t time.Time) error {
	return r.client.Set(ctx, RedisKeyLastRecipesSync, t.Format(time.RFC3339), 0).Err()
}

// AddDeletedRecipeID encola un ID de receta eliminada para borrarlo de Elasticsearch en el próximo ciclo
func (r *SyncRepository) AddDeletedRecipeID(ctx context.Context, id string) error {
	return r.client.SAdd(ctx, RedisKeyDeletedRecipeIDs, id).Err()
}

// GetDeletedRecipeIDs obtiene todos los IDs de recetas eliminadas pendientes de sincronizar
func (r *SyncRepository) GetDeletedRecipeIDs(ctx context.Context) ([]string, error) {
	return r.client.SMembers(ctx, RedisKeyDeletedRecipeIDs).Result()
}

// ClearDeletedRecipeIDs remueve los IDs sincronizados del Set de Redis
func (r *SyncRepository) ClearDeletedRecipeIDs(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		args[i] = id
	}
	return r.client.SRem(ctx, RedisKeyDeletedRecipeIDs, args...).Err()
}

