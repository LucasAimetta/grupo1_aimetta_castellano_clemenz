package repositories

import (
	"burned/backend/database"
	"burned/backend/models"
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type SavedRecipeRepositoryInterface interface {
	SavedRecipe(saved models.SavedRecipe) (*mongo.InsertOneResult, error)
	UnsavedRecipe(userId primitive.ObjectID, recipeId primitive.ObjectID) (*mongo.DeleteResult, error)
	GetRecipesSavedByUser(idUser primitive.ObjectID) ([]models.SavedRecipe, error)
	GetSavedCountByRecipe(idRecipe primitive.ObjectID) (int64, error)
	GetTop10MostSaved() ([]models.TopSavedRecipe, error)
	GetSavedRecipesSavedByUserAndRecipe(idUser primitive.ObjectID, idRecipe primitive.ObjectID) ([]models.SavedRecipe, error)
}

type SavedRecipeRepository struct {
	db database.DB
}

func NewSavedRecipeRepository(db database.DB) *SavedRecipeRepository {
	return &SavedRecipeRepository{db: db}
}

func (repository *SavedRecipeRepository) SavedRecipe(saved models.SavedRecipe) (*mongo.InsertOneResult, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("SavedRecipes")
	return collection.InsertOne(context.TODO(), saved)
}

func (repository *SavedRecipeRepository) UnsavedRecipe(userId primitive.ObjectID, recipeId primitive.ObjectID) (*mongo.DeleteResult, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("SavedRecipes")

	filter := bson.M{"userId": userId, "recipeId": recipeId}

	return collection.DeleteMany(context.TODO(), filter)

}

func (repository *SavedRecipeRepository) GetRecipesSavedByUser(idUser primitive.ObjectID) ([]models.SavedRecipe, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("SavedRecipes")
	filter := bson.M{
		"userId": idUser,
	}
	//Busca los elementos que contengas como userId el oid enviado por parametro
	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		return nil, err
	}
	//convertimos a model y devolvemos
	defer cursor.Close(context.Background())
	var recipes []models.SavedRecipe
	for cursor.Next(context.Background()) {
		var recipe models.SavedRecipe
		err := cursor.Decode(&recipe)
		if err != nil {
			continue
		}
		recipes = append(recipes, recipe)
	}
	return recipes, nil
}
func (repository *SavedRecipeRepository) GetSavedCountByRecipe(idRecipe primitive.ObjectID) (int64, error) {
	collection := repository.db.GetClient().
		Database("Burned").
		Collection("SavedRecipes")

	filter := bson.M{
		"recipeId": idRecipe,
	}
	//Devuelve la cantidad de Saved Recipes que contienen ese id de la receta, asi conocemos cuantas veces fue guardada
	count, err := collection.CountDocuments(context.TODO(), filter)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (repository *SavedRecipeRepository) GetTop10MostSaved() ([]models.TopSavedRecipe, error) {

	collection := repository.db.GetClient().Database("Burned").Collection("SavedRecipes")

	pipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.M{
			"_id":   "$recipeId",
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{
			"count": -1,
		}}},
		{{Key: "$limit", Value: 10}},
	}

	cursor, err := collection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var result []models.TopSavedRecipe
	if err := cursor.All(context.TODO(), &result); err != nil {
		return nil, err
	}

	return result, nil
}

func (repository *SavedRecipeRepository) GetSavedRecipesSavedByUserAndRecipe(idUser primitive.ObjectID, idRecipe primitive.ObjectID) ([]models.SavedRecipe, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("SavedRecipes")
	filter := bson.M{
		"userId":   idUser,
		"recipeId": idRecipe,
	}
	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var savedRecipes []models.SavedRecipe

	if err = cursor.All(context.TODO(), &savedRecipes); err != nil {
		return nil, err
	}

	return savedRecipes, nil
}
