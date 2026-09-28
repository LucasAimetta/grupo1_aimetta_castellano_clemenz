package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CheckUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, ok := c.Get("role")
		if !ok || role != "user" {
			c.JSON(http.StatusForbidden, gin.H{"error": "user only"})
			c.Abort()
			return
		}
		c.Next()
	}
}
