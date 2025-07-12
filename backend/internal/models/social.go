package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Follow represents user following relationships
type Follow struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	FollowerID uuid.UUID `gorm:"type:uuid;not null" json:"follower_id"`
	FollowingID uuid.UUID `gorm:"type:uuid;not null" json:"following_id"`
	
	// Follow metadata
	IsAccepted bool `gorm:"default:true" json:"is_accepted"` // For private accounts
	IsMuted    bool `gorm:"default:false" json:"is_muted"`   // Mute notifications
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// UserProfile represents extended user profile information
type UserProfile struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	
	// Profile info
	Bio         string `json:"bio"`
	Website     string `json:"website"`
	Location    string `json:"location"`
	Company     string `json:"company"`
	Job         string `json:"job"`
	
	// Social links
	TwitterHandle   string `json:"twitter_handle"`
	LinkedinProfile string `json:"linkedin_profile"`
	GitHubProfile   string `json:"github_profile"`
	
	// Privacy settings
	IsPrivate          bool `gorm:"default:false" json:"is_private"`
	ShowEmail          bool `gorm:"default:false" json:"show_email"`
	ShowVideos         bool `gorm:"default:true" json:"show_videos"`
	ShowPlaylists      bool `gorm:"default:true" json:"show_playlists"`
	ShowActivity       bool `gorm:"default:true" json:"show_activity"`
	AllowComments      bool `gorm:"default:true" json:"allow_comments"`
	AllowCollaboration bool `gorm:"default:true" json:"allow_collaboration"`
	
	// Statistics
	FollowerCount  int `gorm:"default:0" json:"follower_count"`
	FollowingCount int `gorm:"default:0" json:"following_count"`
	PublicVideos   int `gorm:"default:0" json:"public_videos"`
	PublicPlaylists int `gorm:"default:0" json:"public_playlists"`
	
	// Verification
	IsVerified    bool       `gorm:"default:false" json:"is_verified"`
	VerifiedAt    *time.Time `json:"verified_at"`
	VerificationType string  `json:"verification_type"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CommunityPost represents posts in the community/feed
type CommunityPost struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Post content
	Content string   `gorm:"type:text;not null" json:"content"`
	Type    PostType `gorm:"not null" json:"type"`
	
	// Media attachments
	MediaURLs    string `gorm:"type:text" json:"media_urls"`    // JSON array of media URLs
	ThumbnailURL string `json:"thumbnail_url"`
	
	// Post references (for sharing videos/playlists)
	VideoID    *uuid.UUID `gorm:"type:uuid" json:"video_id"`
	PlaylistID *uuid.UUID `gorm:"type:uuid" json:"playlist_id"`
	ClipID     *uuid.UUID `gorm:"type:uuid" json:"clip_id"`
	
	// Engagement
	LikeCount    int `gorm:"default:0" json:"like_count"`
	CommentCount int `gorm:"default:0" json:"comment_count"`
	ShareCount   int `gorm:"default:0" json:"share_count"`
	ViewCount    int `gorm:"default:0" json:"view_count"`
	
	// Visibility and moderation
	Visibility   PostVisibility `gorm:"default:'public'" json:"visibility"`
	IsModerated  bool           `gorm:"default:false" json:"is_moderated"`
	ModeratedAt  *time.Time     `json:"moderated_at"`
	ModeratorID  *uuid.UUID     `gorm:"type:uuid" json:"moderator_id"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// PostType represents different types of community posts
type PostType string

const (
	PostTypeText     PostType = "text"
	PostTypeVideo    PostType = "video"
	PostTypePlaylist PostType = "playlist"
	PostTypeClip     PostType = "clip"
	PostTypeImage    PostType = "image"
	PostTypeLink     PostType = "link"
	PostTypePoll     PostType = "poll"
	PostTypeQuestion PostType = "question"
)

// PostVisibility represents who can see the post
type PostVisibility string

const (
	PostVisibilityPublic    PostVisibility = "public"
	PostVisibilityFollowers PostVisibility = "followers"
	PostVisibilityPrivate   PostVisibility = "private"
)

// PostLike represents likes on community posts
type PostLike struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	PostID uuid.UUID `gorm:"type:uuid;not null" json:"post_id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Like metadata
	Type ReactionType `gorm:"default:'like'" json:"type"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
}

// PostComment represents comments on community posts
type PostComment struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	PostID uuid.UUID `gorm:"type:uuid;not null" json:"post_id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Comment content
	Content     string     `gorm:"not null" json:"content"`
	ParentID    *uuid.UUID `gorm:"type:uuid" json:"parent_id"`
	ThreadLevel int        `gorm:"default:0" json:"thread_level"`
	
	// Engagement
	LikeCount int `gorm:"default:0" json:"like_count"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// Challenge represents video challenges or contests
type Challenge struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	CreatorID uuid.UUID `gorm:"type:uuid;not null" json:"creator_id"`
	
	// Challenge details
	Title       string `gorm:"not null" json:"title"`
	Description string `gorm:"type:text" json:"description"`
	Rules       string `gorm:"type:text" json:"rules"`
	
	// Challenge settings
	Type           ChallengeType `gorm:"not null" json:"type"`
	Difficulty     string        `gorm:"default:'medium'" json:"difficulty"`
	Category       string        `json:"category"`
	Tags           string        `json:"tags"` // JSON array
	
	// Participation
	MaxParticipants int  `gorm:"default:0" json:"max_participants"` // 0 = unlimited
	RequiresApproval bool `gorm:"default:false" json:"requires_approval"`
	
	// Rewards
	HasRewards   bool   `gorm:"default:false" json:"has_rewards"`
	RewardInfo   string `gorm:"type:text" json:"reward_info"` // JSON
	
	// Timeline
	StartsAt *time.Time `json:"starts_at"`
	EndsAt   *time.Time `json:"ends_at"`
	
	// Status
	Status          ChallengeStatus `gorm:"default:'draft'" json:"status"`
	ParticipantCount int            `gorm:"default:0" json:"participant_count"`
	SubmissionCount  int            `gorm:"default:0" json:"submission_count"`
	
	// Engagement
	ViewCount int `gorm:"default:0" json:"view_count"`
	LikeCount int `gorm:"default:0" json:"like_count"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// ChallengeType represents different types of challenges
type ChallengeType string

const (
	ChallengeTypeCreative    ChallengeType = "creative"
	ChallengeTypeEducational ChallengeType = "educational"
	ChallengeTypeSkill       ChallengeType = "skill"
	ChallengeTypeFun         ChallengeType = "fun"
	ChallengeTypeContest     ChallengeType = "contest"
)

// ChallengeStatus represents the status of a challenge
type ChallengeStatus string

const (
	ChallengeStatusDraft     ChallengeStatus = "draft"
	ChallengeStatusActive    ChallengeStatus = "active"
	ChallengeStatusCompleted ChallengeStatus = "completed"
	ChallengeStatusCancelled ChallengeStatus = "cancelled"
)

// ChallengeParticipant represents users participating in challenges
type ChallengeParticipant struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	ChallengeID uuid.UUID `gorm:"type:uuid;not null" json:"challenge_id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Participation status
	Status       ParticipationStatus `gorm:"default:'registered'" json:"status"`
	JoinedAt     time.Time           `gorm:"not null" json:"joined_at"`
	SubmittedAt  *time.Time          `json:"submitted_at"`
	
	// Submission
	SubmissionID *uuid.UUID `gorm:"type:uuid" json:"submission_id"`
	
	// Results
	Score        *float64 `json:"score"`
	Rank         *int     `json:"rank"`
	IsWinner     bool     `gorm:"default:false" json:"is_winner"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ParticipationStatus represents the status of challenge participation
type ParticipationStatus string

const (
	ParticipationStatusRegistered ParticipationStatus = "registered"
	ParticipationStatusActive     ParticipationStatus = "active"
	ParticipationStatusSubmitted  ParticipationStatus = "submitted"
	ParticipationStatusCompleted  ParticipationStatus = "completed"
	ParticipationStatusDisqualified ParticipationStatus = "disqualified"
)

// ChallengeSubmission represents submissions to challenges
type ChallengeSubmission struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	ChallengeID uuid.UUID `gorm:"type:uuid;not null" json:"challenge_id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	
	// Submission content
	Title       string `gorm:"not null" json:"title"`
	Description string `gorm:"type:text" json:"description"`
	
	// Submission references
	VideoID    *uuid.UUID `gorm:"type:uuid" json:"video_id"`
	PlaylistID *uuid.UUID `gorm:"type:uuid" json:"playlist_id"`
	ClipID     *uuid.UUID `gorm:"type:uuid" json:"clip_id"`
	
	// Additional content
	MediaURLs string `gorm:"type:text" json:"media_urls"` // JSON array
	
	// Evaluation
	Score        *float64 `json:"score"`
	Feedback     string   `gorm:"type:text" json:"feedback"`
	IsApproved   bool     `gorm:"default:false" json:"is_approved"`
	ApprovedAt   *time.Time `json:"approved_at"`
	ApprovedBy   *uuid.UUID `gorm:"type:uuid" json:"approved_by"`
	
	// Engagement
	ViewCount int `gorm:"default:0" json:"view_count"`
	LikeCount int `gorm:"default:0" json:"like_count"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// Badge represents achievement badges
type Badge struct {
	ID   uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	Name string    `gorm:"not null;uniqueIndex" json:"name"`
	
	// Badge details
	Title       string    `gorm:"not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	Type        BadgeType `gorm:"not null" json:"type"`
	Category    string    `json:"category"`
	
	// Badge appearance
	IconURL     string `json:"icon_url"`
	Color       string `gorm:"default:'#3B82F6'" json:"color"`
	Rarity      BadgeRarity `gorm:"default:'common'" json:"rarity"`
	
	// Earning criteria
	Criteria    string `gorm:"type:text" json:"criteria"` // JSON criteria
	IsActive    bool   `gorm:"default:true" json:"is_active"`
	IsSecret    bool   `gorm:"default:false" json:"is_secret"`
	
	// Statistics
	EarnedCount int `gorm:"default:0" json:"earned_count"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// BadgeType represents different types of badges
type BadgeType string

const (
	BadgeTypeAchievement BadgeType = "achievement"
	BadgeTypeMilestone   BadgeType = "milestone"
	BadgeTypeSpecial     BadgeType = "special"
	BadgeTypeEvent       BadgeType = "event"
	BadgeTypeChallenge   BadgeType = "challenge"
)

// BadgeRarity represents the rarity of badges
type BadgeRarity string

const (
	BadgeRarityCommon    BadgeRarity = "common"
	BadgeRarityUncommon  BadgeRarity = "uncommon"
	BadgeRarityRare      BadgeRarity = "rare"
	BadgeRarityEpic      BadgeRarity = "epic"
	BadgeRarityLegendary BadgeRarity = "legendary"
)

// UserBadge represents badges earned by users
type UserBadge struct {
	ID      uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	UserID  uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	BadgeID uuid.UUID `gorm:"type:uuid;not null" json:"badge_id"`
	
	// Earning details
	EarnedAt    time.Time `gorm:"not null" json:"earned_at"`
	Context     string    `json:"context"`     // Context of earning
	MetaData    string    `json:"meta_data"`   // Additional metadata
	
	// Display settings
	IsVisible   bool `gorm:"default:true" json:"is_visible"`
	IsPinned    bool `gorm:"default:false" json:"is_pinned"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// BeforeCreate hooks for UUID generation
func (f *Follow) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}

func (up *UserProfile) BeforeCreate(tx *gorm.DB) error {
	if up.ID == uuid.Nil {
		up.ID = uuid.New()
	}
	return nil
}

func (cp *CommunityPost) BeforeCreate(tx *gorm.DB) error {
	if cp.ID == uuid.Nil {
		cp.ID = uuid.New()
	}
	return nil
}

func (pl *PostLike) BeforeCreate(tx *gorm.DB) error {
	if pl.ID == uuid.Nil {
		pl.ID = uuid.New()
	}
	return nil
}

func (pc *PostComment) BeforeCreate(tx *gorm.DB) error {
	if pc.ID == uuid.Nil {
		pc.ID = uuid.New()
	}
	return nil
}

func (c *Challenge) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

func (cp *ChallengeParticipant) BeforeCreate(tx *gorm.DB) error {
	if cp.ID == uuid.Nil {
		cp.ID = uuid.New()
	}
	return nil
}

func (cs *ChallengeSubmission) BeforeCreate(tx *gorm.DB) error {
	if cs.ID == uuid.Nil {
		cs.ID = uuid.New()
	}
	return nil
}

func (b *Badge) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}

func (ub *UserBadge) BeforeCreate(tx *gorm.DB) error {
	if ub.ID == uuid.Nil {
		ub.ID = uuid.New()
	}
	return nil
}
