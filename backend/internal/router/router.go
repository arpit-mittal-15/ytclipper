// Package router
package router

import (
	"net/http"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/shubhamku044/ytclipper/internal/auth"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/handlers"
	"github.com/shubhamku044/ytclipper/internal/middleware"
)

func SetupRouter(db *database.Database, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return strings.HasPrefix(origin, "chrome-extension://") ||
				strings.HasPrefix(origin, "http://localhost:5173") ||
				strings.HasPrefix(origin, "https://app.ytclipper.com") ||
				strings.HasPrefix(origin, "https://app-staging.ytclipper.com")
		},
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"https://app.ytclipper.com",
			"https://app-staging.ytclipper.com",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))
	r.Use(middleware.ErrorHandler())
	r.Use(middleware.ResponseFormatter())
	r.Use(middleware.RequestLogger())

	jwtService := auth.NewJWTService(&cfg.JWT, &cfg.Auth, db)
	emailService := auth.NewEmailService()
	googleService := auth.NewGoogleOAuthService(&cfg.Google, &cfg.Auth, jwtService, db, &cfg.Server)
	authMiddleware := auth.NewAuthMiddleware(jwtService, &cfg.Auth, db)
	authHandlers := auth.NewAuthHandlers(googleService, authMiddleware, jwtService, emailService, db)
	timestampHandlers := handlers.NewTimestampHandlers(db, &cfg.OpenAI)

	r.NoRoute(func(c *gin.Context) {
		middleware.RespondWithError(c, http.StatusNotFound, "NOT_FOUND", "The requested resource could not be found", gin.H{
			"documentation": "/api/docs",
		})
	})

	r.GET("/health", handlers.HealthCheck)
	r.GET("/db-health", handlers.DBHealthCheck(db))

	authHandlers.SetupAuthRoutes(r)

	r.GET("/", func(c *gin.Context) {
		middleware.RespondWithOK(c, gin.H{
			"name":        "ytclipper API",
			"description": "A modern screen capture and annotation service",
			"version":     "1.0.0",
			"status":      "running",
			"endpoints": map[string]string{
				"health":    "/health",
				"db_health": "/db-health",
				"api_v1":    "/api/v1",
			},
			"repository": "https://github.com/shubhamku044/ytclipper",
		})
	})

	v1 := r.Group("/api/v1")
	{
		v1.GET("/", func(c *gin.Context) {
			middleware.RespondWithOK(c, gin.H{
				"name":        "ytclipper API",
				"description": "A modern screen capture and annotation service",
				"version":     "1.0.0",
				"status":      "running",
				"endpoints": map[string]string{
					"health":    "/api/v1/health",
					"db_health": "/api/v1/db-health",
				},
			})
		})

		v1.GET("/health", handlers.HealthCheck)
		v1.GET("/db-health", handlers.DBHealthCheck(db))

		authRoutes := v1.Group("/auth")
		{
			authRoutes.GET("/user", authHandlers.GetCurrentUserHandler())
			authRoutes.GET("/me", authMiddleware.RequireAuth(), authHandlers.GetCurrentUserHandler())
			authRoutes.GET("/session", authMiddleware.RequireAuth(), handlers.GetSession)
			authRoutes.POST("/verify", authMiddleware.RequireAuth(), handlers.VerifyToken)
			authRoutes.GET("/profile", authMiddleware.RequireAuth(), handlers.GetUserProfile)
		}

		protected := v1.Group("")
		protected.Use(authMiddleware.RequireAuth())
		{
			protected.GET("/profile", handlers.GetUserProfile)

			timestampRoutes := protected.Group("/timestamps")
			{
				timestampRoutes.POST("", timestampHandlers.CreateTimestamp)
				timestampRoutes.GET("", timestampHandlers.GetAllTimestamps)
				timestampRoutes.GET("/:videoId", timestampHandlers.GetTimestampsByVideoID)
				timestampRoutes.DELETE("/:id", timestampHandlers.DeleteTimestamp)
				timestampRoutes.POST("/delete-many", timestampHandlers.DeleteMultipleTimestamps)
				timestampRoutes.GET("/videos", timestampHandlers.GetAllVideosWithTimestamps)
				timestampRoutes.GET("/recent", timestampHandlers.GetRecentTimestamps)
				timestampRoutes.POST("/backfill-embeddings-async", timestampHandlers.BackfillEmbeddingsAsync)
				timestampRoutes.GET("/embedding-status", timestampHandlers.GetEmbeddingStatus)
				timestampRoutes.POST("/search", timestampHandlers.SearchTimestamps)
				timestampRoutes.POST("/summary", timestampHandlers.GenerateSummary)
				timestampRoutes.POST("/question", timestampHandlers.AnswerQuestion)
				timestampRoutes.POST("/tags", timestampHandlers.SearchTags)
			}
		}
	}

	return r
}
