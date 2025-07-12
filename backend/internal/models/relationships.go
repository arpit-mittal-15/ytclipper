package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PlaylistVideo represents the many-to-many relationship between playlists and videos
type PlaylistVideo struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	PlaylistID uuid.UUID `gorm:"type:uuid;not null" json:"playlist_id"`
	VideoID    uuid.UUID `gorm:"type:uuid;not null" json:"video_id"`
	
	// Ordering and metadata
	Position int    `gorm:"default:0" json:"position"`
	AddedBy  uuid.UUID `gorm:"type:uuid" json:"added_by"`
	Note     string `json:"note"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// VideoTag represents the many-to-many relationship between videos and tags
type VideoTag struct {
	ID      uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	VideoID uuid.UUID `gorm:"type:uuid;not null" json:"video_id"`
	TagID   uuid.UUID `gorm:"type:uuid;not null" json:"tag_id"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
}

// ClipTag represents the many-to-many relationship between clips and tags
type ClipTag struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	ClipID uuid.UUID `gorm:"type:uuid;not null" json:"clip_id"`
	TagID  uuid.UUID `gorm:"type:uuid;not null" json:"tag_id"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
}

// PlaylistTag represents the many-to-many relationship between playlists and tags
type PlaylistTag struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	PlaylistID uuid.UUID `gorm:"type:uuid;not null" json:"playlist_id"`
	TagID      uuid.UUID `gorm:"type:uuid;not null" json:"tag_id"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at"`
}

// BeforeCreate hooks for UUID generation
func (pv *PlaylistVideo) BeforeCreate(tx *gorm.DB) error {
	if pv.ID == uuid.Nil {
		pv.ID = uuid.New()
	}
	return nil
}

func (vt *VideoTag) BeforeCreate(tx *gorm.DB) error {
	if vt.ID == uuid.Nil {
		vt.ID = uuid.New()
	}
	return nil
}

func (ct *ClipTag) BeforeCreate(tx *gorm.DB) error {
	if ct.ID == uuid.Nil {
		ct.ID = uuid.New()
	}
	return nil
}

func (pt *PlaylistTag) BeforeCreate(tx *gorm.DB) error {
	if pt.ID == uuid.Nil {
		pt.ID = uuid.New()
	}
	return nil
}
