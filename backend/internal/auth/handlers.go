package auth

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
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

func (h *AuthHandlers) GetCurrentUserHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := GetUser(c)
		if !exists {
			middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER", "No user found", nil)
			return
		}

		// Determine available authentication methods
		authMethods := []string{}
		if user.GoogleID != "" {
			authMethods = append(authMethods, "google")
		}
		if user.Password != "" {
			authMethods = append(authMethods, "password")
		}

		// Determine primary provider
		primaryProvider := "password"
		if user.Provider != nil {
			primaryProvider = *user.Provider
		}

		userResponse := gin.H{
			"id":                 user.ID,
			"email":              user.Email,
			"name":               user.Name,
			"picture":            user.Picture,
			"email_verified":     user.EmailVerified,
			"primary_provider":   primaryProvider,
			"auth_methods":       authMethods,
			"has_password":       user.Password != "",
			"has_google_account": user.GoogleID != "",
			"created_at":         user.CreatedAt,
			"updated_at":         user.UpdatedAt,
		}

		middleware.RespondWithOK(c, userResponse)
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

func (h *AuthHandlers) SetupAuthRoutes(r *gin.Engine) {
	auth := r.Group("/auth")
	{
		auth.GET("/google/login", h.googleService.LoginHandler())
		auth.GET("/google/callback", h.googleService.CallbackHandler())

		auth.POST("/register", h.RegisterHandler)
		auth.POST("/login", h.LoginHandler)
		auth.POST("/forgot-password", h.ForgotPasswordHandler)
		auth.POST("/reset-password", h.ResetPasswordHandler)
		auth.POST("/verify-email", h.VerifyEmailHandler)

		auth.POST("/add-password", h.authMiddleware.RequireAuth(), h.AddPasswordHandler)

		auth.POST("/logout", h.googleService.LogoutHandler())
		auth.POST("/refresh", h.googleService.RefreshTokenHandler())

		auth.GET("/me", h.authMiddleware.RequireAuth(), h.GetCurrentUserHandler())
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := context.Background()

	var existingUser models.User
	err := h.db.DB.NewSelect().
		Model(&existingUser).
		Where("email = ?", req.Email).
		Scan(ctx)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	if err = ValidatePassword(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	verificationToken, err := h.emailService.GenerateToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verification token"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	if err := h.emailService.SendVerificationEmail(user.Email, verificationToken); err != nil {
		c.JSON(http.StatusCreated, gin.H{
			"message": "User created successfully, but verification email failed to send",
			"user":    user,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully. Please check your email to verify your account.",
		"user":    user,
	})
}

func (h *AuthHandlers) LoginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "This account uses OAuth login. Please use Google login or add a password first."})
		return
	}

	if err = CheckPassword(req.Password, user.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	/* Skip this for now
	if !user.EmailVerified {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please verify your email before logging in"})
		return
	}
	*/

	accessToken, err := h.jwtService.GenerateAccessToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	refreshToken, err := h.jwtService.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
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

	c.JSON(http.StatusOK, gin.H{
		"message":      "Login successful",
		"user":         user,
		"authMethods":  authMethods,
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	})
}

func (h *AuthHandlers) ForgotPasswordHandler(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusOK, gin.H{
			"message": "If the email exists, a password reset link has been sent.",
		})
		return
	}

	// Generate reset token
	resetToken, err := h.emailService.GenerateToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate reset token"})
		return
	}

	// Update user with reset token
	user.PasswordResetToken = resetToken
	user.PasswordResetExpiry = &[]time.Time{h.emailService.GetTokenExpiry()}[0]

	if err := h.db.Update(ctx, &user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save reset token"})
		return
	}

	// Send reset email
	if err := h.emailService.SendPasswordResetEmail(user.Email, resetToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send reset email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset link sent to your email.",
	})
}

// ResetPasswordHandler handles password reset with token
func (h *AuthHandlers) ResetPasswordHandler(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired reset token"})
		return
	}

	// Validate new password
	if err = ValidatePassword(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash new password
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update user password and clear reset token
	user.Password = hashedPassword
	user.PasswordResetToken = ""
	user.PasswordResetExpiry = nil

	if err := h.db.Update(ctx, &user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successful. You can now login with your new password.",
	})
}

// VerifyEmailHandler handles email verification
func (h *AuthHandlers) VerifyEmailHandler(c *gin.Context) {
	var req VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired verification token"})
		return
	}

	// Update user as verified
	user.EmailVerified = true
	user.EmailVerificationToken = ""
	user.EmailVerificationExpiry = nil

	if err := h.db.Update(ctx, &user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Email verified successfully. You can now login.",
	})
}

// AddPasswordHandler allows users to add password authentication to their Google-only accounts
func (h *AuthHandlers) AddPasswordHandler(c *gin.Context) {
	var req AddPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get current user from context
	user, exists := GetUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	if currentUser.Password != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User already has a password"})
		return
	}

	// Validate password
	if err = ValidatePassword(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update user with password
	currentUser.Password = hashedPassword

	if err := h.db.Update(ctx, &currentUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password added successfully. You can now login with email and password.",
	})
}
