package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/auth"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/uptrace/bun"
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

type DeleteMultipleRequest struct {
	IDs []string `json:"ids" binding:"required"`
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

func (t *TimestampsHandlers) GetTimestampsByVideoID(c *gin.Context) {
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
	err := t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Order("timestamp ASC").
		Scan(context.Background())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"timestamps": timestamps,
		"video_id":   videoID,
	})
}

func (t *TimestampsHandlers) GetAllTimestamps(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	var timestamps []Timestamp
	err := t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Scan(context.Background())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{"timestamps": timestamps})
}

func (t *TimestampsHandlers) GetAllVideosWithTimestamps(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	type VideoInfo struct {
		VideoID string    `json:"video_id"`
		Latest  time.Time `json:"latest_timestamp"`
		Count   int       `json:"count"`
	}

	var videos []VideoInfo
	err := t.db.DB.NewSelect().
		Table("timestamps").
		Column("video_id").
		ColumnExpr("MAX(created_at) AS latest").
		ColumnExpr("COUNT(*) AS count").
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Group("video_id").
		OrderExpr("latest DESC").
		Scan(context.Background(), &videos)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch video list", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{"videos": videos})
}

func (t *TimestampsHandlers) GetRecentTimestamps(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	limit := 5
	if param := c.Query("limit"); param != "" {
		if parsed, err := strconv.Atoi(param); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	var timestamps []Timestamp
	err := t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		OrderExpr("created_at DESC").
		Limit(limit).
		Scan(context.Background())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch recent timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{"recent_timestamps": timestamps})
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

	now := time.Now().UTC()
	_, err := t.db.DB.NewUpdate().
		Table("timestamps").
		Set("deleted_at = ?", now).
		Where("id = ? AND user_id = ?", timestampID, userID).
		Exec(context.Background())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_DELETE_ERROR", "Failed to delete timestamp", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{"message": "Timestamp deleted successfully"})
}

func (t *TimestampsHandlers) DeleteMultipleTimestamps(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	var req DeleteMultipleRequest
	if err := c.ShouldBindJSON(&req); err != nil || len(req.IDs) == 0 {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "At least one timestamp ID must be provided", gin.H{
			"error": err.Error(),
		})
		return
	}

	now := time.Now().UTC()
	_, err := t.db.DB.NewUpdate().
		Table("timestamps").
		Set("deleted_at = ?", now).
		Where("id IN (?) AND user_id = ?", bun.In(req.IDs), userID).
		Exec(context.Background())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_DELETE_ERROR", "Failed to delete timestamps", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Timestamps deleted successfully",
		"count":   len(req.IDs),
	})
}
