package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Video represents a YouTube video that has been clipped
type Video struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// YouTube video information
	YouTubeID   string `gorm:"not null;index" json:"youtube_id"`
	Title       string `gorm:"not null" json:"title"`
	Description string `json:"description"`
	
	// Video metadata
	Duration      int64  `json:"duration"`        // Duration in seconds
	ThumbnailURL  string `json:"thumbnail_url"`
	ChannelID     string `json:"channel_id"`
	ChannelName   string `json:"channel_name"`
	PublishedAt   *time.Time `json:"published_at"`
	
	// Video categorization
	Category    string `json:"category"`
	Language    string `json:"language"`
	
	// Status and visibility
	Status      VideoStatus `gorm:"default:'active'" json:"status"`
	Visibility  VideoVisibility `gorm:"default:'private'" json:"visibility"`
	IsProcessed bool        `gorm:"default:false" json:"is_processed"`
	
	// Statistics
	ViewCount     int64 `gorm:"default:0" json:"view_count"`
	LikeCount     int64 `gorm:"default:0" json:"like_count"`
	CommentCount  int64 `gorm:"default:0" json:"comment_count"`
	ClipCount     int   `gorm:"default:0" json:"clip_count"`
	
	// User interactions
	IsFavorite    bool      `gorm:"default:false" json:"is_favorite"`
	LastWatchedAt *time.Time `json:"last_watched_at"`
	WatchProgress float64   `gorm:"default:0" json:"watch_progress"` // Percentage (0-100)
	
	// Metadata
	Notes         string    `json:"notes"`
	CustomTitle   string    `json:"custom_title"`   // User's custom title
	Rating        int       `gorm:"default:0" json:"rating"` // 1-5 stars
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// VideoStatus represents the status of a video
type VideoStatus string

const (
	VideoStatusActive    VideoStatus = "active"
	VideoStatusArchived  VideoStatus = "archived"
	VideoStatusDeleted   VideoStatus = "deleted"
	VideoStatusProcessing VideoStatus = "processing"
	VideoStatusError     VideoStatus = "error"
)

// VideoVisibility represents who can access the video
type VideoVisibility string

const (
	VideoVisibilityPrivate VideoVisibility = "private"
	VideoVisibilityPublic  VideoVisibility = "public"
	VideoVisibilityShared  VideoVisibility = "shared"
)

// VideoTranscript represents the transcript/captions for a video
type VideoTranscript struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	VideoID   uuid.UUID `gorm:"type:uuid;not null" json:"video_id"`
	Language  string    `gorm:"not null" json:"language"`
	Content   string    `gorm:"type:text" json:"content"`
	IsAuto    bool      `gorm:"default:false" json:"is_auto"` // Auto-generated vs manual
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// VideoAnalytics represents analytics data for a video
type VideoAnalytics struct {
	ID       uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	VideoID  uuid.UUID `gorm:"type:uuid;not null" json:"video_id"`
	
	// Engagement metrics
	TotalViews        int64 `gorm:"default:0" json:"total_views"`
	UniqueViews       int64 `gorm:"default:0" json:"unique_views"`
	TotalWatchTime    int64 `gorm:"default:0" json:"total_watch_time"`    // In seconds
	AverageWatchTime  float64 `gorm:"default:0" json:"average_watch_time"` // In seconds
	CompletionRate    float64 `gorm:"default:0" json:"completion_rate"`    // Percentage
	
	// Clip analytics
	ClipsCreated      int   `gorm:"default:0" json:"clips_created"`
	MostClippedStart  int64 `gorm:"default:0" json:"most_clipped_start"`  // Timestamp in seconds
	MostClippedEnd    int64 `gorm:"default:0" json:"most_clipped_end"`    // Timestamp in seconds
	
	// Sharing analytics
	ShareCount        int `gorm:"default:0" json:"share_count"`
	PlaylistAddCount  int `gorm:"default:0" json:"playlist_add_count"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// BeforeCreate will set a UUID rather than numeric ID
func (v *Video) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}

// BeforeCreate will set a UUID rather than numeric ID
func (vt *VideoTranscript) BeforeCreate(tx *gorm.DB) error {
	if vt.ID == uuid.Nil {
		vt.ID = uuid.New()
	}
	return nil
}

// BeforeCreate will set a UUID rather than numeric ID
func (va *VideoAnalytics) BeforeCreate(tx *gorm.DB) error {
	if va.ID == uuid.Nil {
		va.ID = uuid.New()
	}
	return nil
}

// GetDurationFormatted returns formatted duration (HH:MM:SS)
func (v *Video) GetDurationFormatted() string {
	hours := v.Duration / 3600
	minutes := (v.Duration % 3600) / 60
	seconds := v.Duration % 60
	
	if hours > 0 {
		return fmt.Sprintf("%02d:%02d:%02d", hours, minutes, seconds)
	}
	return fmt.Sprintf("%02d:%02d", minutes, seconds)
}

// GetWatchTimeFormatted returns formatted watch progress
func (v *Video) GetWatchTimeFormatted() string {
	watchedSeconds := int64(float64(v.Duration) * (v.WatchProgress / 100))
	return fmt.Sprintf("%s / %s", 
		formatDuration(watchedSeconds), 
		v.GetDurationFormatted())
}

// IsWatched returns true if the video has been watched completely
func (v *Video) IsWatched() bool {
	return v.WatchProgress >= 90.0 // Consider 90% as watched
}

// formatDuration helper function
func formatDuration(seconds int64) string {
	hours := seconds / 3600
	minutes := (seconds % 3600) / 60
	secs := seconds % 60
	
	if hours > 0 {
		return fmt.Sprintf("%02d:%02d:%02d", hours, minutes, secs)
	}
	return fmt.Sprintf("%02d:%02d", minutes, secs)
}
