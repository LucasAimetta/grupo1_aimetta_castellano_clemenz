package repositories

import (
	"burned/backend/dtos"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type RecipeCacheRepositoryInterface interface {
	GetRecipe(ctx context.Context, id string) (*dtos.RecipeResponse, error)
	SetRecipe(ctx context.Context, id string, recipe dtos.RecipeResponse, ttl time.Duration) error
	DeleteRecipe(ctx context.Context, id string) error

	GetUserRecipes(ctx context.Context, userID string) ([]dtos.RecipeResponse, error)
	SetUserRecipes(ctx context.Context, userID string, recipes []dtos.RecipeResponse, ttl time.Duration) error
	DeleteUserRecipes(ctx context.Context, userID string) error

	GetTopRecipes(ctx context.Context) ([]dtos.RecipeResponse, error)
	SetTopRecipes(ctx context.Context, recipes []dtos.RecipeResponse, ttl time.Duration) error
	DeleteTopRecipes(ctx context.Context) error

	GetAllRecipes(ctx context.Context) ([]dtos.RecipeResponse, error)
	SetAllRecipes(ctx context.Context, recipes []dtos.RecipeResponse, ttl time.Duration) error
	DeleteAllRecipes(ctx context.Context) error
}

type RecipeCacheRepository struct {
	client *redis.Client
}

func NewRecipeCacheRepository(client *redis.Client) *RecipeCacheRepository {
	return &RecipeCacheRepository{client: client}
}

// --- RECETA PUNTUAL: recipe:{id} ---

func (r *RecipeCacheRepository) GetRecipe(ctx context.Context, id string) (*dtos.RecipeResponse, error) {
	key := fmt.Sprintf("recipe:%s", id)
	data, err := r.client.Get(ctx, key).Bytes()
	if err != nil {
		return nil, err
	}

	var recipe dtos.RecipeResponse
	if err := json.Unmarshal(data, &recipe); err != nil {
		return nil, err
	}
	return &recipe, nil
}

func (r *RecipeCacheRepository) SetRecipe(ctx context.Context, id string, recipe dtos.RecipeResponse, ttl time.Duration) error {
	data, err := json.Marshal(recipe)
	if err != nil {
		return err
	}
	key := fmt.Sprintf("recipe:%s", id)
	return r.client.Set(ctx, key, data, ttl).Err()
}

func (r *RecipeCacheRepository) DeleteRecipe(ctx context.Context, id string) error {
	key := fmt.Sprintf("recipe:%s", id)
	return r.client.Del(ctx, key).Err()
}

// --- RECETAS POR USUARIO: recipes:user:{userId} ---

func (r *RecipeCacheRepository) GetUserRecipes(ctx context.Context, userID string) ([]dtos.RecipeResponse, error) {
	key := fmt.Sprintf("recipes:user:%s", userID)
	data, err := r.client.Get(ctx, key).Bytes()
	if err != nil {
		return nil, err
	}

	var recipes []dtos.RecipeResponse
	if err := json.Unmarshal(data, &recipes); err != nil {
		return nil, err
	}
	return recipes, nil
}

func (r *RecipeCacheRepository) SetUserRecipes(ctx context.Context, userID string, recipes []dtos.RecipeResponse, ttl time.Duration) error {
	data, err := json.Marshal(recipes)
	if err != nil {
		return err
	}
	key := fmt.Sprintf("recipes:user:%s", userID)
	return r.client.Set(ctx, key, data, ttl).Err()
}

func (r *RecipeCacheRepository) DeleteUserRecipes(ctx context.Context, userID string) error {
	key := fmt.Sprintf("recipes:user:%s", userID)
	return r.client.Del(ctx, key).Err()
}

// --- TOP RECETAS: recipes:top ---

func (r *RecipeCacheRepository) GetTopRecipes(ctx context.Context) ([]dtos.RecipeResponse, error) {
	key := "recipes:top"
	data, err := r.client.Get(ctx, key).Bytes()
	if err != nil {
		return nil, err
	}

	var recipes []dtos.RecipeResponse
	if err := json.Unmarshal(data, &recipes); err != nil {
		return nil, err
	}
	return recipes, nil
}

func (r *RecipeCacheRepository) SetTopRecipes(ctx context.Context, recipes []dtos.RecipeResponse, ttl time.Duration) error {
	data, err := json.Marshal(recipes)
	if err != nil {
		return err
	}
	return r.client.Set(ctx, "recipes:top", data, ttl).Err()
}

func (r *RecipeCacheRepository) DeleteTopRecipes(ctx context.Context) error {
	return r.client.Del(ctx, "recipes:top").Err()
}

// --- TODAS LAS RECETAS: recipes:all ---

func (r *RecipeCacheRepository) GetAllRecipes(ctx context.Context) ([]dtos.RecipeResponse, error) {
	key := "recipes:all"
	data, err := r.client.Get(ctx, key).Bytes()
	if err != nil {
		return nil, err
	}

	var recipes []dtos.RecipeResponse
	if err := json.Unmarshal(data, &recipes); err != nil {
		return nil, err
	}
	return recipes, nil
}

func (r *RecipeCacheRepository) SetAllRecipes(ctx context.Context, recipes []dtos.RecipeResponse, ttl time.Duration) error {
	data, err := json.Marshal(recipes)
	if err != nil {
		return err
	}
	return r.client.Set(ctx, "recipes:all", data, ttl).Err()
}

func (r *RecipeCacheRepository) DeleteAllRecipes(ctx context.Context) error {
	return r.client.Del(ctx, "recipes:all").Err()
}

