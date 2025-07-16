package transport

import (
	"free_toilet_map/toilet/auth"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware checks for a valid JWT token and adds the user_id to the context
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenStr := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")

		// Parse the JWT token
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			// Use your secret key or public key for signature verification
			return []byte("secret_key"), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		// Extract user_id from claims
		userID, ok := claims["user_id"].(float64)
		if !ok {
			http.Error(w, "Invalid user_id", http.StatusUnauthorized)
			return
		}

		// Add user_id to the context
		ctx := auth.WithUserID(r.Context(), int(userID))

		// Pass the context to the next handler
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
