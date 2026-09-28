package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SavedRecipe struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	RecipeID  primitive.ObjectID `bson:"recipeId" json:"recipeId"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}

type TopSavedRecipe struct {
	RecipeID primitive.ObjectID `bson:"_id" json:"recipeId"`
	Count    int64              `bson:"count" json:"count"`
}
