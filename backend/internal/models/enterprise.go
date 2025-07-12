package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Workspace represents a workspace/organization for team collaboration
type Workspace struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	OwnerID uuid.UUID `gorm:"type:uuid;not null" json:"owner_id"`
	
	// Workspace info
	Name        string `gorm:"not null" json:"name"`
	Description string `json:"description"`
	Domain      string `gorm:"uniqueIndex" json:"domain"` // Custom domain like "acme-corp"
	
	// Workspace settings
	Plan        WorkspacePlan `gorm:"default:'team'" json:"plan"`
	PlanExpiry  *time.Time    `json:"plan_expiry"`
	IsActive    bool          `gorm:"default:true" json:"is_active"`
	
	// Branding
	LogoURL     string `json:"logo_url"`
	PrimaryColor string `gorm:"default:'#3B82F6'" json:"primary_color"`
	
	// Usage limits and statistics
	MaxMembers      int `gorm:"default:10" json:"max_members"`
	CurrentMembers  int `gorm:"default:1" json:"current_members"`
	TotalVideos     int `gorm:"default:0" json:"total_videos"`
	TotalStorage    int64 `gorm:"default:0" json:"total_storage"` // in bytes
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// WorkspacePlan represents different workspace subscription tiers
type WorkspacePlan string

const (
	WorkspacePlanTeam       WorkspacePlan = "team"
	WorkspacePlanBusiness   WorkspacePlan = "business"
	WorkspacePlanEnterprise WorkspacePlan = "enterprise"
)

// WorkspaceMember represents membership in a workspace
type WorkspaceMember struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:uuid;not null" json:"workspace_id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Member info
	Role        WorkspaceRole `gorm:"default:'member'" json:"role"`
	InvitedBy   uuid.UUID     `gorm:"type:uuid" json:"invited_by"`
	InvitedAt   time.Time     `json:"invited_at"`
	JoinedAt    *time.Time    `json:"joined_at"`
	
	// Member status
	Status      MemberStatus `gorm:"default:'pending'" json:"status"`
	IsActive    bool         `gorm:"default:true" json:"is_active"`
	
	// Permissions
	Permissions WorkspacePermissions `gorm:"embedded" json:"permissions"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// WorkspaceRole represents different roles in a workspace
type WorkspaceRole string

const (
	WorkspaceRoleOwner     WorkspaceRole = "owner"
	WorkspaceRoleAdmin     WorkspaceRole = "admin"
	WorkspaceRoleModerator WorkspaceRole = "moderator"
	WorkspaceRoleMember    WorkspaceRole = "member"
	WorkspaceRoleViewer    WorkspaceRole = "viewer"
)

// MemberStatus represents the status of a workspace member
type MemberStatus string

const (
	MemberStatusPending  MemberStatus = "pending"
	MemberStatusActive   MemberStatus = "active"
	MemberStatusInactive MemberStatus = "inactive"
	MemberStatusSuspended MemberStatus = "suspended"
)

// WorkspacePermissions represents granular permissions for workspace members
type WorkspacePermissions struct {
	CanCreateVideos    bool `gorm:"default:true" json:"can_create_videos"`
	CanEditVideos      bool `gorm:"default:true" json:"can_edit_videos"`
	CanDeleteVideos    bool `gorm:"default:false" json:"can_delete_videos"`
	CanCreatePlaylists bool `gorm:"default:true" json:"can_create_playlists"`
	CanEditPlaylists   bool `gorm:"default:true" json:"can_edit_playlists"`
	CanDeletePlaylists bool `gorm:"default:false" json:"can_delete_playlists"`
	CanInviteMembers   bool `gorm:"default:false" json:"can_invite_members"`
	CanManageMembers   bool `gorm:"default:false" json:"can_manage_members"`
	CanViewAnalytics   bool `gorm:"default:true" json:"can_view_analytics"`
	CanExportData      bool `gorm:"default:true" json:"can_export_data"`
}

// AIInsight represents AI-generated insights for videos and clips
type AIInsight struct {
	ID       uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID   uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Target resource (one of these will be populated)
	VideoID  *uuid.UUID `gorm:"type:uuid" json:"video_id"`
	ClipID   *uuid.UUID `gorm:"type:uuid" json:"clip_id"`
	PlaylistID *uuid.UUID `gorm:"type:uuid" json:"playlist_id"`
	
	// AI insight details
	Type        AIInsightType `gorm:"not null" json:"type"`
	Title       string        `gorm:"not null" json:"title"`
	Description string        `json:"description"`
	Content     string        `gorm:"type:text" json:"content"`
	
	// AI metadata
	Model       string  `json:"model"`        // AI model used
	Confidence  float64 `json:"confidence"`   // Confidence score 0-1
	ProcessingTime int  `json:"processing_time"` // Time taken in ms
	
	// User interaction
	IsUseful    *bool   `json:"is_useful"`     // User feedback
	UserRating  *int    `json:"user_rating"`   // 1-5 rating
	UserFeedback string `json:"user_feedback"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// AIInsightType represents different types of AI insights
type AIInsightType string

const (
	AIInsightTypeSummary     AIInsightType = "summary"
	AIInsightTypeKeyPoints   AIInsightType = "key_points"
	AIInsightTypeTranscript  AIInsightType = "transcript"
	AIInsightTypeTopics      AIInsightType = "topics"
	AIInsightTypeSentiment   AIInsightType = "sentiment"
	AIInsightTypeLanguage    AIInsightType = "language"
	AIInsightTypeCategory    AIInsightType = "category"
	AIInsightTypeSuggestions AIInsightType = "suggestions"
	AIInsightTypeQuestions   AIInsightType = "questions"
	AIInsightTypeActionItems AIInsightType = "action_items"
)

// Notification represents system notifications for users
type Notification struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	WorkspaceID *uuid.UUID `gorm:"type:uuid" json:"workspace_id"`
	
	// Notification details
	Type        NotificationType `gorm:"not null" json:"type"`
	Title       string           `gorm:"not null" json:"title"`
	Message     string           `gorm:"not null" json:"message"`
	ActionURL   string           `json:"action_url"`
	
	// Notification metadata
	Data        string `json:"data"` // JSON string with additional data
	Priority    NotificationPriority `gorm:"default:'medium'" json:"priority"`
	
	// Status
	IsRead      bool       `gorm:"default:false" json:"is_read"`
	ReadAt      *time.Time `json:"read_at"`
	IsDelivered bool       `gorm:"default:false" json:"is_delivered"`
	DeliveredAt *time.Time `json:"delivered_at"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// NotificationType represents different types of notifications
type NotificationType string

const (
	NotificationTypeVideoProcessed   NotificationType = "video_processed"
	NotificationTypeVideoShared      NotificationType = "video_shared"
	NotificationTypePlaylistShared   NotificationType = "playlist_shared"
	NotificationTypeWorkspaceInvite  NotificationType = "workspace_invite"
	NotificationTypeExportReady      NotificationType = "export_ready"
	NotificationTypeSystemUpdate     NotificationType = "system_update"
	NotificationTypeQuotaWarning     NotificationType = "quota_warning"
	NotificationTypeQuotaExceeded    NotificationType = "quota_exceeded"
	NotificationTypePaymentRequired  NotificationType = "payment_required"
	NotificationTypeSecurityAlert    NotificationType = "security_alert"
	NotificationTypeFeatureUpdate    NotificationType = "feature_update"
)

// NotificationPriority represents the priority level of notifications
type NotificationPriority string

const (
	NotificationPriorityLow    NotificationPriority = "low"
	NotificationPriorityMedium NotificationPriority = "medium"
	NotificationPriorityHigh   NotificationPriority = "high"
	NotificationPriorityUrgent NotificationPriority = "urgent"
)

// Integration represents third-party integrations
type Integration struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	WorkspaceID *uuid.UUID `gorm:"type:uuid" json:"workspace_id"`
	
	// Integration details
	Type        IntegrationType `gorm:"not null" json:"type"`
	Name        string          `gorm:"not null" json:"name"`
	Description string          `json:"description"`
	
	// Integration configuration
	Config      string `gorm:"type:text" json:"config"` // JSON config
	Credentials string `gorm:"type:text" json:"credentials"` // Encrypted credentials
	
	// Status
	IsActive    bool       `gorm:"default:true" json:"is_active"`
	IsConnected bool       `gorm:"default:false" json:"is_connected"`
	LastSyncAt  *time.Time `json:"last_sync_at"`
	
	// Error tracking
	ErrorCount    int    `gorm:"default:0" json:"error_count"`
	LastError     string `json:"last_error"`
	LastErrorAt   *time.Time `json:"last_error_at"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// IntegrationType represents different types of integrations
type IntegrationType string

const (
	IntegrationTypeSlack     IntegrationType = "slack"
	IntegrationTypeDiscord   IntegrationType = "discord"
	IntegrationTypeTeams     IntegrationType = "teams"
	IntegrationTypeNotion    IntegrationType = "notion"
	IntegrationTypeObsidian  IntegrationType = "obsidian"
	IntegrationTypeZapier    IntegrationType = "zapier"
	IntegrationTypeWebhook   IntegrationType = "webhook"
	IntegrationTypeAPI       IntegrationType = "api"
	IntegrationTypeGoogle    IntegrationType = "google"
	IntegrationTypeMicrosoft IntegrationType = "microsoft"
)

// Comment represents comments on videos or clips
type Comment struct {
	ID       uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID   uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Target resource (one of these will be populated)
	VideoID  *uuid.UUID `gorm:"type:uuid" json:"video_id"`
	ClipID   *uuid.UUID `gorm:"type:uuid" json:"clip_id"`
	
	// Comment details
	Content     string     `gorm:"not null" json:"content"`
	ParentID    *uuid.UUID `gorm:"type:uuid" json:"parent_id"` // For threaded comments
	ThreadLevel int        `gorm:"default:0" json:"thread_level"`
	
	// Comment metadata
	IsEdited    bool       `gorm:"default:false" json:"is_edited"`
	EditedAt    *time.Time `json:"edited_at"`
	IsDeleted   bool       `gorm:"default:false" json:"is_deleted"`
	DeletedAt   *time.Time `json:"deleted_at"`
	
	// Reactions
	LikeCount    int `gorm:"default:0" json:"like_count"`
	DislikeCount int `gorm:"default:0" json:"dislike_count"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CommentReaction represents reactions to comments
type CommentReaction struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	CommentID uuid.UUID `gorm:"type:uuid;not null" json:"comment_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Reaction details
	Type ReactionType `gorm:"not null" json:"type"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ReactionType represents different types of reactions
type ReactionType string

const (
	ReactionTypeLike     ReactionType = "like"
	ReactionTypeDislike  ReactionType = "dislike"
	ReactionTypeLove     ReactionType = "love"
	ReactionTypeLaugh    ReactionType = "laugh"
	ReactionTypeAngry    ReactionType = "angry"
	ReactionTypeSad      ReactionType = "sad"
	ReactionTypeSurprised ReactionType = "surprised"
)

// BeforeCreate hooks for UUID generation
func (w *Workspace) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}

func (wm *WorkspaceMember) BeforeCreate(tx *gorm.DB) error {
	if wm.ID == uuid.Nil {
		wm.ID = uuid.New()
	}
	return nil
}

func (ai *AIInsight) BeforeCreate(tx *gorm.DB) error {
	if ai.ID == uuid.Nil {
		ai.ID = uuid.New()
	}
	return nil
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

func (i *Integration) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

func (c *Comment) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

func (cr *CommentReaction) BeforeCreate(tx *gorm.DB) error {
	if cr.ID == uuid.Nil {
		cr.ID = uuid.New()
	}
	return nil
}
