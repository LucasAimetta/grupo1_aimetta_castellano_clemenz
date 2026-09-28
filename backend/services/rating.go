package services

import (
	"burned/backend/dtos"
	"burned/backend/models"
	"burned/backend/repositories"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RatingServiceInterface interface {
	RateRecipe(dto dtos.RateRecipeRequest, recipeId string, userId string) (dtos.RateRecipeResponse, error)
	GetRatingByUserAndRecipe(userId string, recipeId string) dtos.RateRecipeResponse
	GetRatingByRecipe(recipeId string) (dtos.Avg, error)
}
type RatingService struct {
	ratingRepository repositories.RatingRepositoryInterface
	recipeRepository repositories.RecipeRepositoryInterface
}

func NewRatingService(repository repositories.RatingRepositoryInterface, recipeRepository repositories.RecipeRepositoryInterface) *RatingService {
	return &RatingService{ratingRepository: repository,
		recipeRepository: recipeRepository,
	}
}
func (service *RatingService) RateRecipe(dto dtos.RateRecipeRequest, recipeId string, userId string) (dtos.RateRecipeResponse, error) {
	recipeOID, err := primitive.ObjectIDFromHex(recipeId)
	if err != nil {
		return dtos.RateRecipeResponse{}, errors.New("Invalid Recipe Id")
	}
	userOID, err := primitive.ObjectIDFromHex(userId)
	if err != nil {
		return dtos.RateRecipeResponse{}, errors.New("Invalid User Id")
	}

	model := dtos.RatingRequestToModel(dto)
	model.UserID = userOID
	model.RecipeID = recipeOID
	model.CreatedAt = time.Now()
	//Si no esta creado no lo setea en repository
	model.UpdatedAt = time.Now()

	_, err = service.ratingRepository.UpsertRating(model)
	if err != nil {
		return dtos.RateRecipeResponse{}, errors.New("Internal server error")
	}

	result, err := service.ratingRepository.GetRatingByUserAndRecipe(models.Rating{UserID: userOID, RecipeID: recipeOID})
	if err != nil {
		return dtos.RateRecipeResponse{}, errors.New("Internal server error")
	}
	recipe, err := service.recipeRepository.GetRecipeById(recipeOID)
	if err != nil {
		return dtos.RateRecipeResponse{}, errors.New("Recipe not found")
	}
	avg, err := service.ratingRepository.GetRatingByRecipe(recipeOID)
	if err != nil {
		return dtos.RateRecipeResponse{}, errors.New("Internal server error")
	}
	recipe.AverageRating = avg.Avg
	_, err = service.recipeRepository.UpdateRecipe(recipe)
	if err != nil {
		return dtos.RateRecipeResponse{}, errors.New("Internal server error")
	}
	response := dtos.RatingModelToResponse(result)
	return response, nil
}

func (service *RatingService) GetRatingByUserAndRecipe(userId string, recipeId string) dtos.RateRecipeResponse {
	recipeOID, err := primitive.ObjectIDFromHex(recipeId)
	if err != nil {
		return dtos.RateRecipeResponse{}
	}
	userOID, err := primitive.ObjectIDFromHex(userId)
	if err != nil {
		return dtos.RateRecipeResponse{}
	}
	var model models.Rating
	model.UserID = userOID
	model.RecipeID = recipeOID
	result, err := service.ratingRepository.GetRatingByUserAndRecipe(model)
	if err != nil {
		return dtos.RateRecipeResponse{}
	}
	return dtos.RatingModelToResponse(result)
}

func (service *RatingService) GetRatingByRecipe(recipeId string) (dtos.Avg, error) {
	recipeOID, err := primitive.ObjectIDFromHex(recipeId)
	if err != nil {
		return dtos.Avg{}, errors.New("Invalid Recipe ID")
	}
	result, err := service.ratingRepository.GetRatingByRecipe(recipeOID)
	if err != nil {
		return dtos.Avg{}, errors.New("Internal server error")
	}
	return result, nil
}
