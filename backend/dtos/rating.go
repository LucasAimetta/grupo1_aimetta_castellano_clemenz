package dtos

import (
	"burned/backend/models"
	"time"
)

type RateRecipeRequest struct {
	Stars float64 `json:"stars" binding:"required,gte=1,lte=5"`
}

type RateRecipeResponse struct {
	RecipeID  string    `json:"recipeId"`
	Stars     float64   `json:"stars" binding:"required,gte=1,lte=5"`
	ID        string    `json:"Id"`
	UserID    string    `json:"userId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
type Avg struct {
	Avg float64 `bson:"avg"`
}

func RatingRequestToModel(dto RateRecipeRequest) models.Rating {
	var model models.Rating
	model.Stars = dto.Stars
	return model
}

func RatingModelToResponse(model models.Rating) RateRecipeResponse {
	var response RateRecipeResponse
	response.CreatedAt = model.CreatedAt
	response.UpdatedAt = model.UpdatedAt
	response.RecipeID = model.RecipeID.Hex()
	response.Stars = model.Stars
	response.UserID = model.UserID.Hex()
	response.ID = model.ID.Hex()
	return response
}
