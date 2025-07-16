package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/auth"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/middleware"
)

type TimestampsHandlers struct {
	db *database.Database
}

func NewTimestampHandlers(db *database.Database) *TimestampsHandlers {
	return &TimestampsHandlers{
		db: db,
	}
}

type Timestamp struct {
	ID        string    `json:"id" bun:"id,pk"`
	VideoID   string    `json:"video_id" bun:"video_id,notnull"`
	UserID    string    `json:"user_id" bun:"user_id,notnull"`
	Timestamp float64   `json:"timestamp" bun:"timestamp,notnull"`
	Title     string    `json:"title"`
	Note      string    `json:"note"`
	Tags      []string  `json:"tags" bun:"tags,array"`
	CreatedAt time.Time `json:"created_at" bun:"created_at,notnull"`
	UpdatedAt time.Time `json:"updated_at" bun:"updated_at,notnull"`
	DeletedAt time.Time `json:"-" bun:"deleted_at,soft_delete,nullzero"`
}

type CreateTimestampRequest struct {
	VideoID   string   `json:"video_id" binding:"required"`
	Timestamp float64  `json:"timestamp" binding:"required"`
	Title     string   `json:"title"`
	Note      string   `json:"note"`
	Tags      []string `json:"tags"`
}

func (t *TimestampsHandlers) CreateTimestamp(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	var req CreateTimestampRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	timestamp := Timestamp{
		ID:        uuid.NewString(),
		VideoID:   req.VideoID,
		UserID:    userID,
		Timestamp: req.Timestamp,
		Title:     req.Title,
		Note:      req.Note,
		Tags:      req.Tags,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	ctx := context.Background()

	if _, err := t.db.DB.NewInsert().Model(&timestamp).Exec(ctx); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_INSERT_ERROR", "Failed to save timestamp", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"timestamp": timestamp,
	})
}

func (t *TimestampsHandlers) GetTimestamps(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	videoID := c.Param("videoId")
	if videoID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_VIDEO_ID", "Video ID is required", nil)
		return
	}

	timestamps := []Timestamp{}

	middleware.RespondWithOK(c, gin.H{
		"timestamps": timestamps,
		"video_id":   videoID,
		"user_id":    userID,
	})
}

func (t *TimestampsHandlers) DeleteTimestamp(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	timestampID := c.Param("id")
	if timestampID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_TIMESTAMP_ID", "Timestamp ID is required", nil)
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message":      "Timestamp deleted successfully",
		"timestamp_id": timestampID,
		"user_id":      userID,
	})
}
