package repositories

import (
	"burned/backend/database"
	"burned/backend/dtos"
	"burned/backend/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type RecipeRepositoryInterface interface {
	CreateRecipe(recipe models.Recipe) (*mongo.InsertOneResult, error)
	UpdateRecipe(recipe models.Recipe) (*mongo.UpdateResult, error)
	DeleteRecipe(id primitive.ObjectID) (*mongo.DeleteResult, error)
	GetRecipes(filters dtos.RecipeSearchRequest) ([]models.Recipe, error)
	GetRecipeById(id primitive.ObjectID) (models.Recipe, error)
	GetRecipesByUser(id primitive.ObjectID) ([]models.Recipe, error)
	GetAll() ([]models.Recipe, error)
	GetTopRecipesLimit(limit int) ([]models.Recipe, error)
}

type RecipeRepository struct {
	db              database.DB
	savedRecipeRepo SavedRecipeRepositoryInterface
}

func NewRecipeRepository(db database.DB, savedRecipeRepo SavedRecipeRepositoryInterface) *RecipeRepository {
	return &RecipeRepository{
		db:              db,
		savedRecipeRepo: savedRecipeRepo,
	}
}

func (repository *RecipeRepository) CreateRecipe(recipe models.Recipe) (*mongo.InsertOneResult, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Recipe")
	return collection.InsertOne(context.TODO(), recipe)
}

func (repository *RecipeRepository) UpdateRecipe(recipe models.Recipe) (*mongo.UpdateResult, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Recipe")
	filter := bson.M{"_id": recipe.ID}
	update := bson.M{"$set": bson.M{
		"title":          recipe.Title,
		"description":    recipe.Description,
		"visibility":     recipe.Visibility,
		"totalTime":      recipe.TotalTime,
		"step":           recipe.Step,
		"dificultyLevel": recipe.DificultyLevel,
		"tags":           recipe.Tags,
		"ingredients":    recipe.Ingredients,
		"image":          recipe.Image,
		"updatedAt":      recipe.UpdatedAt,
		"averageRating":  recipe.AverageRating,
	}}
	return collection.UpdateOne(context.TODO(), filter, update)
}

func (repository *RecipeRepository) DeleteRecipe(id primitive.ObjectID) (*mongo.DeleteResult, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Recipe")
	filter := bson.M{"_id": id}
	return collection.DeleteOne(context.TODO(), filter)
}
func (repository *RecipeRepository) GetRecipes(filters dtos.RecipeSearchRequest) ([]models.Recipe, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Recipe")

	filtersMap := bson.M{}
	filtersMap["visibility"] = "public"
	// Filtros básicos
	if filters.Title != "" {
		filtersMap["title"] = bson.M{"$regex": filters.Title, "$options": "i"}
	}
	if filters.Description != "" {
		filtersMap["description"] = bson.M{"$regex": filters.Description, "$options": "i"}
	}
	if filters.DificultyLevel != "" {
		filtersMap["dificultyLevel"] = bson.M{"$regex": filters.DificultyLevel, "$options": "i"}
	}
	if filters.TotalTime != 0 {
		filtersMap["totalTime"] = bson.M{"$lte": filters.TotalTime}
	}
	if len(filters.Tags) > 0 {
		var tagConditions []bson.M
		for _, tag := range filters.Tags {

			tagConditions = append(tagConditions, bson.M{
				"tags": bson.M{"$regex": tag, "$options": "i"},
			})
		}

		filtersMap["$and"] = tagConditions
	}

	cursor, err := collection.Find(context.TODO(), filtersMap)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var recipes []models.Recipe
	if err = cursor.All(context.Background(), &recipes); err != nil {
		return nil, err
	}
	return recipes, nil
}

func (repository *RecipeRepository) GetAll() ([]models.Recipe, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Recipe")

	// Contexto (puedes pasarlo por parámetro o crear uno aquí)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Definimos las opciones de ordenamiento AQUÍ
	// "rating": -1 significa Descendente (Mayor a menor)
	// Si tu campo se llama diferente en Mongo (ej: "average_rating"), cámbialo aquí.
	opts := options.Find().SetSort(bson.D{{"rating", -1}})

	// 2. Pasamos las opciones al Find
	cursor, err := collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var recipes []models.Recipe
	if err = cursor.All(ctx, &recipes); err != nil {
		return nil, err
	}

	return recipes, nil
}

func (repository *RecipeRepository) GetRecipeById(id primitive.ObjectID) (models.Recipe, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Recipe")
	filter := bson.M{"_id": id}
	var recipe models.Recipe
	err := collection.FindOne(context.TODO(), filter).Decode(&recipe)
	if err != nil {
		return models.Recipe{}, err
	}
	return recipe, nil
}

func (repository *RecipeRepository) GetRecipesByUser(id primitive.ObjectID) ([]models.Recipe, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Recipe")
	filter := bson.M{"userId": id}

	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		return nil, err
	}

	defer cursor.Close(context.Background())
	var recipes []models.Recipe
	for cursor.Next(context.Background()) {
		var recipe models.Recipe
		err := cursor.Decode(&recipe)
		if err != nil {
			continue
		}
		recipes = append(recipes, recipe)
	}
	return recipes, nil
}

func (repository *RecipeRepository) GetRecipesSavedByUser(id primitive.ObjectID) ([]models.Recipe, error) {
	saved, err := repository.savedRecipeRepo.GetRecipesSavedByUser(id)
	if err != nil {
		return nil, err
	}
	var recipes []models.Recipe
	for i := 0; i < len(saved); i++ {
		recipe, err := repository.GetRecipeById(saved[i].ID)
		if err != nil {
			return nil, err
		}
		recipes = append(recipes, recipe)
	}

	return recipes, nil
}

func (repository *RecipeRepository) GetTopRecipesLimit(limit int) ([]models.Recipe, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Recipe")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{"averageRating", -1}}).SetLimit(int64(limit))

	filter := bson.M{"visibility": "public"}

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var recipes []models.Recipe
	if err = cursor.All(ctx, &recipes); err != nil {
		return nil, err
	}

	return recipes, nil
}
