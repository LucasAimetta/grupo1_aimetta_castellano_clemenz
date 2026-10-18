package repositories

import (
	"context"
	"time"

	"burned/backend/database"
	"burned/backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type DeletedRecipeRepositoryInterface interface {
	AddDeletedRecipe(ctx context.Context, recipeID string) error
	GetUnprocessedDeletedRecipes(ctx context.Context) ([]models.DeletedRecipe, error)
	MarkAsProcessed(ctx context.Context, ids []primitive.ObjectID) error
}

type DeletedRecipeRepository struct {
	db database.DB
}

func NewDeletedRecipeRepository(db database.DB) *DeletedRecipeRepository {
	return &DeletedRecipeRepository{db: db}
}

func (r *DeletedRecipeRepository) getCollection() *mongo.Collection {
	return r.db.GetClient().Database("Burned").Collection("DeletedRecipes")
}

// AddDeletedRecipe registra el ID de la receta eliminada con process = false en MongoDB
func (r *DeletedRecipeRepository) AddDeletedRecipe(ctx context.Context, recipeID string) error {
	doc := models.DeletedRecipe{
		RecipeID:  recipeID,
		DeletedAt: time.Now(),
		Process:   false,
	}
	_, err := r.getCollection().InsertOne(ctx, doc)
	return err
}

// GetUnprocessedDeletedRecipes obtiene todas las recetas eliminadas donde process == false
func (r *DeletedRecipeRepository) GetUnprocessedDeletedRecipes(ctx context.Context) ([]models.DeletedRecipe, error) {
	filter := bson.M{"process": false}
	cursor, err := r.getCollection().Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []models.DeletedRecipe
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

// MarkAsProcessed actualiza el atributo process a true para los IDs procesados
func (r *DeletedRecipeRepository) MarkAsProcessed(ctx context.Context, ids []primitive.ObjectID) error {
	if len(ids) == 0 {
		return nil
	}
	filter := bson.M{"_id": bson.M{"$in": ids}}
	update := bson.M{"$set": bson.M{"process": true}}
	_, err := r.getCollection().UpdateMany(ctx, filter, update)
	return err
}

