package services

import (
	"burned/backend/dtos"
	"burned/backend/models"
	"burned/backend/repositories"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CommentServiceInterface interface {
	CreateComment(comment dtos.CommentRequest, idUser string) (dtos.CommentResponse, error)
	DeleteComment(commentId string, requesterId string, requesterRole string) error
	GetCommentsByRecipe(recipeId string) ([]dtos.CommentResponse, error)
	GetCommentById(Id string) (dtos.CommentResponse, error)
}

type CommentService struct {
	commentRepo repositories.CommentRepositoryInterface
	userRepo    repositories.UserRepositoryInterface
	recipeRepo  repositories.RecipeRepositoryInterface
}

func NewCommentService(repo repositories.CommentRepositoryInterface, userRepo repositories.UserRepositoryInterface, recipeRepo repositories.RecipeRepositoryInterface) *CommentService {
	return &CommentService{commentRepo: repo, userRepo: userRepo, recipeRepo: recipeRepo}
}

func (service *CommentService) CreateComment(comment dtos.CommentRequest, idUser string) (dtos.CommentResponse, error) {
	userOid, err := primitive.ObjectIDFromHex(idUser)
	if err != nil {
		return dtos.CommentResponse{}, errors.New("invalid id")
	}
	user, err := service.userRepo.GetUserById(userOid)
	if err != nil {
		return dtos.CommentResponse{}, errors.New("user not found")
	}
	recipeOid, err := primitive.ObjectIDFromHex(comment.RecipeID)
	if err != nil {
		return dtos.CommentResponse{}, errors.New("invalid id")
	}

	var model models.Comment
	model.CreatedAt = time.Now()
	model.RecipeID = recipeOid
	model.UserID = userOid
	model.UserName = user.Name
	model.Text = comment.Text

	result, err := service.commentRepo.CreateComment(model)
	if err != nil {
		return dtos.CommentResponse{}, errors.New("internal server error")
	}

	response := dtos.CommentModelToResponse(model)
	insertedOid, ok := result.InsertedID.(primitive.ObjectID)
	if !ok {
		return dtos.CommentResponse{}, errors.New("invalid id")
	}
	response.ID = insertedOid.Hex()
	return response, nil
}
func (service *CommentService) DeleteComment(commentId string, requesterId string, requesterRole string) error {
	fmt.Printf("DEBUG: Iniciando borrado. ID Comentario: %s, Solicitante: %s, Rol: %s\n", commentId, requesterId, requesterRole)
	commentOid, err := primitive.ObjectIDFromHex(commentId)
	if err != nil {
		fmt.Println("DEBUG ERROR: Fallo al convertir commentId a hex")
		return errors.New("invalid id")
	}
	userOid, err := primitive.ObjectIDFromHex(requesterId)
	if err != nil {
		fmt.Println("DEBUG ERROR: Fallo al convertir requesterId a hex")
		return errors.New("invalid id")
	}
	comment, err := service.commentRepo.GetCommentById(commentOid)
	if err != nil {
		fmt.Printf("DEBUG ERROR: Comentario no encontrado en DB: %v\n", err)
		return errors.New("comment not found")
	}

	recipe, err := service.recipeRepo.GetRecipeById(comment.RecipeID)
	if err != nil {
		fmt.Printf("DEBUG ERROR: Receta %s no encontrada: %v\n", comment.RecipeID.Hex(), err)
		return errors.New("associated recipe not found")
	}

	isOwner := comment.UserID == userOid
	isAdmin := requesterRole == "admin"
	isRecipeOwner := recipe.UserID == userOid

	if !isAdmin && !isOwner && !isRecipeOwner {
		fmt.Printf("DEBUG: Permisos -> EsDueñoComentario: %t, EsAdmin: %t, EsDueñoReceta: %t\n", isOwner, isAdmin, isRecipeOwner)
		return errors.New("unauthorized to delete this comment")
	}

	result, err := service.commentRepo.DeleteComment(commentOid)
	if err != nil || result.DeletedCount == 0 {
		fmt.Println("DEBUG ERROR: Mongo dijo que borró 0 documentos")
		return errors.New("could not delete comment")
	}
	return nil
}
func (service *CommentService) GetCommentsByRecipe(recipeId string) ([]dtos.CommentResponse, error) {
	commentOid, err := primitive.ObjectIDFromHex(recipeId)
	if err != nil {
		return []dtos.CommentResponse{}, errors.New("invalid id")
	}
	result, err := service.commentRepo.GetCommentsByRecipe(commentOid)
	if err != nil {
		return []dtos.CommentResponse{}, errors.New("internal server error")
	}

	var comments []dtos.CommentResponse
	for _, comment := range result {
		comments = append(comments, dtos.CommentModelToResponse(comment))
	}
	return comments, nil

}

func (service *CommentService) GetCommentById(Id string) (dtos.CommentResponse, error) {
	commentId, err := primitive.ObjectIDFromHex(Id)
	if err != nil {
		return dtos.CommentResponse{}, errors.New("invalid id")
	}
	result, err := service.commentRepo.GetCommentById(commentId)
	if err != nil {
		return dtos.CommentResponse{}, errors.New("internal server error")
	}
	return dtos.CommentModelToResponse(result), nil
}
