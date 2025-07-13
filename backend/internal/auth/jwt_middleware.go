package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type AuthMiddleware struct {
	jwtService *JWTService
	config     *config.AuthConfig
	db         *database.Database
}

func NewAuthMiddleware(jwtService *JWTService, config *config.AuthConfig, db *database.Database) *AuthMiddleware {
	return &AuthMiddleware{
		jwtService: jwtService,
		config:     config,
		db:         db,
	}
}

func (a *AuthMiddleware) JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := a.extractToken(c)
		if token == "" {
			middleware.RespondWithError(c, http.StatusUnauthorized, "NO_TOKEN", "No authentication token provided", nil)
			c.Abort()
			return
		}

		claims, err := a.jwtService.ValidateAccessToken(token)
		if err != nil {
			middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid token", nil)
			c.Abort()
			return
		}

		var user models.User

		err = a.db.DB.NewSelect().Model(&user).Where("id = ?", claims.UserID).Scan(context.Background())
		if err != nil {
			middleware.RespondWithError(c, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid or expired token", nil)
			c.Abort()
			return
		}

		a.setUserContext(c, &user)
		c.Next()
	}
}

func (a *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return a.JWTMiddleware()
}

func (a *AuthMiddleware) extractToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimPrefix(authHeader, "Bearer ")
	}

	if token, err := c.Cookie("access_token"); err == nil {
		return token
	}

	return ""
}

// func (a *AuthMiddleware) extractRefreshToken(c *gin.Context) string {
// 	if token, err := c.Cookie("refresh_token"); err == nil {
// 		return token
// 	}
// 	return ""
// }

// func (a *AuthMiddleware) setAuthCookies(c *gin.Context, tokenPair *TokenPair) {
// 	c.SetCookie("access_token", tokenPair.AccessToken, int(tokenPair.ExpiresIn), "/", a.config.CookieDomain, a.config.CookieSecure, a.config.CookieHTTPOnly)
//
// 	c.SetCookie("refresh_token", tokenPair.RefreshToken, int(7*24*60*60), "/", a.config.CookieDomain, a.config.CookieSecure, a.config.CookieHTTPOnly)
// }

func (a *AuthMiddleware) setUserContext(c *gin.Context, user *models.User) {
	c.Set("user_id", user.ID.String())
	c.Set("user_email", user.Email)
	c.Set("user_name", user.Name)
	c.Set("user_picture", user.Picture)
	c.Set("user_google_id", user.GoogleID)
	c.Set("user_provider", user.Provider)
	c.Set("user_email_verified", user.EmailVerified)
	c.Set("user_has_password", user.Password != "")
	c.Set("user", user)
}

func GetUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	userIDStr, ok := userID.(string)
	return userIDStr, ok
}

func GetUserEmail(c *gin.Context) (string, bool) {
	email, exists := c.Get("user_email")
	if !exists {
		return "", false
	}
	emailStr, ok := email.(string)
	return emailStr, ok
}

func GetUserName(c *gin.Context) (string, bool) {
	name, exists := c.Get("user_name")
	if !exists {
		return "", false
	}
	nameStr, ok := name.(string)
	return nameStr, ok
}

func GetUserPicture(c *gin.Context) (string, bool) {
	picture, exists := c.Get("user_picture")
	if !exists {
		return "", false
	}
	pictureStr, ok := picture.(string)
	return pictureStr, ok
}

func GetClaims(c *gin.Context) (*AccessTokenClaims, bool) {
	claims, exists := c.Get("claims")
	if !exists {
		return nil, false
	}
	accessClaims, ok := claims.(*AccessTokenClaims)
	return accessClaims, ok
}

func GetUser(c *gin.Context) (*models.User, bool) {
	user, exists := c.Get("user")
	if !exists {
		return nil, false
	}
	userObj, ok := user.(*models.User)
	return userObj, ok
}

// GetUserGoogleID returns the user's Google ID from context
func GetUserGoogleID(c *gin.Context) (string, bool) {
	googleID, exists := c.Get("user_google_id")
	if !exists {
		return "", false
	}
	googleIDStr, ok := googleID.(string)
	return googleIDStr, ok
}

// GetUserProvider returns the user's authentication provider from context
func GetUserProvider(c *gin.Context) (*string, bool) {
	provider, exists := c.Get("user_provider")
	if !exists {
		return nil, false
	}
	providerPtr, ok := provider.(*string)
	return providerPtr, ok
}

func GetUserEmailVerified(c *gin.Context) (bool, bool) {
	verified, exists := c.Get("user_email_verified")
	if !exists {
		return false, false
	}
	verifiedBool, ok := verified.(bool)
	return verifiedBool, ok
}

func GetUserHasPassword(c *gin.Context) (bool, bool) {
	hasPassword, exists := c.Get("user_has_password")
	if !exists {
		return false, false
	}
	hasPasswordBool, ok := hasPassword.(bool)
	return hasPasswordBool, ok
}
