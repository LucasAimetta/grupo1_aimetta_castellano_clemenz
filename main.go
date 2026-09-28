package main

import (
	"burned/backend/database"
	"burned/backend/handlers"
	"burned/backend/middlewares"
	"burned/backend/repositories"
	"burned/backend/services"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

var (
	router             *gin.Engine
	SavedRecipeHandler *handlers.SavedRecipeHandler
	RecipeHandler      *handlers.RecipeHandler
	UserHandler        *handlers.UserHandler
	AuthHandler        *handlers.AuthHandler
	RatingHandler      *handlers.RatingHandler
	CommentHandler     *handlers.CommentHandler
)

func main() {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Aviso: No se encontró el archivo .env, usando variables de entorno de Render")
	}
	router = gin.Default()

	// CONFIGURACIÓN DE CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",   // Para tus pruebas locales (Vite)
			os.Getenv("FRONTEND_URL"), // Tu URL real de producción
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	dependencies()
	mappingRoutes()
	log.Println("Servidor iniciado en http://localhost:8080")
	router.Run(":8080")

}

func dependencies() {
	var db database.DB

	var (
		userRepo        repositories.UserRepositoryInterface
		recipeRepo      repositories.RecipeRepositoryInterface
		savedRecipeRepo repositories.SavedRecipeRepositoryInterface
		ratingRepo      repositories.RatingRepositoryInterface
		commentRepo     repositories.CommentRepositoryInterface
	)

	var (
		userService        services.UserServiceInterface
		recipeService      services.RecipeServiceInterface
		savedRecipeService services.SavedRecipeServiceInterface
		ratingService      services.RatingServiceInterface
		commentService     services.CommentServiceInterface
	)

	// Conexión a base de datos
	db = database.NewMongoDB()

	// Repositorios
	userRepo = repositories.NewUserRepository(db)
	savedRecipeRepo = repositories.NewSavedRecipeRepository(db)
	recipeRepo = repositories.NewRecipeRepository(db, savedRecipeRepo)
	ratingRepo = repositories.NewRatingRepository(db)
	commentRepo = repositories.NewCommentRepository(db)
	// Servicios
	userService = services.NewUserService(userRepo)
	recipeService = services.NewRecipeService(recipeRepo, userRepo)
	savedRecipeService = services.NewSavedRecipeService(savedRecipeRepo, recipeRepo)
	ratingService = services.NewRatingService(ratingRepo, recipeRepo)
	commentService = services.NewCommentService(commentRepo, userRepo, recipeRepo)
	// Handlers
	AuthHandler = handlers.NewAuthHandler(userService)
	RecipeHandler = handlers.NewRecipeHandler(recipeService)
	SavedRecipeHandler = handlers.NewSavedRecipeHandler(savedRecipeService)
	UserHandler = handlers.NewUserHandler(userService)
	RatingHandler = handlers.NewRatingHandler(ratingService)
	CommentHandler = handlers.NewCommentHandler(commentService)
}

func mappingRoutes() {
	// --- RUTAS PÚBLICAS
	router.POST("/login", AuthHandler.LogIn)
	router.POST("/register", AuthHandler.Register)

	router.POST("/get-rate/:id", RatingHandler.GetRatingByRecipe)
	router.GET("/auth/google/login", AuthHandler.GoogleLogin)
	router.GET("/auth/google/callback", AuthHandler.GoogleCallback)

	recipes := router.Group("/recipes")
	{
		recipes.GET("/search", RecipeHandler.QuickSearch)
		recipes.POST("/search", RecipeHandler.GetRecipes)
		recipes.GET("/top", RecipeHandler.GetTopRecipes)
		recipes.GET("/count/:id", SavedRecipeHandler.GetSavedCountByRecipe)
		recipes.GET("", RecipeHandler.GetAll)
		recipes.GET("/:id", RecipeHandler.GetRecipeById)
		recipes.GET("/comments/:recipeId", CommentHandler.GetCommentsByRecipe)
	}

	// --- RUTAS PRIVADAS
	priv := router.Group("/")
	priv.Use(middlewares.AuthMiddleware())
	{

		priv.PUT("/user", UserHandler.UpdateUser)
		priv.PUT("/user/password", UserHandler.UpdatePassword)
		priv.DELETE("/user", UserHandler.DeleteUser)
		priv.GET("/user/me", UserHandler.GetUserById)

		priv.POST("/recipes", RecipeHandler.CreateRecipe)
		priv.PUT("/recipes/:id", RecipeHandler.UpdateRecipe)
		priv.DELETE("/recipes/:id", RecipeHandler.DeleteRecipe)
		priv.GET("/user/recipes", RecipeHandler.GetRecipesByUser)

		priv.POST("/saved-recipes", SavedRecipeHandler.SavedRecipe)
		priv.DELETE("/saved-recipes/:id", SavedRecipeHandler.UnsavedRecipe)
		priv.GET("/saved-recipes", SavedRecipeHandler.GetRecipesSavedByUser)
		priv.POST("/rate-recipe/:id", RatingHandler.RateRecipe)

		priv.DELETE("/comments/:id", CommentHandler.DeleteComment)
		priv.GET("/comments/:id", CommentHandler.GetCommentById)
		priv.POST("/comments", CommentHandler.CreateComment)
	}
}
