package auth

import (
	"context"
)

type contextKey string

const userIDKey contextKey = "user_id"

func WithUserID(ctx context.Context, id int) context.Context {
    return context.WithValue(ctx, userIDKey, id)
}

func GetUserID(ctx context.Context) (int, bool) {
    id, ok := ctx.Value(userIDKey).(int)
    return id, ok
}
