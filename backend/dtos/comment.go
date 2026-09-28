package dtos

import (
	"burned/backend/models"
	"time"
)

type CommentRequest struct {
	RecipeID string `bson:"recipeId" json:"recipeId"`
	Text     string `bson:"text" json:"text"`
}

type CommentResponse struct {
	ID        string    `bson:"_id,omitempty" json:"id"`
	UserID    string    `bson:"userId" json:"userId"`
	UserName  string    `bson:"userName" json:"userName"`
	RecipeID  string    `bson:"recipeId" json:"recipeId"`
	Text      string    `bson:"text" json:"text"`
	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
}

func CommentModelToResponse(model models.Comment) CommentResponse {
	var dto CommentResponse
	dto.ID = model.ID.Hex()
	dto.CreatedAt = model.CreatedAt
	dto.RecipeID = model.RecipeID.Hex()
	dto.UserID = model.UserID.Hex()
	dto.UserName = model.UserName
	dto.Text = model.Text
	return dto
}
