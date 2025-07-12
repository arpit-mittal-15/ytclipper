# YouTube Clipper Database Models - Complete System

This directory contains a comprehensive database schema for the YouTube Clipper SaaS application, designed to support everything from basic video clipping to advanced enterprise features, social interactions, and AI-powered insights.

## 📋 Model Overview

### 🔥 Core Models (Essential Features)

#### 1. **User** (`user.go`)
- **Purpose**: System users with Auth0 integration
- **Key Features**: 
  - Subscription plans (Free, Basic, Pro, Enterprise)
  - User preferences and settings
  - Usage tracking and quota management
  - Multi-tenant support
- **Plan Limits**: Configurable limits per subscription tier
- **Relationships**: Videos, Playlists, Clips, Workspaces, Social interactions

#### 2. **Video** (`video.go`)
- **Purpose**: YouTube videos added by users
- **Key Features**:
  - YouTube API integration (metadata, thumbnails, etc.)
  - Custom user metadata (titles, notes, ratings)
  - Watch progress tracking
  - Privacy controls (private, public, shared)
  - Analytics and engagement metrics
- **Advanced Features**: AI insights, transcripts, analytics

#### 3. **Clip** (`core.go`)
- **Purpose**: Timestamped segments within videos
- **Key Features**:
  - Precise timing (start/end timestamps)
  - Multiple clip types (notes, highlights, bookmarks, questions, etc.)
  - Importance ratings and categorization
  - Public/private sharing options
- **Use Cases**: Note-taking, highlights, study materials, content curation

#### 4. **Playlist** (`core.go`)
- **Purpose**: Collections of videos
- **Key Features**:
  - Collaborative editing with permissions
  - Privacy controls and sharing
  - Custom ordering and metadata
  - Analytics and engagement tracking
- **Advanced Features**: Templates, automation, AI suggestions

#### 5. **Tag** (`core.go`)
- **Purpose**: Flexible categorization system
- **Key Features**:
  - User-specific tags with custom colors
  - Cross-model tagging (videos, clips, playlists)
  - Usage analytics and suggestions
  - Smart auto-tagging with AI

### 🔗 Relationship Models

#### 6. **Many-to-Many Relationships** (`relationships.go`)
- **PlaylistVideo**: Videos within playlists with ordering
- **VideoTag, ClipTag, PlaylistTag**: Flexible tagging system
- **Advanced Features**: Position management, metadata, timestamps

### 🚀 Advanced Features

#### 7. **Collection** (`advanced.go`)
- **Purpose**: Meta-collections for advanced organization
- **Key Features**:
  - System-generated collections (Recently Added, Favorites, Watch Later)
  - Custom user collections
  - Smart collections with rules
  - Cross-content-type collections

#### 8. **Analytics & Insights** (`video.go`, `advanced.go`)
- **VideoAnalytics**: Comprehensive engagement metrics
- **SearchHistory**: User search patterns and suggestions
- **Activity**: Complete audit trail of user actions
- **Export**: Data export with multiple formats

### 🏢 Enterprise Features

#### 9. **Workspace** (`enterprise.go`)
- **Purpose**: Team collaboration and organization management
- **Key Features**:
  - Multi-user workspaces with role-based access
  - Custom branding and domains
  - Usage limits and billing management
  - Member management with granular permissions

#### 10. **AI Integration** (`enterprise.go`)
- **AIInsight**: AI-generated content analysis
- **Key Features**:
  - Content summarization and key points extraction
  - Sentiment analysis and topic detection
  - Automated transcription and translation
  - User feedback and model improvement

#### 11. **Notifications** (`enterprise.go`)
- **Purpose**: Real-time user notifications
- **Key Features**:
  - Priority-based notification system
  - Multiple delivery channels
  - Read/unread tracking
  - Customizable notification preferences

#### 12. **Integrations** (`enterprise.go`)
- **Purpose**: Third-party service connections
- **Supported**: Slack, Discord, Teams, Notion, Obsidian, Zapier
- **Key Features**:
  - OAuth and API key management
  - Error tracking and retry logic
  - Custom webhook support

### 🤖 Automation & Workflows

#### 13. **Automation** (`automation.go`)
- **Purpose**: Automated workflows and rules
- **Key Features**:
  - Trigger-based automation (video added, clip created, etc.)
  - Multi-step workflows with conditions
  - Integration with external services
  - Execution tracking and error handling

#### 14. **Templates** (`automation.go`)
- **Purpose**: Reusable templates for content creation
- **Key Features**:
  - Template marketplace with sharing
  - Version control and ratings
  - Custom template creation
  - Usage analytics

#### 15. **API Management** (`automation.go`)
- **APIKey**: Secure API access management
- **APIUsage**: Comprehensive usage tracking
- **Webhook**: Event-driven integrations
- **Key Features**: Rate limiting, scope management, analytics

### 🌟 Social & Community Features

#### 16. **Social System** (`social.go`)
- **Follow**: User following relationships
- **UserProfile**: Extended profile information
- **CommunityPost**: Social feed and content sharing
- **Key Features**:
  - Privacy controls and content sharing
  - Engagement metrics (likes, comments, shares)
  - Community challenges and contests

#### 17. **Gamification** (`social.go`)
- **Badge**: Achievement system with rarity levels
- **Challenge**: Community challenges and competitions
- **Key Features**:
  - Achievement tracking and rewards
  - Leaderboards and competitions
  - Community engagement incentives

#### 18. **Content Interaction** (`social.go`)
- **Comment**: Multi-level commenting system
- **PostLike**: Engagement tracking
- **Key Features**:
  - Threaded discussions
  - Reaction types and sentiment
  - Moderation tools

## 🎯 Key Design Principles

### 1. **Scalability First**
- UUID primary keys for distributed systems
- Efficient indexing strategy
- Optimized for high-volume operations
- Horizontal scaling support

### 2. **Flexibility & Extensibility**
- JSON metadata fields for custom data
- Modular design with clear separation
- Plugin architecture support
- Future-proof data structures

### 3. **Security & Privacy**
- Granular permission system
- Data encryption support
- Audit logging for compliance
- GDPR/CCPA compliance ready

### 4. **Performance Optimization**
- Strategic indexing for common queries
- Efficient relationship modeling
- Caching-friendly design
- Bulk operation support

## 🔧 Technical Features

### Database Support
- **Primary**: PostgreSQL with advanced features
- **Migrations**: Automated with GORM
- **Indexing**: Optimized for common query patterns
- **Constraints**: Referential integrity and data validation

### API Integration
- **YouTube API**: Full metadata and content integration
- **AI Services**: Multiple AI provider support
- **Webhooks**: Real-time event notifications
- **Rate Limiting**: Comprehensive quota management

### Data Export/Import
- **Formats**: JSON, CSV, XML, HTML, PDF
- **Scope**: Granular selection of data
- **Scheduling**: Automated export jobs
- **Compliance**: GDPR data portability

## 🚀 Getting Started

### 1. **Database Setup**
```go
// Initialize database with all models
db, err := database.NewDatabase(cfg)
if err != nil {
    log.Fatal().Err(err).Msg("Failed to connect to database")
}

// Run migrations
if err := db.RunMigrations(); err != nil {
    log.Fatal().Err(err).Msg("Failed to run migrations")
}
```

### 2. **Create New User**
```go
// Create user
user := &models.User{
    Email:    "user@example.com",
    Name:     "John Doe",
    Auth0ID:  "auth0|123456",
    Auth0Sub: "auth0|123456",
    Plan:     models.PlanFree,
}

if err := db.Create(user).Error; err != nil {
    return err
}

// Setup user defaults
models.CreateDefaultTags(db, user.ID)
models.CreateDefaultCollections(db, user.ID)
models.CreateUserProfile(db, user.ID)
models.CreateDefaultBadges(db) // System-wide badges
```

### 3. **Add Video with AI Processing**
```go
// Create video
video := &models.Video{
    UserID:      userID,
    YouTubeID:   "dQw4w9WgXcQ",
    Title:       "Never Gonna Give You Up",
    Duration:    212,
    Status:      models.VideoStatusProcessing,
}

if err := db.Create(video).Error; err != nil {
    return err
}

// Trigger AI processing
automation := &models.Automation{
    UserID:        userID,
    Name:          "Auto-process new video",
    Type:          models.AutomationTypeVideoProcessing,
    TriggerType:   models.TriggerTypeVideoAdded,
    ActionType:    models.ActionTypeGenerateInsights,
    IsActive:      true,
}

// Process with AI insights
aiInsight := &models.AIInsight{
    UserID:      userID,
    VideoID:     &video.ID,
    Type:        models.AIInsightTypeSummary,
    Title:       "Video Summary",
    Content:     "AI-generated summary...",
    Confidence:  0.95,
}
```

### 4. **Create Workspace**
```go
// Enterprise workspace
workspace := &models.Workspace{
    OwnerID:     userID,
    Name:        "Acme Corp",
    Domain:      "acme-corp",
    Plan:        models.WorkspacePlanBusiness,
    MaxMembers:  50,
}

if err := db.Create(workspace).Error; err != nil {
    return err
}

// Add team members
member := &models.WorkspaceMember{
    WorkspaceID: workspace.ID,
    UserID:      memberUserID,
    Role:        models.WorkspaceRoleMember,
    Status:      models.MemberStatusActive,
}
```

## 📊 Analytics & Reporting

### Built-in Analytics
- **User Engagement**: Video views, clip creation, playlist usage
- **Content Performance**: Popular videos, trending clips
- **Social Metrics**: Community engagement, follower growth
- **Usage Patterns**: Feature adoption, user journey analysis

### Custom Reporting
- **Export System**: Flexible data export with filtering
- **API Analytics**: Usage tracking and quota management
- **Automation Metrics**: Workflow performance and optimization
- **AI Insights**: Model performance and accuracy tracking

## 🔐 Security Features

### Authentication & Authorization
- **Auth0 Integration**: Enterprise-grade authentication
- **Role-Based Access**: Granular permissions system
- **API Security**: Rate limiting and key management
- **Audit Logging**: Complete activity tracking

### Data Protection
- **Encryption**: Sensitive data encryption at rest
- **Privacy Controls**: Granular sharing permissions
- **Compliance**: GDPR, CCPA, and SOC2 ready
- **Data Retention**: Configurable retention policies

## 🌐 Multi-Tenancy Support

### Workspace Architecture
- **Isolated Data**: Complete data separation per workspace
- **Shared Resources**: Efficient resource sharing
- **Custom Branding**: White-label support
- **Billing Integration**: Per-workspace billing

### Scalability Features
- **Horizontal Scaling**: Database sharding support
- **Caching Strategy**: Multi-level caching
- **CDN Integration**: Global content delivery
- **Load Balancing**: Auto-scaling infrastructure

## 📈 Future Roadmap

### Phase 1: Core Features (Complete)
- ✅ User management and authentication
- ✅ Video and clip management
- ✅ Playlist and organization features
- ✅ Basic analytics and reporting

### Phase 2: Advanced Features (Complete)
- ✅ AI integration and insights
- ✅ Automation and workflows
- ✅ Enterprise workspace features
- ✅ Social and community features

### Phase 3: Next Generation (Future)
- 🔄 Real-time collaboration
- 🔄 Advanced AI features (GPT-4, vision models)
- 🔄 Mobile app synchronization
- 🔄 Advanced analytics and ML insights
- 🔄 Plugin marketplace
- 🔄 Advanced integrations (Zoom, Meet, etc.)

## 📞 Support & Documentation

### Developer Resources
- **API Documentation**: Complete REST API reference
- **SDK Libraries**: Multiple language support
- **Code Examples**: Comprehensive example library
- **Community**: Developer community and support

### Enterprise Support
- **Dedicated Support**: 24/7 enterprise support
- **Custom Development**: Tailored solutions
- **Training Programs**: Team training and onboarding
- **Migration Services**: Data migration assistance

This comprehensive database schema provides the foundation for a world-class YouTube Clipper SaaS platform, supporting everything from individual users to large enterprise deployments with advanced AI, automation, and social features.
