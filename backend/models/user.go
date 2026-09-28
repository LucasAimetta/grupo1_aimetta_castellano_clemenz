package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name           string             `bson:"name" json:"name"`
	HashedPassword string             `bson:"hashedPassword,omitempty" json:"-"`
	Email          string             `bson:"email" json:"email"`
	Role           string             `bson:"role" json:"role"`
	CreatedAt      time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt" json:"updatedAt"`
	GoogleID       string             `bson:"google_id,omitempty" json:"google_id,omitempty"`
}
