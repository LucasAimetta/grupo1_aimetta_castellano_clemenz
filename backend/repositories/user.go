package repositories

import (
	"burned/backend/database"
	"burned/backend/models"
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type UserRepositoryInterface interface {
	CreateUser(user models.User) (*mongo.InsertOneResult, error)
	UpdateUser(user models.User) (*mongo.UpdateResult, error)
	UpdatePassword(user models.User, password string) (*mongo.UpdateResult, error)
	DeleteUser(id primitive.ObjectID) (*mongo.DeleteResult, error)
	GetUserById(id primitive.ObjectID) (models.User, error)
	GetUserByEmail(email string) (models.User, error)
	GetUserByName(name string) (models.User, error)
	GetUserByGoogleID(googleID string) (models.User, error)
}

type UserRepository struct {
	db database.DB
}

func NewUserRepository(db database.DB) *UserRepository {
	return &UserRepository{
		db: db,
	}
}

func (repository *UserRepository) CreateUser(user models.User) (*mongo.InsertOneResult, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("User")
	return collection.InsertOne(context.TODO(), user)
}

func (repository *UserRepository) UpdatePassword(user models.User, password string) (*mongo.UpdateResult, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("User")
	filter := bson.M{"_id": user.ID}
	update := bson.M{"$set": bson.M{
		"hashedPassword": password,
	}}

	result, err := collection.UpdateOne(context.TODO(), filter, update)
	return result, err
}

func (repository *UserRepository) UpdateUser(user models.User) (*mongo.UpdateResult, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("User")
	filter := bson.M{"_id": user.ID}
	update := bson.M{"$set": bson.M{
		"name":      user.Name,
		"google_id": user.GoogleID,
		"updatedAt": user.UpdatedAt,
	}}

	result, err := collection.UpdateOne(context.TODO(), filter, update)
	return result, err
}

func (repository *UserRepository) DeleteUser(id primitive.ObjectID) (*mongo.DeleteResult, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("User")
	filter := bson.M{"_id": id}
	return collection.DeleteOne(context.TODO(), filter)
}

func (repository *UserRepository) GetUserById(id primitive.ObjectID) (models.User, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("User")
	filter := bson.M{"_id": id}

	var user models.User
	err := collection.FindOne(context.TODO(), filter).Decode(&user)
	if err != nil {
		return models.User{}, err
	}
	return user, nil
}

func (repository *UserRepository) GetUserByEmail(email string) (models.User, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("User")
	filter := bson.M{"email": email}
	var user models.User
	err := collection.FindOne(context.TODO(), filter).Decode(&user)
	if err != nil {
		return models.User{}, err
	}
	return user, nil
}

func (repository *UserRepository) GetUserByName(name string) (models.User, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("User")
	filter := bson.M{"name": name}
	var user models.User
	err := collection.FindOne(context.TODO(), filter).Decode(&user)
	if err != nil {
		return models.User{}, err
	}
	return user, nil
}

func (repository *UserRepository) GetUserByGoogleID(googleID string) (models.User, error) {
	collection := repository.db.GetClient().Database("Burned").Collection("User")
	var user models.User
	filter := bson.M{"google_id": googleID}
	err := collection.FindOne(context.TODO(), filter).Decode(&user)
	if err != nil {
		return models.User{}, err
	}
	return user, nil
}
