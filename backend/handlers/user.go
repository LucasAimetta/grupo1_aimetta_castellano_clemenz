package handlers

import (
	"burned/backend/dtos"
	"burned/backend/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	service services.UserServiceInterface
}

func NewUserHandler(s services.UserServiceInterface) *UserHandler {
	return &UserHandler{service: s}
}

func (handler *UserHandler) UpdateUser(c *gin.Context) {
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
	var request dtos.RegisterRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result, err := handler.service.UpdateUser(request, userIdStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (handler *UserHandler) UpdatePassword(c *gin.Context) {
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
	var newPassword dtos.UpdatePasswordRequest
	if err := c.ShouldBindJSON(&newPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Error": err.Error()})
		return
	}
	result, err := handler.service.UpdatePassword(userIdStr, newPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)

}

func (handler *UserHandler) DeleteUser(c *gin.Context) {
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
	err := handler.service.DeleteUser(userIdStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"Result": "It was successfully deleted"})
}

func (handler *UserHandler) GetUserById(c *gin.Context) {
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
	result, err := handler.service.GetUserById(userIdStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (handler *UserHandler) GetUserByEmail(c *gin.Context) {
	email := c.Param("email")
	result, err := handler.service.GetUserByEmail(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}
func (handler *UserHandler) GetUserByName(c *gin.Context) {
	name := c.Param("name")
	result, err := handler.service.GetUserByName(name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (handler *UserHandler) UploadProfileImage(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(400, gin.H{"error": "No se recibi  el archivo"})
			return
		}
		
		// Asegurar que la carpeta ./uploads existe
		os.MkdirAll("./uploads", os.ModePerm)

		// Generar un nombre  nico usando la fecha/hora para que no se sobreescriban
		filename := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
		filepath := "./uploads/" + filename

		// Guardar el archivo en el disco
		if err := c.SaveUploadedFile(file, filepath); err != nil {
			c.JSON(500, gin.H{"error": "Error guardando el archivo"})
			return
		}

		// Devolver la URL de la imagen local al frontend
		// Si en producci n usas otro dominio, esto deber a leerse de una variable de entorno.
		fileURL := fmt.Sprintf("http://localhost:8080/uploads/%s", filename)
		c.JSON(200, gin.H{"secure_url": fileURL})
}