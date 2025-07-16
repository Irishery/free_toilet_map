package auth

import (
	"context"
)

type contextKey string

const userIDKey contextKey = "user_id"

// WithUserID adds the user ID to the request context
func WithUserID(ctx context.Context, userID int) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// GetUserID retrieves the user ID from the request context
func GetUserID(ctx context.Context) (int, bool) {
	userID, ok := ctx.Value(userIDKey).(int)
	return userID, ok
}
