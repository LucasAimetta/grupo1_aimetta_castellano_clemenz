package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DeletedRecipe struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	RecipeID  string             `bson:"recipeId" json:"recipeId"`
	DeletedAt time.Time          `bson:"deletedAt" json:"deletedAt"`
	Process   bool               `bson:"process" json:"process"`
}

