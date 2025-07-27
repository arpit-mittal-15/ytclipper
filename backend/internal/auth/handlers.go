package auth

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type AuthHandlers struct {
	googleService  *GoogleOAuthService
	authMiddleware *AuthMiddleware
	jwtService     *JWTService
	emailService   *EmailService
	db             *database.Database
}

func NewAuthHandlers(googleService *GoogleOAuthService, authMiddleware *AuthMiddleware, jwtService *JWTService, emailService *EmailService, db *database.Database) *AuthHandlers {
	return &AuthHandlers{
		googleService:  googleService,
		authMiddleware: authMiddleware,
		jwtService:     jwtService,
		emailService:   emailService,
		db:             db,
	}
}

// GetCurrentUser returns the current authenticated user
func (h *AuthHandlers) GetCurrentUser() gin.HandlerFunc {
	return h.authMiddleware.RequireAuth()
}

func extractExpiryFromToken(tokenStr string) (int64, error) {
	parser := jwt.NewParser()
	token, _, err := parser.ParseUnverified(tokenStr, &jwt.RegisteredClaims{})
	if err != nil {
		return 0, err
	}
	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && claims.ExpiresAt != nil {
		return claims.ExpiresAt.Time.Unix(), nil
	}
	return 0, fmt.Errorf("no expiry in token")
}

func (h *AuthHandlers) GetCurrentUserHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := GetUser(c)
		if !exists {
			middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER", "No user found", nil)
			return
		}

		authMethods := []string{}
		if user.GoogleID != "" {
			authMethods = append(authMethods, "google")
		}
		if user.Password != "" {
			authMethods = append(authMethods, "password")
		}

		// primaryProvider := "password"
		// if user.Provider != nil {
		// primaryProvider = *user.Provider
		// }

		accessToken, err1 := c.Cookie("access_token")
		refreshToken, err2 := c.Cookie("refresh_token")

		var accessTokenExpiry int64
		var refreshTokenExpiry int64

		if err1 == nil {
			if exp, err := extractExpiryFromToken(accessToken); err == nil {
				accessTokenExpiry = exp
			}
		}

		if err2 == nil {
			if exp, err := extractExpiryFromToken(refreshToken); err == nil {
				refreshTokenExpiry = exp
			}
		}

		response := gin.H{
			"user":                 user,
			"auth_methods":         authMethods,
			"access_token":         accessToken,
			"refresh_token":        refreshToken,
			"access_token_expiry":  accessTokenExpiry,
			"refresh_token_expiry": refreshTokenExpiry,
		}

		middleware.RespondWithOK(c, response)
	}
}

// GetAccessToken returns the current access token (for API usage)
func (h *AuthHandlers) GetAccessToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		accessToken, err := c.Cookie("access_token")
		if err != nil {
			middleware.RespondWithError(c, http.StatusUnauthorized, "NO_TOKEN", "No access token found", nil)
			return
		}

		middleware.RespondWithOK(c, gin.H{
			"access_token": accessToken,
		})
	}
}

// RefreshTokenHandler handles refreshing access tokens using refresh tokens
func (h *AuthHandlers) RefreshTokenHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get refresh token from cookie
		refreshToken, err := c.Cookie("refresh_token")
		if err != nil {
			middleware.RespondWithError(c, http.StatusUnauthorized, "NO_REFRESH_TOKEN", "No refresh token found", nil)
			return
		}

		// Generate new token pair
		tokenPair, err := h.jwtService.RefreshAccessToken(refreshToken)
		if err != nil {
			log.Error().Err(err).Msg("Failed to refresh token")
			middleware.RespondWithError(c, http.StatusUnauthorized, "REFRESH_ERROR", "Failed to refresh token", nil)
			return
		}

		// Set new cookies
		h.jwtService.SetTokenCookies(c, tokenPair.AccessToken, tokenPair.RefreshToken)

		// Return new tokens
		middleware.RespondWithOK(c, tokenPair)
	}
}

func (h *AuthHandlers) SetupAuthRoutes(r *gin.Engine) {
	v1 := r.Group("/api/v1")

	auth := v1.Group("/auth")
	{
		auth.GET("/google/login", h.googleService.LoginHandler())
		auth.GET("/google/callback", h.googleService.CallbackHandler())

		auth.POST("/register", h.RegisterHandler)
		auth.POST("/login", h.LoginHandler)
		auth.POST("/forgot-password", h.ForgotPasswordHandler)
		auth.POST("/reset-password", h.ResetPasswordHandler)
		auth.POST("/verify-email", h.VerifyEmailHandler)
		auth.GET("/status", h.authMiddleware.RequireAuth(), h.AuthStatusHandler)

		auth.POST("/add-password", h.authMiddleware.RequireAuth(), h.AddPasswordHandler)

		auth.POST("/logout", h.googleService.LogoutHandler())
		auth.POST("/refresh", h.RefreshTokenHandler())

		auth.GET("/token", h.authMiddleware.RequireAuth(), h.GetAccessToken())
	}
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// ForgotPasswordRequest represents the forgot password request payload
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordRequest represents the reset password request payload
type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

// VerifyEmailRequest represents the email verification request payload
type VerifyEmailRequest struct {
	Token string `json:"token" binding:"required"`
}

// AddPasswordRequest represents the request to add password authentication
type AddPasswordRequest struct {
	Password string `json:"password" binding:"required,min=8"`
}

func (h *AuthHandlers) RegisterHandler(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	ctx := context.Background()

	var existingUser models.User
	err := h.db.DB.NewSelect().
		Model(&existingUser).
		Where("email = ?", req.Email).
		Scan(ctx)
	if err == nil {
		middleware.RespondWithError(c, http.StatusConflict, "USER_EXISTS", "User with this email already exists", nil)
		return
	}

	if err = ValidatePassword(req.Password); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_PASSWORD", "Invalid password", err.Error())
		return
	}

	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "HASHING_ERROR", "Failed to hash password", err.Error())
		return
	}

	verificationToken, err := h.emailService.GenerateToken()
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "TOKEN_GENERATION_ERROR", "Failed to generate verification token", err.Error())
		return
	}

	user := models.User{
		Name:                    req.Name,
		Email:                   req.Email,
		Password:                hashedPassword,
		EmailVerified:           false,
		EmailVerificationToken:  verificationToken,
		EmailVerificationExpiry: &[]time.Time{h.emailService.GetTokenExpiry()}[0],
	}

	if err := h.db.Create(ctx, &user); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "USER_CREATION_ERROR", "Failed to create user", err.Error())
		return
	}

	if err := h.emailService.SendVerificationEmail(user.Email, verificationToken); err != nil {
		middleware.RespondWithOK(c, gin.H{
			"message": "User created successfully. Please check your email to verify your account.",
			"user":    user,
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "User created successfully. Please check your email to verify your account.",
		"user":    user,
	})
}

func (h *AuthHandlers) LoginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	ctx := context.Background()

	var user models.User
	err := h.db.DB.NewSelect().
		Model(&user).
		Where("email = ?", req.Email).
		Scan(ctx)
	if err != nil {
		middleware.RespondWithError(c, 404, "USER_NOT_FOUND", "user not found", nil)
		return
	}

	if user.Password == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "OAUTH_ONLY", "This account uses OAuth login. Please use Google login or add a password first.", nil)
		return
	}

	if err = CheckPassword(req.Password, user.Password); err != nil {
		middleware.RespondWithError(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid credentials", nil)
		return
	}

	/* Skip this for now
	if !user.EmailVerified {
		middleware.RespondWithError(c, http.StatusUnauthorized, "EMAIL_NOT_VERIFIED", "Please verify your email before logging in", nil)
		return
	}
	*/

	accessToken, accessTokenExpiry, err := h.jwtService.GenerateAccessToken(user.ID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "TOKEN_GENERATION_ERROR", "Failed to generate access token", nil)
		return
	}

	refreshToken, refreshTokenExpiry, err := h.jwtService.GenerateRefreshToken(user.ID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "TOKEN_GENERATION_ERROR", "Failed to generate refresh token", nil)
		return
	}

	h.jwtService.SetTokenCookies(c, accessToken, refreshToken)

	authMethods := []string{}
	if user.GoogleID != "" {
		authMethods = append(authMethods, "google")
	}
	if user.Password != "" {
		authMethods = append(authMethods, "password")
	}

	response := gin.H{
		"message":              "Login successful",
		"user":                 user,
		"authMethods":          authMethods,
		"access_token":         accessToken,
		"refresh_token":        refreshToken,
		"access_token_expiry":  accessTokenExpiry,
		"refresh_token_expiry": refreshTokenExpiry,
	}

	middleware.RespondWithOK(c, response)
}

func (h *AuthHandlers) ForgotPasswordHandler(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	ctx := context.Background()

	// Find user by email
	var user models.User
	err := h.db.DB.NewSelect().
		Model(&user).
		Where("email = ?", req.Email).
		Scan(ctx)
	if err != nil {
		// Don't reveal if email exists or not
		middleware.RespondWithOK(c, gin.H{
			"message": "If the email exists, a password reset link has been sent.",
		})
		return
	}

	// Generate reset token
	resetToken, err := h.emailService.GenerateToken()
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "TOKEN_GENERATION_ERROR", "Failed to generate reset token", err.Error())
		return
	}

	// Update user with reset token
	user.PasswordResetToken = resetToken
	user.PasswordResetExpiry = &[]time.Time{h.emailService.GetTokenExpiry()}[0]

	if err := h.db.Update(ctx, &user); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to save reset token", err.Error())
		return
	}

	// Send reset email
	if err := h.emailService.SendPasswordResetEmail(user.Email, resetToken); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "EMAIL_SENDING_ERROR", "Failed to send password reset email", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Password reset link sent to your email.",
	})
}

// ResetPasswordHandler handles password reset with token
func (h *AuthHandlers) ResetPasswordHandler(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	ctx := context.Background()

	// Find user by reset token
	var user models.User
	err := h.db.DB.NewSelect().
		Model(&user).
		Where("password_reset_token = ? AND password_reset_expiry > ?", req.Token, time.Now()).
		Scan(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_TOKEN", "Invalid or expired reset token", nil)
		return
	}

	// Validate new password
	if err = ValidatePassword(req.Password); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_PASSWORD", "Invalid password", err.Error())
		return
	}

	// Hash new password
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "HASHING_ERROR", "Failed to hash password", err.Error())
		return
	}

	// Update user password and clear reset token
	user.Password = hashedPassword
	user.PasswordResetToken = ""
	user.PasswordResetExpiry = nil

	if err := h.db.Update(ctx, &user); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to update password", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Password reset successful. You can now login with your new password.",
	})
}

// VerifyEmailHandler handles email verification
func (h *AuthHandlers) VerifyEmailHandler(c *gin.Context) {
	var req VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	ctx := context.Background()

	// Find user by verification token
	var user models.User
	err := h.db.DB.NewSelect().
		Model(&user).
		Where("email_verification_token = ? AND email_verification_expiry > ?", req.Token, time.Now()).
		Scan(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_TOKEN", "Invalid or expired verification token", nil)
		return
	}

	// Update user as verified
	user.EmailVerified = true
	user.EmailVerificationToken = ""
	user.EmailVerificationExpiry = nil

	if err := h.db.Update(ctx, &user); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to update user verification status", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Email verified successfully. You can now login.",
	})
}

func (h *AuthHandlers) AuthStatusHandler(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// AddPasswordHandler allows users to add password authentication to their Google-only accounts
func (h *AuthHandlers) AddPasswordHandler(c *gin.Context) {
	var req AddPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	// Get current user from context
	user, exists := GetUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	ctx := context.Background()

	// Check if user already has a password
	var currentUser models.User
	err := h.db.DB.NewSelect().
		Model(&currentUser).
		Where("id = ?", user.ID).
		Scan(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch user", err.Error())
		return
	}

	if currentUser.Password != "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "PASSWORD_EXISTS", "User already has a password", nil)
		return
	}

	// Validate password
	if err = ValidatePassword(req.Password); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_PASSWORD", "Invalid password", err.Error())
		return
	}

	// Hash password
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "HASHING_ERROR", "Failed to hash password", err.Error())
		return
	}

	// Update user with password
	currentUser.Password = hashedPassword

	if err := h.db.Update(ctx, &currentUser); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to update user with password", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Password added successfully. You can now login with email and password.",
	})
}
