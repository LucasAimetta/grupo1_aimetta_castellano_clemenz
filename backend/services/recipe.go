package services

import (
	"context"
	"errors"
	"os"
	"strconv"
	"time"

	"burned/backend/dtos"
	"burned/backend/models"
	"burned/backend/repositories"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RecipeServiceInterface interface {
	CreateRecipe(recipe dtos.RecipeRequest, idUser string) (dtos.RecipeResponse, error)
	UpdateRecipe(recipe dtos.RecipeRequest, id string, requesterId string, requesterRole string) (dtos.RecipeResponse, error)
	DeleteRecipe(id string, requesterId string, requesterRole string) error
	GetRecipes(filters dtos.RecipeSearchRequest) ([]dtos.RecipeResponse, error)
	GetRecipeById(id string) (dtos.RecipeResponse, error)
	GetRecipesByUser(id string) ([]dtos.RecipeResponse, error)
	GetAll() ([]dtos.RecipeResponse, error)
	GetTopRecipes() ([]dtos.RecipeResponse, error)
}

type RecipeService struct {
	recipeRepo repositories.RecipeRepositoryInterface
	userRepo   repositories.UserRepositoryInterface
	searchRepo repositories.RecipeSearchRepositoryInterface
	cacheRepo  repositories.RecipeCacheRepositoryInterface

	recipeTTL      time.Duration
	userRecipesTTL time.Duration
	topRecipesTTL  time.Duration
	allRecipesTTL  time.Duration
}

func parseTTLFromEnv(envVar string, defaultMinutes int) time.Duration {
	mins, err := strconv.Atoi(os.Getenv(envVar))
	if err != nil || mins <= 0 {
		mins = defaultMinutes
	}
	return time.Duration(mins) * time.Minute
}

func NewRecipeService(
	repo repositories.RecipeRepositoryInterface,
	userRepo repositories.UserRepositoryInterface,
	searchRepo repositories.RecipeSearchRepositoryInterface,
	cacheRepo repositories.RecipeCacheRepositoryInterface,
) *RecipeService {
	return &RecipeService{
		recipeRepo:     repo,
		userRepo:       userRepo,
		searchRepo:     searchRepo,
		cacheRepo:      cacheRepo,
		recipeTTL:      parseTTLFromEnv("CACHE_RECIPE_TTL_MINUTES", 30),
		userRecipesTTL: parseTTLFromEnv("CACHE_USER_RECIPES_TTL_MINUTES", 15),
		topRecipesTTL:  parseTTLFromEnv("CACHE_TOP_RECIPES_TTL_MINUTES", 5),
		allRecipesTTL:  parseTTLFromEnv("CACHE_ALL_RECIPES_TTL_MINUTES", 10),
	}
}

func (service *RecipeService) CreateRecipe(recipe dtos.RecipeRequest, idUser string) (dtos.RecipeResponse, error) {
	//Verifica validez de parametros
	if recipe.Description == "" || recipe.DificultyLevel == "" || recipe.Ingredients == nil || recipe.Step == nil || recipe.Title == "" || recipe.TotalTime <= 0 || recipe.Visibility == "" {
		return dtos.RecipeResponse{}, errors.New("data entered incorrectly")
	}
	oid, err := primitive.ObjectIDFromHex(idUser)
	if err != nil {
		return dtos.RecipeResponse{}, errors.New("invalid id")
	}
	user, err := service.userRepo.GetUserById(oid)
	if err != nil {
		return dtos.RecipeResponse{}, errors.New("user not found")
	}
	recipeModel := dtos.RecipeRequestToModel(recipe)
	recipeModel.CreatedAt = time.Now()
	recipeModel.UserID = oid
	//añade el id en la bdd al objeto para devolverlo al usuario
	insertedRecipe, err := service.recipeRepo.CreateRecipe(recipeModel)
	if err != nil {
		return dtos.RecipeResponse{}, err
	}
	insertedOid, ok := insertedRecipe.InsertedID.(primitive.ObjectID)
	if !ok {
		return dtos.RecipeResponse{}, errors.New("invalid id")
	}
	recipeModel.ID = insertedOid

	// Sincronizar indexación en Elasticsearch
	if service.searchRepo != nil {
		if err := service.searchRepo.IndexRecipe(context.Background(), recipeModel); err != nil {
			return dtos.RecipeResponse{}, err
		}
	}

	// Invalidar caché tras creación
	if service.cacheRepo != nil {
		_ = service.cacheRepo.DeleteUserRecipes(context.Background(), idUser)
		_ = service.cacheRepo.DeleteAllRecipes(context.Background())
	}

	recipeResponse := dtos.RecipeModelToResponse(recipeModel)
	recipeResponse.UserName = user.Name
	return recipeResponse, nil
}

func (service *RecipeService) UpdateRecipe(recipe dtos.RecipeRequest, id string, requesterId string, requesterRole string) (dtos.RecipeResponse, error) {
	if recipe.Description == "" || recipe.DificultyLevel == "" || recipe.Ingredients == nil || recipe.Step == nil || recipe.Title == "" || recipe.TotalTime <= 0 || recipe.Visibility == "" {
		return dtos.RecipeResponse{}, errors.New("data entered incorrectly")
	}
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return dtos.RecipeResponse{}, errors.New("invalid id")
	}
	currentRecipe, err := service.recipeRepo.GetRecipeById(oid)
	if err != nil {
		return dtos.RecipeResponse{}, errors.New("recipe not found")
	}

	isOwner := currentRecipe.UserID.Hex() == requesterId
	isAdmin := requesterRole == "admin"

	if !isOwner && !isAdmin {
		return dtos.RecipeResponse{}, errors.New("unauthorized: you cannot edit this recipe")
	}

	recipeModel := dtos.RecipeRequestToModel(recipe)
	recipeModel.ID = oid
	recipeModel.UpdatedAt = time.Now()

	recipeModel.UserID = currentRecipe.UserID
	recipeModel.CreatedAt = currentRecipe.CreatedAt
	recipeModel.AverageRating = currentRecipe.AverageRating
	recipeModel.Visibility = recipe.Visibility
	_, err = service.recipeRepo.UpdateRecipe(recipeModel)
	if err != nil {
		return dtos.RecipeResponse{}, err
	}

	// Sincronizar actualización en Elasticsearch
	if service.searchRepo != nil {
		if err := service.searchRepo.IndexRecipe(context.Background(), recipeModel); err != nil {
			return dtos.RecipeResponse{}, err
		}
	}

	// Invalidar caché tras actualización
	if service.cacheRepo != nil {
		_ = service.cacheRepo.DeleteRecipe(context.Background(), id)
		_ = service.cacheRepo.DeleteUserRecipes(context.Background(), currentRecipe.UserID.Hex())
		_ = service.cacheRepo.DeleteTopRecipes(context.Background())
		_ = service.cacheRepo.DeleteAllRecipes(context.Background())
	}

	recipeResponse := dtos.RecipeModelToResponse(recipeModel)
	return recipeResponse, nil
}

func (service *RecipeService) DeleteRecipe(id string, requesterId string, requesterRole string) error {
	oid, ok := primitive.ObjectIDFromHex(id)
	if ok != nil {
		return errors.New("invalid id")
	}
	currentRecipe, err := service.recipeRepo.GetRecipeById(oid)
	if err != nil {
		return errors.New("recipe not found")
	}

	isOwner := currentRecipe.UserID.Hex() == requesterId
	isAdmin := requesterRole == "admin"

	if !isOwner && !isAdmin {
		return errors.New("unauthorized: you cannot edit this recipe")
	}
	//verificamos la cantidad de documentos eliminados, si es 0 ha habido error
	result, err := service.recipeRepo.DeleteRecipe(oid)
	if err != nil {
		return err
	}
	if result.DeletedCount == 0 {
		return errors.New("recipe not found")
	}

	// Sincronizar eliminación en Elasticsearch
	if service.searchRepo != nil {
		if err := service.searchRepo.DeleteRecipe(context.Background(), id); err != nil {
			return err
		}
	}

	// Invalidar caché tras eliminación
	if service.cacheRepo != nil {
		_ = service.cacheRepo.DeleteRecipe(context.Background(), id)
		_ = service.cacheRepo.DeleteUserRecipes(context.Background(), currentRecipe.UserID.Hex())
		_ = service.cacheRepo.DeleteTopRecipes(context.Background())
		_ = service.cacheRepo.DeleteAllRecipes(context.Background())
	}
	return nil
}

func (service *RecipeService) GetRecipes(filters dtos.RecipeSearchRequest) ([]dtos.RecipeResponse, error) {
	var result []models.Recipe
	var err error

	// Intentamos buscar primero en Elasticsearch si el repositorio está disponible
	if service.searchRepo != nil {
		result, err = service.searchRepo.SearchRecipes(context.Background(), filters)
	}

	// Si Elasticsearch falla o no está disponible, usamos MongoDB como fallback de resiliencia
	if err != nil || service.searchRepo == nil {
		if err != nil {
			return []dtos.RecipeResponse{}, err
		}
		result, err = service.recipeRepo.GetRecipes(filters)
		if err != nil {
			return []dtos.RecipeResponse{}, errors.New("recipes not found")
		}
	}

	var recipes []dtos.RecipeResponse
	for _, recipe := range result {
		recipes = append(recipes, dtos.RecipeModelToResponse(recipe))
	}
	return recipes, nil
}

func (service *RecipeService) GetRecipeById(id string) (dtos.RecipeResponse, error) {
	oid, ok := primitive.ObjectIDFromHex(id)
	if ok != nil {
		return dtos.RecipeResponse{}, errors.New("invalid id")
	}

	// 1. Intentar obtener desde caché
	if service.cacheRepo != nil {
		if cached, err := service.cacheRepo.GetRecipe(context.Background(), id); err == nil && cached != nil {
			return *cached, nil
		}
	}

	// 2. Si no está en caché (o falló Redis), buscar en base de datos
	result, err := service.recipeRepo.GetRecipeById(oid)
	if err != nil {
		return dtos.RecipeResponse{}, err
	}
	response := dtos.RecipeModelToResponse(result)
	user, err := service.userRepo.GetUserById(result.UserID)
	if err == nil {
		response.UserName = user.Name
	} else {
		response.UserName = "Unknown"
	}

	// 3. Guardar en caché con TTL configurable
	if service.cacheRepo != nil {
		_ = service.cacheRepo.SetRecipe(context.Background(), id, response, service.recipeTTL)
	}

	return response, nil
}

func (service *RecipeService) GetRecipesByUser(id string) ([]dtos.RecipeResponse, error) {
	oid, ok := primitive.ObjectIDFromHex(id)
	if ok != nil {
		return []dtos.RecipeResponse{}, errors.New("invalid id")
	}

	// 1. Intentar obtener desde caché (aislado por usuario)
	if service.cacheRepo != nil {
		if cached, err := service.cacheRepo.GetUserRecipes(context.Background(), id); err == nil && cached != nil {
			return cached, nil
		}
	}

	// 2. Si no está en caché, consultar base de datos
	result, err := service.recipeRepo.GetRecipesByUser(oid)
	if err != nil {
		return []dtos.RecipeResponse{}, errors.New("recipes not found")
	}
	var recipes []dtos.RecipeResponse
	for _, recipe := range result {
		recipes = append(recipes, dtos.RecipeModelToResponse(recipe))
	}

	// 3. Guardar en caché con TTL configurable
	if service.cacheRepo != nil {
		_ = service.cacheRepo.SetUserRecipes(context.Background(), id, recipes, service.userRecipesTTL)
	}

	return recipes, nil
}

func (service *RecipeService) GetAll() ([]dtos.RecipeResponse, error) {
	// 1. Intentar obtener desde caché
	if service.cacheRepo != nil {
		if cached, err := service.cacheRepo.GetAllRecipes(context.Background()); err == nil && cached != nil {
			return cached, nil
		}
	}

	result, err := service.recipeRepo.GetAll()
	if err != nil {
		return []dtos.RecipeResponse{}, errors.New("recipes not found")
	}
	var recipes []dtos.RecipeResponse
	for _, recipe := range result {
		recipes = append(recipes, dtos.RecipeModelToResponse(recipe))
	}

	// 2. Guardar en caché con TTL configurable
	if service.cacheRepo != nil {
		_ = service.cacheRepo.SetAllRecipes(context.Background(), recipes, service.allRecipesTTL)
	}

	return recipes, nil
}

func (service *RecipeService) GetTopRecipes() ([]dtos.RecipeResponse, error) {
	// 1. Intentar obtener desde caché
	if service.cacheRepo != nil {
		if cached, err := service.cacheRepo.GetTopRecipes(context.Background()); err == nil && cached != nil {
			return cached, nil
		}
	}

	// Pedimos solo las 5 mejores
	result, err := service.recipeRepo.GetTopRecipesLimit(5)
	if err != nil {
		return []dtos.RecipeResponse{}, errors.New("recipes not found")
	}

	var recipes []dtos.RecipeResponse
	for _, recipe := range result {
		recipes = append(recipes, dtos.RecipeModelToResponse(recipe))
	}

	// 2. Guardar en caché con TTL configurable
	if service.cacheRepo != nil {
		_ = service.cacheRepo.SetTopRecipes(context.Background(), recipes, service.topRecipesTTL)
	}

	return recipes, nil
}
