package handlers

import (
	"burned/backend/auth"
	"burned/backend/dtos"
	"burned/backend/services"
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type AuthHandler struct {
	service        services.UserServiceInterface
	sessionService services.SessionServiceInterface
}

func NewAuthHandler(s services.UserServiceInterface, ss services.SessionServiceInterface) *AuthHandler {
	return &AuthHandler{
		service:        s,
		sessionService: ss,
	}
}

func getGoogleOAuthConfig() *oauth2.Config {
	redirectURL := os.Getenv("GOOGLE_REDIRECT_URL")
	if redirectURL == "" {
		redirectURL = "http://localhost:8080/auth/google/callback"
	}
	return &oauth2.Config{
		RedirectURL:  redirectURL,
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
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

	// Generar sesión en Redis
	token, err := handler.sessionService.CreateSession(c.Request.Context(), user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": "error al iniciar sesión en Redis"})
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

	// Generar sesión en Redis
	token, err := handler.sessionService.CreateSession(c.Request.Context(), user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": "Error al generar la sesión en Redis"})
		return
	}

	c.JSON(http.StatusOK, dtos.AuthResponse{
		Token: token,
		User:  user,
	})
}
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	googleOauthConfig := getGoogleOAuthConfig()

	// Configurar la URL del Frontend (A donde enviamos al usuario después)
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000" // Fallback para desarrollo local
	}

	// 1. Intercambiamos el código por el token de Google
	code := c.Query("code")
	token, err := googleOauthConfig.Exchange(c.Request.Context(), code)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=auth_failed")
		return
	}

	// 2. Obtener datos del perfil de Google
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

	// 3. Lógica de BD: Login o Registro
	userResponse, err := h.service.LoginOrRegisterGoogle(googleUser)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=db_error")
		return
	}

	// 4. Generar sesión en Redis
	sessionToken, err := h.sessionService.CreateSession(c.Request.Context(), userResponse.ID, userResponse.Email, userResponse.Role)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?error=session_error")
		return
	}

	// 5. ÉXITO: Redirigimos al frontend con el token de sesión
	c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/login?token="+sessionToken)
}

func (handler *AuthHandler) Logout(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) == 2 && tokenParts[0] == "Bearer" {
			_ = handler.sessionService.DeleteSession(c.Request.Context(), tokenParts[1])
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sesión cerrada exitosamente"})
}

func (handler *AuthHandler) GoogleLogin(c *gin.Context) {
	googleOauthConfig := getGoogleOAuthConfig()
	state := "random-state-string"
	url := googleOauthConfig.AuthCodeURL(state)
	c.Redirect(http.StatusTemporaryRedirect, url)
}
