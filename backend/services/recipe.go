package services

import (
	"burned/backend/dtos"
	"burned/backend/repositories"
	"errors"
	"time"

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
}

func NewRecipeService(repo repositories.RecipeRepositoryInterface, userRepo repositories.UserRepositoryInterface) *RecipeService {
	return &RecipeService{recipeRepo: repo, userRepo: userRepo}
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
	insertedOid, ok := insertedRecipe.InsertedID.(primitive.ObjectID)
	if !ok {
		return dtos.RecipeResponse{}, errors.New("invalid id")
	}
	recipeModel.ID = insertedOid
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
	if result.DeletedCount == 0 {
		return errors.New("recipe not found")
	}
	return err
}

func (service *RecipeService) GetRecipes(filters dtos.RecipeSearchRequest) ([]dtos.RecipeResponse, error) {
	result, err := service.recipeRepo.GetRecipes(filters)
	if err != nil {
		return []dtos.RecipeResponse{}, errors.New("recipes not found")
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
	return response, nil

}
func (service *RecipeService) GetRecipesByUser(id string) ([]dtos.RecipeResponse, error) {
	oid, ok := primitive.ObjectIDFromHex(id)
	if ok != nil {
		return []dtos.RecipeResponse{}, errors.New("invalid id")
	}
	result, err := service.recipeRepo.GetRecipesByUser(oid)
	if err != nil {
		return []dtos.RecipeResponse{}, errors.New("recipes not found")
	}
	var recipes []dtos.RecipeResponse
	for _, recipe := range result {
		recipes = append(recipes, dtos.RecipeModelToResponse(recipe))
	}
	return recipes, nil
}

func (service *RecipeService) GetAll() ([]dtos.RecipeResponse, error) {
	// Aquí podrías agregar lógica extra si fuera necesario antes de llamar a la DB
	result, err := service.recipeRepo.GetAll()
	if err != nil {
		return []dtos.RecipeResponse{}, errors.New("recipes not found")
	}
	var recipes []dtos.RecipeResponse
	for _, recipe := range result {
		recipes = append(recipes, dtos.RecipeModelToResponse(recipe))
	}
	return recipes, nil
}

func (service *RecipeService) GetTopRecipes() ([]dtos.RecipeResponse, error) {
	// Pedimos solo las 5 mejores
	result, err := service.recipeRepo.GetTopRecipesLimit(5)
	if err != nil {
		return []dtos.RecipeResponse{}, errors.New("recipes not found")
	}

	var recipes []dtos.RecipeResponse
	for _, recipe := range result {
		recipes = append(recipes, dtos.RecipeModelToResponse(recipe))
	}
	return recipes, nil
}
