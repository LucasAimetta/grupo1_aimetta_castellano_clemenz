package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Ingredient struct {
	Name     string  `bson:"name" json:"name"`
	Quantity float64 `bson:"quantity" json:"quantity"`
}

type Step struct {
	Title       string `bson:"title" json:"title"`
	Descripcion string `bson:"descripcion" json:"descripcion"`
	Time        int    `bson:"time" json:"time"` // minutos para este paso
}

type Recipe struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID         primitive.ObjectID `bson:"userId" json:"userId"`
	Title          string             `bson:"title" json:"title"`
	Description    string             `bson:"description" json:"description"`
	Visibility     string             `bson:"visibility" json:"visibility"` // "public" | "private"
	CreatedAt      time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt" json:"updatedAt"`
	TotalTime      int                `bson:"totalTime" json:"totalTime"`
	Step           []Step             `bson:"step" json:"step"`
	DificultyLevel string             `bson:"dificultyLevel" json:"dificultyLevel"`
	Tags           []string           `bson:"tags" json:"tags"`
	Ingredients    []Ingredient       `bson:"ingredients" json:"ingredients"`
	Image          string             `bson:"image" json:"image"`
	AverageRating  float64            `bson:"averageRating" json:"averageRating"`
}
