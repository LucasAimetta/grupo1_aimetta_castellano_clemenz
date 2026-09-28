package repositories

import (
	"burned/backend/database"
	"burned/backend/models"
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type CommentRepositoryInterface interface {
	CreateComment(comment models.Comment) (*mongo.InsertOneResult, error)
	DeleteComment(id primitive.ObjectID) (*mongo.DeleteResult, error)
	GetCommentsByRecipe(recipeId primitive.ObjectID) ([]models.Comment, error)
	GetCommentById(Id primitive.ObjectID) (models.Comment, error)
}

type CommentRepository struct {
	db database.DB
}

func NewCommentRepository(db database.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

func (repository *CommentRepository) CreateComment(comment models.Comment) (*mongo.InsertOneResult, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Comment")
	return collection.InsertOne(context.TODO(), comment)
}

func (repository *CommentRepository) DeleteComment(id primitive.ObjectID) (*mongo.DeleteResult, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Comment")
	filter := bson.M{"_id": id}
	return collection.DeleteOne(context.TODO(), filter)
}

func (repository *CommentRepository) GetCommentsByRecipe(recipeId primitive.ObjectID) ([]models.Comment, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Comment")
	filter := bson.M{"recipeId": recipeId}

	opts := options.Find().SetSort(bson.D{{"createdAt", -1}})

	cursor, err := collection.Find(context.TODO(), filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var comments []models.Comment
	if err = cursor.All(context.TODO(), &comments); err != nil {
		return nil, err
	}
	return comments, nil
}

func (repository *CommentRepository) GetCommentById(Id primitive.ObjectID) (models.Comment, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("Comment")
	filter := bson.M{"_id": Id}
	var comment models.Comment
	err := collection.FindOne(context.TODO(), filter).Decode(&comment)
	if err != nil {
		return models.Comment{}, err
	}

	return comment, nil
}
