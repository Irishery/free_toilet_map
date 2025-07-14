package transport

import (
	"net/http"
	"strings"

	"free_toilet_map/toilet/auth"

	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        tokenStr := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")

        token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
            return []byte("secret_key"), nil
        })

        if err != nil || !token.Valid {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }

        claims, ok := token.Claims.(jwt.MapClaims)
        if !ok {
            http.Error(w, "Invalid token claims", http.StatusUnauthorized)
            return
        }

        userID, ok := claims["user_id"].(float64)
        if !ok {
            http.Error(w, "Invalid user_id", http.StatusUnauthorized)
            return
        }

        ctx := auth.WithUserID(r.Context(), int(userID))
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
