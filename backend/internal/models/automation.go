package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Automation represents automated workflows and rules
type Automation struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;" json:"id"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	WorkspaceID *uuid.UUID `gorm:"type:uuid" json:"workspace_id"`

	// Automation details
	Name        string         `gorm:"not null" json:"name"`
	Description string         `json:"description"`
	Type        AutomationType `gorm:"not null" json:"type"`

	// Trigger configuration
	TriggerType   TriggerType `gorm:"not null" json:"trigger_type"`
	TriggerConfig string      `gorm:"type:text" json:"trigger_config"` // JSON config

	// Action configuration
	ActionType   ActionType `gorm:"not null" json:"action_type"`
	ActionConfig string     `gorm:"type:text" json:"action_config"` // JSON config

	// Conditions
	Conditions string `gorm:"type:text" json:"conditions"` // JSON array of conditions

	// Status and execution
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	LastExecuted   *time.Time `json:"last_executed"`
	ExecutionCount int        `gorm:"default:0" json:"execution_count"`
	SuccessCount   int        `gorm:"default:0" json:"success_count"`
	FailureCount   int        `gorm:"default:0" json:"failure_count"`

	// Error tracking
	LastError   string     `json:"last_error"`
	LastErrorAt *time.Time `json:"last_error_at"`

	// Timestamps
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// AutomationType represents different types of automations
type AutomationType string

const (
	AutomationTypeVideoProcessing AutomationType = "video_processing"
	AutomationTypeClipGeneration  AutomationType = "clip_generation"
	AutomationTypeTagging         AutomationType = "tagging"
	AutomationTypeNotification    AutomationType = "notification"
	AutomationTypeIntegration     AutomationType = "integration"
	AutomationTypeWorkflow        AutomationType = "workflow"
)

// TriggerType represents different types of triggers
type TriggerType string

const (
	TriggerTypeVideoAdded      TriggerType = "video_added"
	TriggerTypeVideoUpdated    TriggerType = "video_updated"
	TriggerTypeClipCreated     TriggerType = "clip_created"
	TriggerTypePlaylistCreated TriggerType = "playlist_created"
	TriggerTypeScheduled       TriggerType = "scheduled"
	TriggerTypeWebhook         TriggerType = "webhook"
	TriggerTypeManual          TriggerType = "manual"
)

// ActionType represents different types of actions
type ActionType string

const (
	ActionTypeCreateClip       ActionType = "create_clip"
	ActionTypeAddToPlaylist    ActionType = "add_to_playlist"
	ActionTypeAddTags          ActionType = "add_tags"
	ActionTypeSendNotification ActionType = "send_notification"
	ActionTypeCallWebhook      ActionType = "call_webhook"
	ActionTypeGenerateInsights ActionType = "generate_insights"
	ActionTypeExportData       ActionType = "export_data"
	ActionTypeUpdateMetadata   ActionType = "update_metadata"
)

// AutomationExecution represents individual automation executions
type AutomationExecution struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	AutomationID uuid.UUID `gorm:"type:uuid;not null" json:"automation_id"`

	// Execution details
	Status      ExecutionStatus `gorm:"not null" json:"status"`
	StartedAt   time.Time       `gorm:"not null" json:"started_at"`
	CompletedAt *time.Time      `json:"completed_at"`
	Duration    int             `json:"duration"` // Duration in milliseconds

	// Trigger context
	TriggerData string `gorm:"type:text" json:"trigger_data"` // JSON data that triggered this execution

	// Execution results
	Output        string `gorm:"type:text" json:"output"`
	ErrorMessage  string `json:"error_message"`
	StepsExecuted int    `gorm:"default:0" json:"steps_executed"`

	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ExecutionStatus represents the status of an automation execution
type ExecutionStatus string

const (
	ExecutionStatusPending   ExecutionStatus = "pending"
	ExecutionStatusRunning   ExecutionStatus = "running"
	ExecutionStatusCompleted ExecutionStatus = "completed"
	ExecutionStatusFailed    ExecutionStatus = "failed"
	ExecutionStatusCancelled ExecutionStatus = "cancelled"
	ExecutionStatusTimeout   ExecutionStatus = "timeout"
)

// Template represents reusable templates for videos, playlists, etc.
type Template struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;" json:"id"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	WorkspaceID *uuid.UUID `gorm:"type:uuid" json:"workspace_id"`

	// Template details
	Name        string       `gorm:"not null" json:"name"`
	Description string       `json:"description"`
	Type        TemplateType `gorm:"not null" json:"type"`
	Category    string       `json:"category"`

	// Template content
	Content string `gorm:"type:text;not null" json:"content"` // JSON template content
	Preview string `gorm:"type:text" json:"preview"`          // Preview data

	// Sharing and visibility
	IsPublic   bool   `gorm:"default:false" json:"is_public"`
	IsOfficial bool   `gorm:"default:false" json:"is_official"`
	ShareCode  string `gorm:"uniqueIndex" json:"share_code"`

	// Usage statistics
	UseCount  int     `gorm:"default:0" json:"use_count"`
	LikeCount int     `gorm:"default:0" json:"like_count"`
	Rating    float64 `gorm:"default:0" json:"rating"`

	// Metadata
	Tags    string `json:"tags"` // JSON array of tags
	Version string `gorm:"default:'1.0'" json:"version"`

	// Timestamps
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TemplateType represents different types of templates
type TemplateType string

const (
	TemplateTypeVideo        TemplateType = "video"
	TemplateTypePlaylist     TemplateType = "playlist"
	TemplateTypeClip         TemplateType = "clip"
	TemplateTypeWorkflow     TemplateType = "workflow"
	TemplateTypeAutomation   TemplateType = "automation"
	TemplateTypeExport       TemplateType = "export"
	TemplateTypeNotification TemplateType = "notification"
)

// TemplateUsage represents usage of templates
type TemplateUsage struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	TemplateID uuid.UUID `gorm:"type:uuid;not null" json:"template_id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`

	// Usage details
	Context    string `json:"context"`     // Context of usage
	CustomData string `json:"custom_data"` // Custom data applied

	// Results
	ResultType string `json:"result_type"` // Type of result created
	ResultID   string `json:"result_id"`   // ID of created resource

	// Timestamps
	CreatedAt time.Time `json:"created_at"`
}

// APIKey represents API keys for external access
type APIKey struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;" json:"id"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	WorkspaceID *uuid.UUID `gorm:"type:uuid" json:"workspace_id"`

	// API key details
	Name        string `gorm:"not null" json:"name"`
	Description string `json:"description"`
	KeyHash     string `gorm:"not null;uniqueIndex" json:"key_hash"` // Hashed API key
	KeyPrefix   string `gorm:"not null" json:"key_prefix"`           // First 8 chars for identification

	// Permissions and scopes
	Scopes      string `gorm:"type:text" json:"scopes"`      // JSON array of scopes
	Permissions string `gorm:"type:text" json:"permissions"` // JSON permissions object

	// Usage and limits
	RateLimit  int        `gorm:"default:1000" json:"rate_limit"` // Requests per hour
	UsageCount int64      `gorm:"default:0" json:"usage_count"`   // Total usage count
	LastUsedAt *time.Time `json:"last_used_at"`
	LastUsedIP string     `json:"last_used_ip"`

	// Status
	IsActive  bool       `gorm:"default:true" json:"is_active"`
	ExpiresAt *time.Time `json:"expires_at"`

	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// APIUsage represents API usage logs
type APIUsage struct {
	ID       uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	APIKeyID uuid.UUID `gorm:"type:uuid;not null" json:"api_key_id"`
	UserID   uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`

	// Request details
	Method    string `gorm:"not null" json:"method"`
	Endpoint  string `gorm:"not null" json:"endpoint"`
	IPAddress string `json:"ip_address"`
	UserAgent string `json:"user_agent"`

	// Response details
	StatusCode   int   `gorm:"not null" json:"status_code"`
	ResponseTime int   `json:"response_time"` // Response time in milliseconds
	RequestSize  int64 `json:"request_size"`  // Request size in bytes
	ResponseSize int64 `json:"response_size"` // Response size in bytes

	// Error tracking
	ErrorMessage string `json:"error_message"`

	// Timestamps
	CreatedAt time.Time `json:"created_at"`
}

// Webhook represents webhook endpoints
type Webhook struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;" json:"id"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	WorkspaceID *uuid.UUID `gorm:"type:uuid" json:"workspace_id"`

	// Webhook details
	Name        string `gorm:"not null" json:"name"`
	Description string `json:"description"`
	URL         string `gorm:"not null" json:"url"`
	Secret      string `json:"secret"` // For signature verification

	// Configuration
	Events  string `gorm:"type:text" json:"events"`  // JSON array of events
	Headers string `gorm:"type:text" json:"headers"` // JSON object of headers

	// Status and delivery
	IsActive      bool       `gorm:"default:true" json:"is_active"`
	DeliveryCount int64      `gorm:"default:0" json:"delivery_count"`
	SuccessCount  int64      `gorm:"default:0" json:"success_count"`
	FailureCount  int64      `gorm:"default:0" json:"failure_count"`
	LastDelivery  *time.Time `json:"last_delivery"`
	LastSuccess   *time.Time `json:"last_success"`
	LastFailure   *time.Time `json:"last_failure"`
	LastError     string     `json:"last_error"`

	// Timestamps
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// WebhookDelivery represents individual webhook deliveries
type WebhookDelivery struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	WebhookID uuid.UUID `gorm:"type:uuid;not null" json:"webhook_id"`

	// Delivery details
	Event      string `gorm:"not null" json:"event"`
	Payload    string `gorm:"type:text" json:"payload"`
	StatusCode int    `json:"status_code"`
	Response   string `gorm:"type:text" json:"response"`

	// Delivery attempts
	AttemptCount int        `gorm:"default:1" json:"attempt_count"`
	NextAttempt  *time.Time `json:"next_attempt"`

	// Status
	Status       DeliveryStatus `gorm:"not null" json:"status"`
	ErrorMessage string         `json:"error_message"`

	// Timestamps
	CreatedAt   time.Time  `json:"created_at"`
	DeliveredAt *time.Time `json:"delivered_at"`
}

// DeliveryStatus represents the status of a webhook delivery
type DeliveryStatus string

const (
	DeliveryStatusPending   DeliveryStatus = "pending"
	DeliveryStatusDelivered DeliveryStatus = "delivered"
	DeliveryStatusFailed    DeliveryStatus = "failed"
	DeliveryStatusRetrying  DeliveryStatus = "retrying"
	DeliveryStatusGiven_up  DeliveryStatus = "given_up"
)

// BeforeCreate hooks for UUID generation
func (a *Automation) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

func (ae *AutomationExecution) BeforeCreate(tx *gorm.DB) error {
	if ae.ID == uuid.Nil {
		ae.ID = uuid.New()
	}
	return nil
}

func (t *Template) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

func (tu *TemplateUsage) BeforeCreate(tx *gorm.DB) error {
	if tu.ID == uuid.Nil {
		tu.ID = uuid.New()
	}
	return nil
}

func (ak *APIKey) BeforeCreate(tx *gorm.DB) error {
	if ak.ID == uuid.Nil {
		ak.ID = uuid.New()
	}
	return nil
}

func (au *APIUsage) BeforeCreate(tx *gorm.DB) error {
	if au.ID == uuid.Nil {
		au.ID = uuid.New()
	}
	return nil
}

func (w *Webhook) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}

func (wd *WebhookDelivery) BeforeCreate(tx *gorm.DB) error {
	if wd.ID == uuid.Nil {
		wd.ID = uuid.New()
	}
	return nil
}
