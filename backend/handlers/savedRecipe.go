package handlers

import (
	"burned/backend/dtos"
	"burned/backend/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SavedRecipeHandler struct {
	service services.SavedRecipeServiceInterface
}

func NewSavedRecipeHandler(s services.SavedRecipeServiceInterface) *SavedRecipeHandler {
	return &SavedRecipeHandler{service: s}
}

func (handler *SavedRecipeHandler) SavedRecipe(c *gin.Context) {
	var saved dtos.SavedRecipeRequest
	if err := c.ShouldBindJSON(&saved); err != nil {
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

	result, err := handler.service.SavedRecipe(saved, userIdStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusCreated, result)
}

func (handler *SavedRecipeHandler) UnsavedRecipe(c *gin.Context) {
	recipeID := c.Param("id")
	userID, _ := c.Get("user_id")
	userIdStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": "Invalid user id type"})
		return
	}

	err := handler.service.UnsavedRecipe(userIdStr, recipeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"Result": "It was successfully unsaved"})
}

func (handler *SavedRecipeHandler) GetRecipesSavedByUser(c *gin.Context) {
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

	result, err := handler.service.GetRecipesSavedByUser(userIdStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, result)

}

func (handler *SavedRecipeHandler) GetSavedCountByRecipe(c *gin.Context) {
	id := c.Param("id")

	count, err := handler.service.GetSavedCountByRecipe(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}

func (handler *SavedRecipeHandler) GetTop10MostSaved(c *gin.Context) {

	result, err := handler.service.GetTop10MostSaved()
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"Result": result})
}
