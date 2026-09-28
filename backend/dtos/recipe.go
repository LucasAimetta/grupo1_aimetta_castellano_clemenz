package dtos

import (
	"burned/backend/models"
	"time"
)

type RecipeRequest struct {
	Title          string              `json:"title" binding:"required,min=3,max=120"`
	Description    string              `json:"description" binding:"required,min=3,max=350"`
	Visibility     string              `json:"visibility" binding:"required,oneof=public private"`
	TotalTime      int                 `json:"totalTime" binding:"required,gte=0,lte=100000"`
	Step           []models.Step       `json:"step" binding:"required,min=1,dive"`
	DificultyLevel string              `json:"dificultyLevel" binding:"required,oneof=easy medium hard"`
	Tags           []string            `json:"tags" binding:"omitempty,max=20,dive,min=1,max=30"`
	Ingredients    []models.Ingredient `json:"ingredients" binding:"required,min=1,dive"`
	Image          string              `json:"image" binding:"omitempty,max=2000"` // URL (por ahora)
}

type RecipeResponse struct {
	Title          string              `json:"title" binding:"required,min=3,max=120"`
	Description    string              `json:"description" binding:"required,min=3,max=350"`
	Visibility     string              `json:"visibility" binding:"required,oneof=public private"`
	TotalTime      int                 `json:"totalTime" binding:"required,gte=0,lte=100000"`
	Step           []models.Step       `json:"step" binding:"required,min=1,dive"`
	DificultyLevel string              `json:"dificultyLevel" binding:"required,oneof=easy medium hard"`
	Tags           []string            `json:"tags" binding:"omitempty,max=20,dive,min=1,max=30"`
	Ingredients    []models.Ingredient `json:"ingredients" binding:"required,min=1,dive"`
	Image          string              `json:"image" binding:"omitempty,max=2000"` // URL (por ahora)
	CreatedAt      time.Time           `json:"createdAt"`
	UpdatedAt      time.Time           `json:"updatedAt"`
	ID             string              `json:"id"`
	UserName       string              `json:"userName"`
	UserID         string              `json:"userId"`
	AverageRating  float64             `json:"averageRating"`
}

type RecipeSearchRequest struct {
	Title          string   `json:"title" binding:"omitempty,max=120"`
	Description    string   `json:"description" binding:"omitempty,max=350"`
	Visibility     string   `json:"visibility" binding:"omitempty,oneof=public private"`
	TotalTime      int      `json:"totalTime" binding:"omitempty"`
	DificultyLevel string   `json:"dificultyLevel" binding:"omitempty,oneof=easy medium hard"`
	Tags           []string `json:"tags" binding:"omitempty"`
}

func RecipeRequestToModel(dto RecipeRequest) models.Recipe {
	var model models.Recipe
	model.DificultyLevel = dto.DificultyLevel
	model.Image = dto.Image
	model.Tags = dto.Tags
	model.Visibility = dto.Visibility
	model.Ingredients = dto.Ingredients
	model.Step = dto.Step
	model.TotalTime = dto.TotalTime
	model.Title = dto.Title
	model.Description = dto.Description
	return model
}

func RecipeModelToResponse(model models.Recipe) RecipeResponse {
	var response RecipeResponse
	response.CreatedAt = model.CreatedAt
	response.UpdatedAt = model.UpdatedAt
	response.ID = model.ID.Hex()
	response.DificultyLevel = model.DificultyLevel
	response.Image = model.Image
	response.Tags = model.Tags
	response.Visibility = model.Visibility
	response.Ingredients = model.Ingredients
	response.Step = model.Step
	response.TotalTime = model.TotalTime
	response.Title = model.Title
	response.Description = model.Description
	response.UserID = model.UserID.Hex()
	response.AverageRating = model.AverageRating
	return response
}
