package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents the user model
type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Name      string    `gorm:"not null" json:"name"`
	Username  string    `gorm:"uniqueIndex" json:"username,omitempty"`
	AvatarURL string    `json:"avatar_url,omitempty"`
	
	// Auth0 specific fields
	Auth0ID   string `gorm:"uniqueIndex;not null" json:"auth0_id"`
	Auth0Sub  string `gorm:"uniqueIndex;not null" json:"auth0_sub"`
	
	// User preferences
	Preferences UserPreferences `gorm:"embedded" json:"preferences"`
	
	// Subscription/Plan information
	Plan         SubscriptionPlan `gorm:"default:'free'" json:"plan"`
	PlanExpiry   *time.Time       `json:"plan_expiry,omitempty"`
	IsActive     bool             `gorm:"default:true" json:"is_active"`
	
	// Usage statistics
	TotalVideos     int `gorm:"default:0" json:"total_videos"`
	TotalClips      int `gorm:"default:0" json:"total_clips"`
	TotalPlaylists  int `gorm:"default:0" json:"total_playlists"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// UserPreferences represents user-specific preferences
type UserPreferences struct {
	Theme            string `gorm:"default:'light'" json:"theme"` // light, dark, auto
	Language         string `gorm:"default:'en'" json:"language"`
	TimeFormat       string `gorm:"default:'12h'" json:"time_format"` // 12h, 24h
	DefaultVideoQuality string `gorm:"default:'720p'" json:"default_video_quality"`
	AutoSaveClips    bool   `gorm:"default:true" json:"auto_save_clips"`
	ShowTimestamps   bool   `gorm:"default:true" json:"show_timestamps"`
	NotificationsEnabled bool `gorm:"default:true" json:"notifications_enabled"`
}

// SubscriptionPlan represents different subscription tiers
type SubscriptionPlan string

const (
	PlanFree     SubscriptionPlan = "free"
	PlanBasic    SubscriptionPlan = "basic"
	PlanPro      SubscriptionPlan = "pro"
	PlanEnterprise SubscriptionPlan = "enterprise"
)

// UserSession represents user authentication sessions
type UserSession struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Token     string    `gorm:"not null" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// BeforeCreate will set a UUID rather than numeric ID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// BeforeCreate will set a UUID rather than numeric ID
func (us *UserSession) BeforeCreate(tx *gorm.DB) error {
	if us.ID == uuid.Nil {
		us.ID = uuid.New()
	}
	return nil
}

// GetPlanLimits returns the limits for the user's current plan
func (u *User) GetPlanLimits() PlanLimits {
	return GetPlanLimits(u.Plan)
}

// PlanLimits represents the limits for each subscription plan
type PlanLimits struct {
	MaxVideos        int
	MaxClipsPerVideo int
	MaxPlaylists     int
	MaxSharedPlaylists int
	StorageGB        int
	AdvancedFeatures bool
}

// GetPlanLimits returns limits for a specific plan
func GetPlanLimits(plan SubscriptionPlan) PlanLimits {
	switch plan {
	case PlanFree:
		return PlanLimits{
			MaxVideos:        10,
			MaxClipsPerVideo: 5,
			MaxPlaylists:     3,
			MaxSharedPlaylists: 1,
			StorageGB:        1,
			AdvancedFeatures: false,
		}
	case PlanBasic:
		return PlanLimits{
			MaxVideos:        50,
			MaxClipsPerVideo: 20,
			MaxPlaylists:     10,
			MaxSharedPlaylists: 5,
			StorageGB:        10,
			AdvancedFeatures: false,
		}
	case PlanPro:
		return PlanLimits{
			MaxVideos:        500,
			MaxClipsPerVideo: 100,
			MaxPlaylists:     50,
			MaxSharedPlaylists: 25,
			StorageGB:        100,
			AdvancedFeatures: true,
		}
	case PlanEnterprise:
		return PlanLimits{
			MaxVideos:        -1, // Unlimited
			MaxClipsPerVideo: -1,
			MaxPlaylists:     -1,
			MaxSharedPlaylists: -1,
			StorageGB:        -1,
			AdvancedFeatures: true,
		}
	default:
		return GetPlanLimits(PlanFree)
	}
}

// CanCreateVideo checks if user can create more videos based on their plan
func (u *User) CanCreateVideo() bool {
	limits := u.GetPlanLimits()
	return limits.MaxVideos == -1 || u.TotalVideos < limits.MaxVideos
}

// CanCreatePlaylist checks if user can create more playlists based on their plan
func (u *User) CanCreatePlaylist() bool {
	limits := u.GetPlanLimits()
	return limits.MaxPlaylists == -1 || u.TotalPlaylists < limits.MaxPlaylists
}
