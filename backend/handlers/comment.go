package handlers

import (
	"burned/backend/dtos"
	"burned/backend/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CommentHandler struct {
	service services.CommentServiceInterface
}

func NewCommentHandler(s services.CommentServiceInterface) *CommentHandler {
	return &CommentHandler{service: s}
}

func (handler *CommentHandler) CreateComment(c *gin.Context) {
	var request dtos.CommentRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"Error": "User unauthorized"})
		return
	}
	userIdStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": "Invalid user id type"})
		return
	}

	result, err := handler.service.CreateComment(request, userIdStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, result)
}

func (handler *CommentHandler) DeleteComment(c *gin.Context) {
	commentId := c.Param("id")
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	err := handler.service.DeleteComment(commentId, userID.(string), userRole.(string))

	if err != nil {
		if err.Error() == "unauthorized to delete this comment" {
			c.JSON(http.StatusForbidden, gin.H{"Error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"Error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"Result": "Comment deleted successfully"})
}

func (handler *CommentHandler) GetCommentsByRecipe(c *gin.Context) {
	id := c.Param("recipeId")

	result, err := handler.service.GetCommentsByRecipe(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, result)
}

func (handler *CommentHandler) GetCommentById(c *gin.Context) {
	id := c.Param("id")

	result, err := handler.service.GetCommentById(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, result)
}
