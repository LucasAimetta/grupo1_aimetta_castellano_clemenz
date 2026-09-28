package repositories

import (
	"burned/backend/database"
	"burned/backend/dtos"
	"burned/backend/models"
	"context"
	"errors"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type RatingRepositoryInterface interface {
	UpsertRating(model models.Rating) (float64, error)
	GetRatingByUserAndRecipe(model models.Rating) (models.Rating, error)
	GetRatingByRecipe(recipeId primitive.ObjectID) (dtos.Avg, error)
}

type RatingRepository struct {
	db database.DB
}

func NewRatingRepository(db database.DB) *RatingRepository {
	return &RatingRepository{db: db}
}
func (repository *RatingRepository) UpsertRating(model models.Rating) (float64, error) {
	ctx := context.TODO()
	ratingCollection := repository.db.GetClient().Database("Burned").Collection("Rating")
	recipeCollection := repository.db.GetClient().Database("Burned").Collection("Recipe")

	filter := bson.M{
		"userId":   model.UserID,
		"recipeId": model.RecipeID,
	}

	update := bson.M{
		"$set": bson.M{
			"stars":     model.Stars,
			"updatedAt": model.UpdatedAt,
		},
		"$setOnInsert": bson.M{
			"userId":    model.UserID,
			"recipeId":  model.RecipeID,
			"createdAt": model.CreatedAt,
		},
	}

	opts := options.Update().SetUpsert(true)
	_, err := ratingCollection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return 0, fmt.Errorf("error guardando rating: %v", err)
	}
	matchStage := bson.D{{"$match", bson.D{{"recipeId", model.RecipeID}}}}

	groupStage := bson.D{
		{"$group", bson.D{
			{"_id", "$recipeId"},
			{"averageRating", bson.D{{"$avg", "$stars"}}},
		}},
	}

	cursor, err := ratingCollection.Aggregate(ctx, mongo.Pipeline{matchStage, groupStage})
	if err != nil {
		return 0, fmt.Errorf("error calculando promedio: %v", err)
	}
	defer cursor.Close(ctx)

	var results []struct {
		AverageRating float64 `bson:"averageRating"`
	}

	if err = cursor.All(ctx, &results); err != nil {
		return 0, err
	}

	newAverage := 0.0
	if len(results) > 0 {
		newAverage = results[0].AverageRating
	}

	_, err = recipeCollection.UpdateOne(
		ctx,
		bson.M{"_id": model.RecipeID},
		bson.M{"$set": bson.M{"rating": newAverage}},
	)

	if err != nil {
		return 0, fmt.Errorf("error actualizando promedio en receta: %v", err)
	}

	return newAverage, nil
}

func (repository *RatingRepository) GetRatingByUserAndRecipe(model models.Rating) (models.Rating, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Rating")

	if model.UserID.IsZero() || model.RecipeID.IsZero() {
		return models.Rating{}, errors.New("userID and recipeID are required")
	}

	filter := bson.M{
		"userId":   model.UserID,
		"recipeId": model.RecipeID,
	}

	var rating models.Rating
	err := collection.FindOne(context.TODO(), filter).Decode(&rating)
	if err != nil {
		return models.Rating{}, err
	}

	return rating, nil
}

func (repository *RatingRepository) GetRatingByRecipe(recipeId primitive.ObjectID) (dtos.Avg, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Rating")

	pipeline := mongo.Pipeline{
		{
			{"$match", bson.M{
				"recipeId": recipeId,
			}},
		},
		{
			{"$group", bson.M{
				"_id":   "$recipeId",
				"avg":   bson.M{"$avg": "$stars"},
				"count": bson.M{"$sum": 1},
			}},
		},
	}
	var res dtos.Avg
	cursor, err := collection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		return res, err
	}
	defer cursor.Close(context.TODO())

	if cursor.Next(context.TODO()) {

		if err := cursor.Decode(&res); err != nil {
			return res, err
		}
		return res, nil
	}
	// No hay ratings
	return res, nil
}
