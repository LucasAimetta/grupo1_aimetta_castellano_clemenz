package handlers

import (
	"burned/backend/auth"
	"burned/backend/dtos"
	"burned/backend/services"
	"context"
	"encoding/json"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type AuthHandler struct {
	service services.UserServiceInterface
}

func NewAuthHandler(s services.UserServiceInterface) *AuthHandler {
	return &AuthHandler{service: s}
}

var googleOauthConfig = &oauth2.Config{
	RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
	ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
	ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
	Scopes: []string{
		"https://www.googleapis.com/auth/userinfo.email",
		"https://www.googleapis.com/auth/userinfo.profile",
	},
	Endpoint: google.Endpoint,
}

func (handler *AuthHandler) LogIn(c *gin.Context) {
	var req dtos.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Error": err.Error()})
		return
	}

	user, err := handler.service.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Error": "user not found"})
		return
	}

	if !auth.CheckPasswordHash(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"Error": "invalid credentials"})
		return
	}
	oid, error := primitive.ObjectIDFromHex(user.ID)
	if error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"Error": "internal server error"})
		return
	}
	// Generar token
	token, err := auth.GenerateToken(oid, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": "error generating the token"})
		return
	}

	c.JSON(http.StatusOK, dtos.AuthResponse{
		Token: token,
		User:  user,
	})
}

func (handler *AuthHandler) Register(c *gin.Context) {
	var request dtos.RegisterRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Error": err.Error()})
		return
	}
	user, err := handler.service.CreateUser(request)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Error": err.Error()})
		return
	}

	oid, error := primitive.ObjectIDFromHex(user.ID)
	if error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": "internal server error"})
		return
	}

	// Generar token
	token, err := auth.GenerateToken(oid, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": "Error al generar el token"})
		return
	}

	c.JSON(http.StatusOK, dtos.AuthResponse{
		Token: token,
		User:  user,
	})
}
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	// 1. Configurar la URL de redirección del Backend (Callback)
	// En Render debe ser: https://burned.onrender.com/auth/google/callback
	// En Local debe ser: http://localhost:8080/auth/google/callback
	redirectURL := os.Getenv("GOOGLE_REDIRECT_URL")
	if redirectURL == "" {
		redirectURL = "http://localhost:8080/auth/google/callback"
	}
	googleOauthConfig.RedirectURL = redirectURL

	// 2. Configurar la URL del Frontend (A donde enviamos al usuario después)
	// En Render será tu dominio del frontend.
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173" // Fallback para desarrollo local
	}

	// 3. Intercambiamos el código por el token de Google
	code := c.Query("code")
	token, err := googleOauthConfig.Exchange(context.Background(), code)
	if err != nil {
		// Redirigimos al frontend con error usando la variable dinámica
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=auth_failed")
		return
	}

	// 4. Obtener datos del perfil de Google
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=google_error")
		return
	}
	defer resp.Body.Close()

	var googleUser dtos.GoogleUserDTO
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=json_error")
		return
	}

	// 5. Lógica de BD: Login o Registro
	userResponse, err := h.service.LoginOrRegisterGoogle(googleUser)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=db_error")
		return
	}

	// 6. Generar JWT
	objID, _ := primitive.ObjectIDFromHex(userResponse.ID)
	jwtToken, err := auth.GenerateToken(objID, userResponse.Email, userResponse.Role)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=token_error")
		return
	}

	// 7. ÉXITO: Redirigimos al frontend con el token
	// Esto enviará al usuario a: https://tu-frontend.onrender.com?token=xyz...
	c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?token="+jwtToken)
}

func (handler *AuthHandler) GoogleLogin(c *gin.Context) {
	// 1. Buscamos la variable de entorno para el Callback
	redirectURL := os.Getenv("GOOGLE_REDIRECT_URL")

	// Si la variable está vacía, usamos localhost por defecto.
	if redirectURL == "" {
		redirectURL = "http://localhost:8080/auth/google/callback"
	}

	// 2. Asignamos la URL correcta a la configuración
	googleOauthConfig.RedirectURL = redirectURL

	// 3. Generamos el link de Google y redirigimos al usuario a la pantalla de Google
	state := "random-state-string"
	url := googleOauthConfig.AuthCodeURL(state)

	c.Redirect(http.StatusTemporaryRedirect, url)
}
