package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shubhamku044/ytclipper/internal/auth"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/middleware"
)

type UserInfo struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name,omitempty"`
	CreatedAt string `json:"created_at,omitempty"`
}

// Timestamp represents a video timestamp
// type Timestamp struct {
// 	ID        string    `json:"id"`
// 	VideoID   string    `json:"video_id"`
// 	UserID    string    `json:"user_id"`
// 	Timestamp float64   `json:"timestamp"`
// 	Title     string    `json:"title"`
// 	Note      string    `json:"note"`
// 	Tags      []string  `json:"tags"`
// 	CreatedAt time.Time `json:"created_at"`
// 	UpdatedAt time.Time `json:"updated_at"`
// }

// // CreateTimestampRequest represents the request body for creating a timestamp
// type CreateTimestampRequest struct {
// 	VideoID    string   `json:"video_id" binding:"required"`
// 	VideoTitle string   `json:"video_title"`
// 	Timestamp  float64  `json:"timestamp" binding:"required"`
// 	Title      string   `json:"title"`
// 	Note       string   `json:"note"`
// 	Tags       []string `json:"tags"`
// }

// HealthCheck returns the health status of the service

func HealthCheck(c *gin.Context) {
	middleware.RespondWithOK(c, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"service":   "ytclipper-backend",
		"version":   "1.0.0",
	})
}

func DBHealthCheck(db *database.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		status := "healthy"
		var err error

		if db != nil && db.DB != nil {
			err = db.Ping(ctx)
			if err != nil {
				status = "unhealthy"
			}
		} else {
			status = "disconnected"
		}

		if err != nil {
			middleware.RespondWithError(c, http.StatusServiceUnavailable, "DB_UNHEALTHY", "Database is not healthy", gin.H{
				"error": err.Error(),
			})
			return
		}

		middleware.RespondWithOK(c, gin.H{
			"status":    status,
			"timestamp": time.Now().UTC(),
			"database":  "postgresql",
		})
	}
}

func VerifyToken(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found in token", nil)
		return
	}

	claims, exists := auth.GetClaims(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_CLAIMS", "Token claims not found", nil)
		return
	}

	user := UserInfo{
		ID:        userID,
		Email:     claims.RegisteredClaims.Subject,
		Name:      "",
		CreatedAt: claims.RegisteredClaims.IssuedAt.Time.Format(time.RFC3339),
	}

	middleware.RespondWithOK(c, gin.H{
		"user":  user,
		"valid": true,
	})
}

func GetUserProfile(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found in token", nil)
		return
	}

	claims, exists := auth.GetClaims(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_CLAIMS", "Token claims not found", nil)
		return
	}

	user := UserInfo{
		ID:        userID,
		Email:     claims.RegisteredClaims.Subject,
		Name:      "",
		CreatedAt: claims.RegisteredClaims.IssuedAt.Time.Format(time.RFC3339),
	}

	middleware.RespondWithOK(c, gin.H{
		"user": user,
		"token_info": gin.H{
			"issued_at":  claims.RegisteredClaims.IssuedAt.Time,
			"expires_at": claims.RegisteredClaims.ExpiresAt.Time,
			"issuer":     claims.RegisteredClaims.Issuer,
		},
	})
}

func GetSession(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found in token", nil)
		return
	}

	claims, exists := auth.GetClaims(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_CLAIMS", "Token claims not found", nil)
		return
	}

	now := time.Now().UTC()

	sessionInfo := gin.H{
		"authenticated": true,
		"user_id":       userID,
		"email":         claims.RegisteredClaims.Subject,
		"session_start": claims.RegisteredClaims.IssuedAt.Time.Format(time.RFC3339),
		"expires_at":    claims.RegisteredClaims.ExpiresAt.Time.Format(time.RFC3339),
		"current_time":  now.Format(time.RFC3339),
		"token_valid":   claims.RegisteredClaims.ExpiresAt.Time.After(now),
		"issuer":        claims.RegisteredClaims.Issuer,
		"audience":      claims.RegisteredClaims.Audience,
	}

	middleware.RespondWithOK(c, gin.H{
		"session": sessionInfo,
		"message": "Session is active and user is authenticated",
	})
}

func generateID() string {
	return time.Now().Format("20060102150405") + "_" + time.Now().Format("000")
}
