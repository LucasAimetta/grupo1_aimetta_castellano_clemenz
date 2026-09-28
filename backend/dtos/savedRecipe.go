package dtos

import "time"

type SavedRecipeRequest struct {
	RecipeID string `json:"recipeId"`
}

type SavedRecipeResponse struct {
	RecipeID string    `json:"savedRecipeId"`
	SavedAt  time.Time `json:"createdAt"`
}
