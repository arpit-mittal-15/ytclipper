package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Tag represents a tag that can be applied to videos, clips, or playlists
type Tag struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Name   string    `gorm:"not null" json:"name"`
	Color  string    `gorm:"default:'#3B82F6'" json:"color"` // Hex color code
	
	// Usage statistics
	UsageCount int `gorm:"default:0" json:"usage_count"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// Clip represents a timestamped clip/note from a video
type Clip struct {
	ID      uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	VideoID uuid.UUID `gorm:"type:uuid;not null" json:"video_id"`
	UserID  uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Clip timing
	StartTime float64 `gorm:"not null" json:"start_time"` // In seconds
	EndTime   float64 `json:"end_time"`                  // In seconds, optional
	
	// Clip content
	Title       string `gorm:"not null" json:"title"`
	Description string `json:"description"`
	Content     string `json:"content"` // The actual transcribed content
	
	// Clip metadata
	Type        ClipType `gorm:"default:'note'" json:"type"`
	Importance  int      `gorm:"default:3" json:"importance"` // 1-5 scale
	IsPublic    bool     `gorm:"default:false" json:"is_public"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// ClipType represents different types of clips
type ClipType string

const (
	ClipTypeNote      ClipType = "note"
	ClipTypeHighlight ClipType = "highlight"
	ClipTypeBookmark  ClipType = "bookmark"
	ClipTypeQuestion  ClipType = "question"
	ClipTypeAction    ClipType = "action"
	ClipTypeQuote     ClipType = "quote"
)

// Playlist represents a collection of videos
type Playlist struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Playlist info
	Name        string `gorm:"not null" json:"name"`
	Description string `json:"description"`
	
	// Playlist settings
	Visibility   PlaylistVisibility `gorm:"default:'private'" json:"visibility"`
	IsCollaborative bool            `gorm:"default:false" json:"is_collaborative"`
	
	// Metadata
	ThumbnailURL string `json:"thumbnail_url"`
	Color        string `gorm:"default:'#3B82F6'" json:"color"`
	
	// Statistics
	VideoCount int `gorm:"default:0" json:"video_count"`
	ViewCount  int `gorm:"default:0" json:"view_count"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// PlaylistVisibility represents who can access the playlist
type PlaylistVisibility string

const (
	PlaylistVisibilityPrivate PlaylistVisibility = "private"
	PlaylistVisibilityPublic  PlaylistVisibility = "public"
	PlaylistVisibilityShared  PlaylistVisibility = "shared"
)

// Favorite represents a user's favorite video
type Favorite struct {
	ID      uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID  uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	VideoID uuid.UUID `gorm:"type:uuid;not null" json:"video_id"`
	
	// Favorite metadata
	Note string `json:"note"` // Optional note about why it's favorited
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// SharedPlaylist represents shared access to a playlist
type SharedPlaylist struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	PlaylistID uuid.UUID `gorm:"type:uuid;not null" json:"playlist_id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`        // User who shared
	SharedWith string    `gorm:"not null" json:"shared_with"`              // Email or user ID
	
	// Sharing settings
	Permission SharedPermission `gorm:"default:'view'" json:"permission"`
	ExpiresAt  *time.Time       `json:"expires_at"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// SharedPermission represents different levels of shared access
type SharedPermission string

const (
	SharedPermissionView SharedPermission = "view"
	SharedPermissionEdit SharedPermission = "edit"
	SharedPermissionAdmin SharedPermission = "admin"
)

// BeforeCreate hooks for UUID generation
func (t *Tag) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

func (c *Clip) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

func (p *Playlist) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

func (f *Favorite) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}

func (sp *SharedPlaylist) BeforeCreate(tx *gorm.DB) error {
	if sp.ID == uuid.Nil {
		sp.ID = uuid.New()
	}
	return nil
}
