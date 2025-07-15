package transport

import (
	"context"
	"encoding/json"
	"free_toilet_map/toilet/endpoint"
	models "free_toilet_map/toilet/model"
	"log"
	"net/http"

	httptransport "github.com/go-kit/kit/transport/http"
	"github.com/gorilla/mux"
)

func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Если это preflight-запрос от браузера (OPTIONS), сразу отвечаем 200
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		h.ServeHTTP(w, r)
	})
}


func methodOnly(method string, h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Println("Incoming:", r.Method, r.URL.Path) // ← Добавь это
		if r.Method != method {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}
		h.ServeHTTP(w, r)
	})
}



func NewHTTPHandler(e endpoint.Endpoints) http.Handler {
	mux := mux.NewRouter() // Используем mux.NewRouter(), чтобы работать с параметрами маршрута

	mux.Handle("/user/create", methodOnly("POST", httptransport.NewServer(
		e.CreateUser,
		decodeJSONRequest,
		encodeResponse,
	)))

	mux.Handle("/login", httptransport.NewServer(
		e.Login,
		decodeJSONRequest,
		encodeResponse,
	))

	mux.Handle("/toilets", httptransport.NewServer(
		e.ListToilets,
		func(_ context.Context, r *http.Request) (interface{}, error) { return nil, nil },
		encodeResponse,
	))

	mux.Handle("/toilet/add", AuthMiddleware(httptransport.NewServer(
		e.AddToilet,
		decodeJSONToilet,
		encodeResponse,
	)))

	mux.Handle("/review/add", AuthMiddleware(httptransport.NewServer(
		e.AddReview,
		decodeJSONReview,
		encodeResponse,
	)))

	// Используем правильный маршрут
	mux.Handle("/toilet/{toiletID}/reviews", methodOnly("GET", httptransport.NewServer(
		e.GetReviewsByToilet,   // Используем конечную точку для получения отзывов
		decodeJSONToiletID,     // Декодируем ID туалета
		encodeResponse,         // Функция для кодирования ответа
	)))

	return withCORS(mux)
}


func decodeJSONRequest(_ context.Context, r *http.Request) (interface{}, error) {
	var req map[string]string
	return decode(r, &req)
}

func decodeJSONReview(_ context.Context, r *http.Request) (interface{}, error) {
	var review models.Review
	return decode(r, &review)
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

func encodeResponse(_ context.Context, w http.ResponseWriter, response interface{}) error {
	return json.NewEncoder(w).Encode(response)
}


// Функция декодирования ID туалета из URL
func decodeJSONToiletID(_ context.Context, r *http.Request) (interface{}, error) {
    vars := mux.Vars(r)  // Извлекаем переменные из URL
    toiletID := vars["toiletID"]
	log.Println("Toilet ID:", toiletID)

    return toiletID, nil  // Возвращаем ID туалета
}
