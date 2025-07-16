package transport

import (
	"context"
	"encoding/json"
	"errors"
	"free_toilet_map/toilet/endpoint"
	models "free_toilet_map/toilet/model"
	"log"
	"net/http"

	httptransport "github.com/go-kit/kit/transport/http"
	"github.com/gorilla/mux"
)

// CORS middleware to handle cross-origin requests
func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		h.ServeHTTP(w, r)
	})
}

// MethodOnly ensures the correct HTTP method is used
func methodOnly(method string, h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Println("Incoming:", r.Method, r.URL.Path)
		if r.Method != method {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}
		h.ServeHTTP(w, r)
	})
}

// NewHTTPHandler creates and returns the HTTP handler for the application
func NewHTTPHandler(e endpoint.Endpoints) http.Handler {
	mux := mux.NewRouter()

	// User creation route
	mux.Handle("/user/create", methodOnly("POST", httptransport.NewServer(
		e.CreateUser,
		decodeJSONRequest,
		encodeResponse,
	)))

	// Login route
	mux.Handle("/login", httptransport.NewServer(
		e.Login,
		decodeJSONRequest,
		encodeResponse,
	))

	// Toilets listing route
	mux.Handle("/toilets", httptransport.NewServer(
		e.ListToilets,
		func(_ context.Context, r *http.Request) (interface{}, error) { return nil, nil },
		encodeResponse,
	))

	// Add toilet (requires authentication)
	mux.Handle("/toilet/add", AuthMiddleware(httptransport.NewServer(
		e.AddToilet,
		decodeJSONToilet,
		encodeResponse,
	)))

	// Add review (requires authentication)
	mux.Handle("/review/add", AuthMiddleware(httptransport.NewServer(
		e.AddReview,
		decodeJSONReview,
		encodeResponse,
	)))

	// Get reviews by toilet ID
	mux.Handle("/toilet/{toiletID}/reviews", methodOnly("GET", httptransport.NewServer(
		e.GetReviewsByToilet,
		decodeJSONToiletID,
		encodeResponse,
	)))

	// Delete toilet (requires authentication)
	mux.Handle("/toilet/delete", AuthMiddleware(httptransport.NewServer(
		e.DeleteToilet,
		decodeJSONDeleteToilet,
		encodeResponse,
	)))

	return withCORS(mux) // Apply CORS middleware
}

// Decoding functions for different routes

func decodeJSONRequest(_ context.Context, r *http.Request) (interface{}, error) {
	var req map[string]string
	return decode(r, &req)
}

func decodeJSONReview(_ context.Context, r *http.Request) (interface{}, error) {
	var review models.Review
	res, err := decode(r, &review)
	if err != nil {
		return res, err
	}
	return res, nil
}

func decodeJSONToilet(_ context.Context, r *http.Request) (interface{}, error) {
    var toilet models.Toilet
    return decode(r, &toilet)
}

func decode(r *http.Request, target interface{}) (interface{}, error) {
	defer r.Body.Close()
	err := json.NewDecoder(r.Body).Decode(target)
	return target, err
}

// Encoding the response to JSON
func encodeResponse(_ context.Context, w http.ResponseWriter, response interface{}) error {
	return json.NewEncoder(w).Encode(response)
}

// Decode toilet ID from URL
func decodeJSONToiletID(_ context.Context, r *http.Request) (interface{}, error) {
    vars := mux.Vars(r)  // Extract variables from URL
    toiletID := vars["toiletID"]

    return toiletID, nil  // Return the toilet ID
}

// Decode delete toilet request
func decodeJSONDeleteToilet(_ context.Context, r *http.Request) (interface{}, error) {
    var req map[string]interface{}  // Используем map[string]interface{} для гибкости
    _, err := decode(r, &req)         // Декодируем запрос
    if err != nil {
        log.Printf("Failed to decode request: %v\n", err)
        return nil, err  // Если произошла ошибка при декодировании, возвращаем её
    }

    // Проверяем, что в запросе есть поле "id" и это число
    if id, ok := req["id"].(float64); ok {  // Проверяем, что id - это число (float64)
        return map[string]int{"id": int(id)}, nil  // Преобразуем id в int и возвращаем
    }

    log.Println("Invalid or missing 'id' field in request")
    return nil, errors.New("invalid or missing 'id' field")  // Если id не существует или не верный формат
}

