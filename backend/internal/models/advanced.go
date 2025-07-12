package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Collection represents a collection of playlists or videos
type Collection struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Collection info
	Name        string `gorm:"not null" json:"name"`
	Description string `json:"description"`
	Type        CollectionType `gorm:"default:'mixed'" json:"type"`
	
	// Collection settings
	Visibility   CollectionVisibility `gorm:"default:'private'" json:"visibility"`
	IsSystemCollection bool `gorm:"default:false" json:"is_system_collection"`
	
	// Metadata
	ThumbnailURL string `json:"thumbnail_url"`
	Color        string `gorm:"default:'#3B82F6'" json:"color"`
	
	// Statistics
	ItemCount int `gorm:"default:0" json:"item_count"`
	ViewCount int `gorm:"default:0" json:"view_count"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// CollectionType represents the type of collection
type CollectionType string

const (
	CollectionTypeVideos    CollectionType = "videos"
	CollectionTypePlaylists CollectionType = "playlists"
	CollectionTypeMixed     CollectionType = "mixed"
)

// CollectionVisibility represents who can access the collection
type CollectionVisibility string

const (
	CollectionVisibilityPrivate CollectionVisibility = "private"
	CollectionVisibilityPublic  CollectionVisibility = "public"
	CollectionVisibilityShared  CollectionVisibility = "shared"
)

// CollectionItem represents items in a collection
type CollectionItem struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	CollectionID uuid.UUID `gorm:"type:uuid;not null" json:"collection_id"`
	
	// Item references (one of these will be populated)
	VideoID    *uuid.UUID `gorm:"type:uuid" json:"video_id"`
	PlaylistID *uuid.UUID `gorm:"type:uuid" json:"playlist_id"`
	
	// Ordering and metadata
	Position int    `gorm:"default:0" json:"position"`
	Note     string `json:"note"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// SearchHistory represents user's search history
type SearchHistory struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Search details
	Query      string      `gorm:"not null" json:"query"`
	SearchType SearchType  `gorm:"default:'all'" json:"search_type"`
	Filters    string      `json:"filters"` // JSON string of applied filters
	
	// Results
	ResultCount int `gorm:"default:0" json:"result_count"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
}

// SearchType represents different types of searches
type SearchType string

const (
	SearchTypeAll       SearchType = "all"
	SearchTypeVideos    SearchType = "videos"
	SearchTypeClips     SearchType = "clips"
	SearchTypePlaylists SearchType = "playlists"
	SearchTypeTags      SearchType = "tags"
)

// Activity represents user activity logs
type Activity struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Activity details
	Type        ActivityType `gorm:"not null" json:"type"`
	Description string       `json:"description"`
	MetaData    string       `json:"meta_data"` // JSON string with additional data
	
	// Context
	IPAddress string `json:"ip_address"`
	UserAgent string `json:"user_agent"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
}

// ActivityType represents different types of user activities
type ActivityType string

const (
	ActivityTypeVideoAdded       ActivityType = "video_added"
	ActivityTypeVideoUpdated     ActivityType = "video_updated"
	ActivityTypeVideoDeleted     ActivityType = "video_deleted"
	ActivityTypeClipCreated      ActivityType = "clip_created"
	ActivityTypeClipUpdated      ActivityType = "clip_updated"
	ActivityTypeClipDeleted      ActivityType = "clip_deleted"
	ActivityTypePlaylistCreated  ActivityType = "playlist_created"
	ActivityTypePlaylistUpdated  ActivityType = "playlist_updated"
	ActivityTypePlaylistDeleted  ActivityType = "playlist_deleted"
	ActivityTypePlaylistShared   ActivityType = "playlist_shared"
	ActivityTypeVideoFavorited   ActivityType = "video_favorited"
	ActivityTypeVideoUnfavorited ActivityType = "video_unfavorited"
	ActivityTypeLogin            ActivityType = "login"
	ActivityTypeLogout           ActivityType = "logout"
	ActivityTypeProfileUpdated   ActivityType = "profile_updated"
	ActivityTypeSearchPerformed  ActivityType = "search_performed"
	ActivityTypeExport           ActivityType = "export"
	ActivityTypeImport           ActivityType = "import"
)

// Export represents export jobs
type Export struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Export details
	Type        ExportType   `gorm:"not null" json:"type"`
	Format      ExportFormat `gorm:"not null" json:"format"`
	Status      ExportStatus `gorm:"default:'pending'" json:"status"`
	
	// Export configuration
	Config   string `json:"config"`   // JSON string with export configuration
	FilePath string `json:"file_path"` // Path to the exported file
	FileSize int64  `json:"file_size"`
	
	// Progress
	Progress    float64 `gorm:"default:0" json:"progress"`      // Percentage (0-100)
	ErrorMessage string `json:"error_message"`
	
	// Timestamps
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	CompletedAt *time.Time `json:"completed_at"`
	ExpiresAt   *time.Time `json:"expires_at"`
}

// ExportType represents what is being exported
type ExportType string

const (
	ExportTypeAllData    ExportType = "all_data"
	ExportTypeVideos     ExportType = "videos"
	ExportTypeClips      ExportType = "clips"
	ExportTypePlaylists  ExportType = "playlists"
	ExportTypePlaylist   ExportType = "playlist"
	ExportTypeVideo      ExportType = "video"
)

// ExportFormat represents the format of the export
type ExportFormat string

const (
	ExportFormatJSON ExportFormat = "json"
	ExportFormatCSV  ExportFormat = "csv"
	ExportFormatXML  ExportFormat = "xml"
	ExportFormatHTML ExportFormat = "html"
	ExportFormatPDF  ExportFormat = "pdf"
)

// ExportStatus represents the status of an export job
type ExportStatus string

const (
	ExportStatusPending    ExportStatus = "pending"
	ExportStatusProcessing ExportStatus = "processing"
	ExportStatusCompleted  ExportStatus = "completed"
	ExportStatusFailed     ExportStatus = "failed"
	ExportStatusCancelled  ExportStatus = "cancelled"
)

// BeforeCreate hooks for UUID generation
func (c *Collection) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

func (ci *CollectionItem) BeforeCreate(tx *gorm.DB) error {
	if ci.ID == uuid.Nil {
		ci.ID = uuid.New()
	}
	return nil
}

func (sh *SearchHistory) BeforeCreate(tx *gorm.DB) error {
	if sh.ID == uuid.Nil {
		sh.ID = uuid.New()
	}
	return nil
}

func (a *Activity) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

func (e *Export) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}
