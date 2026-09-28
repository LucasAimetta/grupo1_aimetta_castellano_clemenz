package services

import (
	"burned/backend/dtos"
	"burned/backend/models"
	"burned/backend/repositories"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SavedRecipeServiceInterface interface {
	SavedRecipe(saved dtos.SavedRecipeRequest, userId string) (dtos.SavedRecipeResponse, error)
	UnsavedRecipe(userId string, recipeId string) error
	GetRecipesSavedByUser(idUser string) ([]dtos.RecipeResponse, error)
	GetSavedCountByRecipe(idRecipe string) (int64, error)
	GetTop10MostSaved() ([]models.TopSavedRecipe, error)
}

type SavedRecipeService struct {
	repo       repositories.SavedRecipeRepositoryInterface
	recipeRepo repositories.RecipeRepositoryInterface
}

func NewSavedRecipeService(r repositories.SavedRecipeRepositoryInterface, recipeRepo repositories.RecipeRepositoryInterface) *SavedRecipeService {
	return &SavedRecipeService{repo: r, recipeRepo: recipeRepo}
}

func (service *SavedRecipeService) SavedRecipe(saved dtos.SavedRecipeRequest, userId string) (dtos.SavedRecipeResponse, error) {
	userOid, err := primitive.ObjectIDFromHex(userId)
	if err != nil {
		return dtos.SavedRecipeResponse{}, errors.New("invalid user ID")
	}
	recipeOid, err := primitive.ObjectIDFromHex(saved.RecipeID)
	if err != nil {
		return dtos.SavedRecipeResponse{}, errors.New("invalid recipe ID")
	}

	_, err = service.repo.GetSavedRecipesSavedByUserAndRecipe(userOid, recipeOid)
	if err != nil {
		return dtos.SavedRecipeResponse{}, errors.New("Already saved")

	}
	//una vez obtenidos los oids desde los string mandados por parametros, guardamos
	var model models.SavedRecipe
	model.CreatedAt = time.Now()
	model.UserID = userOid
	model.RecipeID = recipeOid

	result, err := service.repo.SavedRecipe(model)
	if err != nil {
		return dtos.SavedRecipeResponse{}, err
	}
	var response dtos.SavedRecipeResponse
	//obtenemos el id del objeto en la bdd para devolverselo al usuario
	insertedOid, ok := result.InsertedID.(primitive.ObjectID)
	if ok {
		response.RecipeID = insertedOid.Hex()
		response.SavedAt = model.CreatedAt
	}
	return response, nil
}

func (service *SavedRecipeService) UnsavedRecipe(userId string, recipeId string) error {
	userOid, err := primitive.ObjectIDFromHex(userId)
	if err != nil {
		return errors.New("invalid user ID")
	}
	recipeOid, err := primitive.ObjectIDFromHex(recipeId)
	if err != nil {
		return errors.New("invalid recipe ID")
	}
	result, err := service.repo.UnsavedRecipe(userOid, recipeOid)
	//verificamos la cantidad de elementos eliminados, si es 0 ha habido un error
	if result.DeletedCount == 0 {
		return errors.New("saved recipe not found")
	}
	return nil
}

func (service *SavedRecipeService) GetRecipesSavedByUser(idUser string) ([]dtos.RecipeResponse, error) {
	oid, err := primitive.ObjectIDFromHex(idUser)
	if err != nil {
		return []dtos.RecipeResponse{}, err
	}
	//convertimos el string en oid y obtenemos sus recetas guardadas
	models, err := service.repo.GetRecipesSavedByUser(oid)
	if err != nil {
		return []dtos.RecipeResponse{}, err
	}
	var savedRecipesResponses []dtos.RecipeResponse
	//convertimos los models obtenidos a objetos del tipo response para devolverselo al cliente
	for _, recipe := range models {
		savedRecipesResponse, err := service.recipeRepo.GetRecipeById(recipe.RecipeID)
		if err != nil {
			continue
		}
		savedRecipesResponses = append(savedRecipesResponses, dtos.RecipeModelToResponse(savedRecipesResponse))
	}
	return savedRecipesResponses, nil
}

func (service *SavedRecipeService) GetSavedCountByRecipe(idRecipe string) (int64, error) {
	oid, err := primitive.ObjectIDFromHex(idRecipe)
	if err != nil {
		return 0, err
	}
	//convertimos el string a oid y buscamos la cantidad de veces que se guardo la receta con ese id
	result, err := service.repo.GetSavedCountByRecipe(oid)
	if err != nil {
		return 0, err
	}
	return result, nil
}

func (service *SavedRecipeService) GetTop10MostSaved() ([]models.TopSavedRecipe, error) {
	result, err := service.repo.GetTop10MostSaved()
	if err != nil {
		return []models.TopSavedRecipe{}, err
	}
	return result, nil
}
