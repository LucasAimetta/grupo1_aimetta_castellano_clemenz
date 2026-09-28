package handlers

import (
	"burned/backend/dtos"
	"burned/backend/services"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type RecipeHandler struct {
	service services.RecipeServiceInterface
}

func NewRecipeHandler(s services.RecipeServiceInterface) *RecipeHandler {
	return &RecipeHandler{service: s}
}

func (handler *RecipeHandler) CreateRecipe(c *gin.Context) {
	var req dtos.RecipeRequest
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
	result, err := handler.service.CreateRecipe(req, userIdStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusCreated, result)
}

func (handler *RecipeHandler) UpdateRecipe(c *gin.Context) {
	var req dtos.RecipeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, err.Error())
		return
	}
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"Error": "User unauthorized"})
		return
	}
	id := c.Param("id")
	requesterId, _ := c.Get("user_id")
	requesterRole, _ := c.Get("user_role")
	result, err := handler.service.UpdateRecipe(req, id, requesterId.(string), requesterRole.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, result)
}

func (handler *RecipeHandler) DeleteRecipe(c *gin.Context) {
	id := c.Param("id")
	requesterId, _ := c.Get("user_id")
	requesterRole, _ := c.Get("user_role")
	err := handler.service.DeleteRecipe(id, requesterId.(string), requesterRole.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"Result": "It was successfully deleted"})

}

func (handler *RecipeHandler) GetRecipes(c *gin.Context) {
	var recipe dtos.RecipeSearchRequest

	err := c.ShouldBindJSON(&recipe)

	if err != nil && err.Error() != "EOF" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido: " + err.Error()})
		return
	}

	recipes, err := handler.service.GetRecipes(recipe)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error interno al obtener recetas"})
		return
	}

	if recipes == nil {
		recipes = []dtos.RecipeResponse{}
	}

	c.JSON(http.StatusOK, recipes)
}

func (handler *RecipeHandler) GetRecipesByUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User unauthorized"})
		return
	}
	userIdStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user id type"})
		return
	}

	result, err := handler.service.GetRecipesByUser(userIdStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, result)
}

func (handler *RecipeHandler) GetRecipeById(c *gin.Context) {
	id := c.Param("id")

	result, err := handler.service.GetRecipeById(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, result)
}

func (handler *RecipeHandler) GetAll(c *gin.Context) {
	// Llama al servicio
	recipes, err := handler.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener las recetas"})
		return
	}

	// Si está vacío, devolvemos array vacío en vez de null
	if recipes == nil {
		recipes = []dtos.RecipeResponse{}
	}

	c.JSON(http.StatusOK, recipes)
}

func (handler *RecipeHandler) GetTopRecipes(c *gin.Context) {
	recipes, err := handler.service.GetTopRecipes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener top recetas"})
		return
	}

	if recipes == nil {
		recipes = []dtos.RecipeResponse{}
	}

	c.JSON(http.StatusOK, recipes)
}
func (handler *RecipeHandler) QuickSearch(c *gin.Context) {
	title := c.Query("q")
	description := c.Query("desc")
	difficulty := c.Query("difficulty")
	timeStr := c.Query("time")
	tagsStr := c.Query("tags") // <--- Leemos el parámetro 'tags'

	// Convertir Tiempo
	var totalTime int
	if timeStr != "" {
		parsedTime, err := strconv.Atoi(timeStr)
		if err == nil {
			totalTime = parsedTime
		}
	}

	// Convertir Tags (String "vegano,facil" -> Array ["vegano", "facil"])
	var tags []string
	if tagsStr != "" {
		splitTags := strings.Split(tagsStr, ",")
		for _, t := range splitTags {
			trimmed := strings.TrimSpace(t)
			if trimmed != "" {
				tags = append(tags, trimmed)
			}
		}
	}

	filters := dtos.RecipeSearchRequest{
		Title:          title,
		Description:    description,
		DificultyLevel: difficulty,
		TotalTime:      totalTime,
		Tags:           tags, // <--- Asignamos al DTO
	}

	recipes, err := handler.service.GetRecipes(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Evitar null en la respuesta JSON
	if recipes == nil {
		recipes = []dtos.RecipeResponse{}
	}

	c.JSON(http.StatusOK, recipes)
}
