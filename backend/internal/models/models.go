package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AllModels returns a slice of all model types for migration
func AllModels() []interface{} {
	return []interface{}{
		// Core models
		&User{},
		&UserSession{},
		&Video{},
		&VideoTranscript{},
		&VideoAnalytics{},
		&Clip{},
		&Tag{},
		&Playlist{},
		&Favorite{},
		&SharedPlaylist{},
		
		// Relationship models
		&PlaylistVideo{},
		&VideoTag{},
		&ClipTag{},
		&PlaylistTag{},
		
		// Advanced models
		&Collection{},
		&CollectionItem{},
		&SearchHistory{},
		&Activity{},
		&Export{},
		
		// Enterprise models
		&Workspace{},
		&WorkspaceMember{},
		&AIInsight{},
		&Notification{},
		&Integration{},
		&Comment{},
		&CommentReaction{},
		
		// Automation models
		&Automation{},
		&AutomationExecution{},
		&Template{},
		&TemplateUsage{},
		&APIKey{},
		&APIUsage{},
		&Webhook{},
		&WebhookDelivery{},
		
		// Social models
		&Follow{},
		&UserProfile{},
		&CommunityPost{},
		&PostLike{},
		&PostComment{},
		&Challenge{},
		&ChallengeParticipant{},
		&ChallengeSubmission{},
		&Badge{},
		&UserBadge{},
	}
}

// CreateDefaultTags creates default system tags for a user
func CreateDefaultTags(db *gorm.DB, userID uuid.UUID) error {
	defaultTags := []Tag{
		{
			UserID: userID,
			Name:   "Important",
			Color:  "#EF4444",
		},
		{
			UserID: userID,
			Name:   "Tutorial",
			Color:  "#3B82F6",
		},
		{
			UserID: userID,
			Name:   "Entertainment",
			Color:  "#10B981",
		},
		{
			UserID: userID,
			Name:   "Learning",
			Color:  "#F59E0B",
		},
		{
			UserID: userID,
			Name:   "Review Later",
			Color:  "#8B5CF6",
		},
	}
	
	for _, tag := range defaultTags {
		if err := db.Create(&tag).Error; err != nil {
			return err
		}
	}
	
	return nil
}

// CreateDefaultCollections creates default system collections for a user
func CreateDefaultCollections(db *gorm.DB, userID uuid.UUID) error {
	defaultCollections := []Collection{
		{
			UserID:             userID,
			Name:               "Recently Added",
			Description:        "Videos added in the last 30 days",
			Type:               CollectionTypeVideos,
			Visibility:         CollectionVisibilityPrivate,
			IsSystemCollection: true,
			Color:              "#3B82F6",
		},
		{
			UserID:             userID,
			Name:               "Favorites",
			Description:        "Your favorite videos",
			Type:               CollectionTypeVideos,
			Visibility:         CollectionVisibilityPrivate,
			IsSystemCollection: true,
			Color:              "#EF4444",
		},
		{
			UserID:             userID,
			Name:               "Watch Later",
			Description:        "Videos to watch later",
			Type:               CollectionTypeVideos,
			Visibility:         CollectionVisibilityPrivate,
			IsSystemCollection: true,
			Color:              "#F59E0B",
		},
		{
			UserID:             userID,
			Name:               "Completed",
			Description:        "Fully watched videos",
			Type:               CollectionTypeVideos,
			Visibility:         CollectionVisibilityPrivate,
			IsSystemCollection: true,
			Color:              "#10B981",
		},
	}
	
	for _, collection := range defaultCollections {
		if err := db.Create(&collection).Error; err != nil {
			return err
		}
	}
	
	return nil
}

// CreateDefaultBadges creates default system badges
func CreateDefaultBadges(db *gorm.DB) error {
	defaultBadges := []Badge{
		{
			Name:        "first_video",
			Title:       "First Video",
			Description: "Added your first video to the collection",
			Type:        BadgeTypeAchievement,
			Category:    "getting_started",
			IconURL:     "/badges/first-video.svg",
			Color:       "#10B981",
			Rarity:      BadgeRarityCommon,
			Criteria:    `{"type": "video_count", "value": 1}`,
		},
		{
			Name:        "clip_master",
			Title:       "Clip Master",
			Description: "Created 100 clips across all videos",
			Type:        BadgeTypeMilestone,
			Category:    "clipping",
			IconURL:     "/badges/clip-master.svg",
			Color:       "#3B82F6",
			Rarity:      BadgeRarityRare,
			Criteria:    `{"type": "clip_count", "value": 100}`,
		},
		{
			Name:        "playlist_creator",
			Title:       "Playlist Creator",
			Description: "Created your first playlist",
			Type:        BadgeTypeAchievement,
			Category:    "organization",
			IconURL:     "/badges/playlist-creator.svg",
			Color:       "#F59E0B",
			Rarity:      BadgeRarityCommon,
			Criteria:    `{"type": "playlist_count", "value": 1}`,
		},
		{
			Name:        "social_butterfly",
			Title:       "Social Butterfly",
			Description: "Followed 50 other users",
			Type:        BadgeTypeAchievement,
			Category:    "social",
			IconURL:     "/badges/social-butterfly.svg",
			Color:       "#EF4444",
			Rarity:      BadgeRarityUncommon,
			Criteria:    `{"type": "following_count", "value": 50}`,
		},
		{
			Name:        "early_adopter",
			Title:       "Early Adopter",
			Description: "One of the first 1000 users to join",
			Type:        BadgeTypeSpecial,
			Category:    "special",
			IconURL:     "/badges/early-adopter.svg",
			Color:       "#8B5CF6",
			Rarity:      BadgeRarityLegendary,
			Criteria:    `{"type": "user_id", "value": 1000}`,
		},
		{
			Name:        "power_user",
			Title:       "Power User",
			Description: "Used the platform for 365 consecutive days",
			Type:        BadgeTypeMilestone,
			Category:    "engagement",
			IconURL:     "/badges/power-user.svg",
			Color:       "#059669",
			Rarity:      BadgeRarityEpic,
			Criteria:    `{"type": "consecutive_days", "value": 365}`,
		},
		{
			Name:        "challenge_champion",
			Title:       "Challenge Champion",
			Description: "Won first place in a community challenge",
			Type:        BadgeTypeChallenge,
			Category:    "competition",
			IconURL:     "/badges/challenge-champion.svg",
			Color:       "#DC2626",
			Rarity:      BadgeRarityRare,
			Criteria:    `{"type": "challenge_wins", "value": 1}`,
		},
		{
			Name:        "helping_hand",
			Title:       "Helping Hand",
			Description: "Helped 10 community members with their content",
			Type:        BadgeTypeAchievement,
			Category:    "community",
			IconURL:     "/badges/helping-hand.svg",
			Color:       "#7C3AED",
			Rarity:      BadgeRarityUncommon,
			Criteria:    `{"type": "help_count", "value": 10}`,
		},
	}
	
	for _, badge := range defaultBadges {
		// Check if badge already exists
		var existingBadge Badge
		if err := db.Where("name = ?", badge.Name).First(&existingBadge).Error; err == nil {
			continue // Badge already exists
		}
		
		if err := db.Create(&badge).Error; err != nil {
			return err
		}
	}
	
	return nil
}

// CreateUserProfile creates a user profile for a new user
func CreateUserProfile(db *gorm.DB, userID uuid.UUID) error {
	profile := UserProfile{
		UserID:             userID,
		IsPrivate:          false,
		ShowEmail:          false,
		ShowVideos:         true,
		ShowPlaylists:      true,
		ShowActivity:       true,
		AllowComments:      true,
		AllowCollaboration: true,
	}
	
	return db.Create(&profile).Error
}

// AwardBadge awards a badge to a user if they don't already have it
func AwardBadge(db *gorm.DB, userID uuid.UUID, badgeName string, context string) error {
	// Check if user already has this badge
	var existingUserBadge UserBadge
	if err := db.Joins("JOIN badges ON badges.id = user_badges.badge_id").
		Where("user_badges.user_id = ? AND badges.name = ?", userID, badgeName).
		First(&existingUserBadge).Error; err == nil {
		return nil // User already has this badge
	}
	
	// Get the badge
	var badge Badge
	if err := db.Where("name = ?", badgeName).First(&badge).Error; err != nil {
		return err // Badge doesn't exist
	}
	
	// Award the badge
	userBadge := UserBadge{
		UserID:   userID,
		BadgeID:  badge.ID,
		EarnedAt: time.Now(),
		Context:  context,
	}
	
	if err := db.Create(&userBadge).Error; err != nil {
		return err
	}
	
	// Update badge earned count
	return db.Model(&badge).Update("earned_count", gorm.Expr("earned_count + ?", 1)).Error
}

// GetUserBadges returns all badges earned by a user
func GetUserBadges(db *gorm.DB, userID uuid.UUID, includeHidden bool) ([]UserBadge, error) {
	var userBadges []UserBadge
	
	query := db.Preload("Badge").Where("user_id = ?", userID)
	
	if !includeHidden {
		query = query.Where("is_visible = ?", true)
	}
	
	if err := query.Order("earned_at DESC").Find(&userBadges).Error; err != nil {
		return nil, err
	}
	
	return userBadges, nil
}

// GetUserFeed returns posts for a user's feed
func GetUserFeed(db *gorm.DB, userID uuid.UUID, limit int, offset int) ([]CommunityPost, error) {
	var posts []CommunityPost
	
	// Get posts from followed users and public posts
	if err := db.Preload("User").
		Where("user_id IN (SELECT following_id FROM follows WHERE follower_id = ?) OR visibility = ?", userID, PostVisibilityPublic).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&posts).Error; err != nil {
		return nil, err
	}
	
	return posts, nil
}

// CheckBadgeEligibility checks if a user is eligible for any badges and awards them
func CheckBadgeEligibility(db *gorm.DB, userID uuid.UUID) error {
	// Get basic counts for badge eligibility
	var videoCount int64
	var clipCount int64
	var playlistCount int64
	
	db.Model(&Video{}).Where("user_id = ?", userID).Count(&videoCount)
	db.Model(&Clip{}).Where("user_id = ?", userID).Count(&clipCount)
	db.Model(&Playlist{}).Where("user_id = ?", userID).Count(&playlistCount)
	
	// Check various badge criteria
	if videoCount >= 1 {
		AwardBadge(db, userID, "first_video", "Added first video")
	}
	
	if clipCount >= 100 {
		AwardBadge(db, userID, "clip_master", "Created 100 clips")
	}
	
	if playlistCount >= 1 {
		AwardBadge(db, userID, "playlist_creator", "Created first playlist")
	}
	
	// Check social stats
	var profile UserProfile
	if err := db.Where("user_id = ?", userID).First(&profile).Error; err == nil {
		if profile.FollowingCount >= 50 {
			AwardBadge(db, userID, "social_butterfly", "Followed 50 users")
		}
	}
	
	return nil
}

// GetTrendingContent returns trending videos, playlists, and posts
func GetTrendingContent(db *gorm.DB, contentType string, limit int) (interface{}, error) {
	switch contentType {
	case "videos":
		var videos []Video
		if err := db.Where("visibility = ?", VideoVisibilityPublic).
			Order("view_count DESC, created_at DESC").
			Limit(limit).
			Find(&videos).Error; err != nil {
			return nil, err
		}
		return videos, nil
		
	case "playlists":
		var playlists []Playlist
		if err := db.Where("visibility = ?", PlaylistVisibilityPublic).
			Order("view_count DESC, created_at DESC").
			Limit(limit).
			Find(&playlists).Error; err != nil {
			return nil, err
		}
		return playlists, nil
		
	case "posts":
		var posts []CommunityPost
		if err := db.Where("visibility = ?", PostVisibilityPublic).
			Order("like_count DESC, created_at DESC").
			Limit(limit).
			Find(&posts).Error; err != nil {
			return nil, err
		}
		return posts, nil
		
	default:
		return nil, fmt.Errorf("invalid content type: %s", contentType)
	}
}
