package handlers

import (
	"burned/backend/dtos"
	"burned/backend/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type RatingHandler struct {
	service services.RatingServiceInterface
}

func NewRatingHandler(s services.RatingServiceInterface) *RatingHandler {
	return &RatingHandler{service: s}
}

func (handler *RatingHandler) RateRecipe(c *gin.Context) {
	var req dtos.RateRecipeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, err.Error())
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

	id := c.Param("id")

	newAverage, err := handler.service.RateRecipe(req, id, userIdStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar voto: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Voto guardado exitosamente",
		"new_rating": newAverage,
	})
}

func (handler *RatingHandler) GetRatingByRecipe(c *gin.Context) {

	id := c.Param("id")

	result, err := handler.service.GetRatingByRecipe(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, result)

}
