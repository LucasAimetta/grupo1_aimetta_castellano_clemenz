package middlewares

import (
	"burned/backend/auth"
	"burned/backend/services"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(sessionService services.SessionServiceInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token de autorización requerido"})
			c.Abort()
			return
		}

		// Verifica que el header tenga el formato "Bearer <token>"
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Formato de token inválido"})
			c.Abort()
			return
		}

		tokenString := tokenParts[1]

		// 1. Intentar validar sesión activa en Redis
		session, err := sessionService.GetSession(c.Request.Context(), tokenString)
		if err == nil && session != nil {
			c.Set("user_id", session.UserID)
			c.Set("user_email", session.Email)
			c.Set("user_role", session.Role)
			c.Next()
			return
		}

		// 2. Fallback para tokens JWT legados durante la migración
		claims, jwtErr := auth.ValidateToken(tokenString)
		if jwtErr == nil && claims != nil {
			c.Set("user_id", claims.UserID)
			c.Set("user_email", claims.Email)
			c.Set("user_role", claims.Role)
			c.Next()
			return
		}

		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesión inválida o expirada"})
		c.Abort()
	}
}

