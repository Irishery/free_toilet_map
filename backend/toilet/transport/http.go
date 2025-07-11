package transport

import (
	"context"
	"encoding/json"
	"free_toilet_map/toilet/endpoint"
	models "free_toilet_map/toilet/model"
	"net/http"

	httptransport "github.com/go-kit/kit/transport/http"
)

func NewHTTPHandler(e endpoint.Endpoints) http.Handler {
    mux := http.NewServeMux()

    mux.Handle("/user/create", httptransport.NewServer(
        e.CreateUser,
        decodeJSONRequest,
        encodeResponse,
    ))

    mux.Handle("/toilets", httptransport.NewServer(
        e.ListToilets,
        func(_ context.Context, r *http.Request) (interface{}, error) { return nil, nil },
        encodeResponse,
    ))

    mux.Handle("/review/add", httptransport.NewServer(
        e.AddReview,
        decodeJSONReview,
        encodeResponse,
    ))

    return mux
}

func decodeJSONRequest(_ context.Context, r *http.Request) (interface{}, error) {
    var req map[string]string
    return decode(r, &req)
}

func decodeJSONReview(_ context.Context, r *http.Request) (interface{}, error) {
    var review models.Review
    return decode(r, &review)
}

func decode(r *http.Request, target interface{}) (interface{}, error) {
    defer r.Body.Close()
    err := json.NewDecoder(r.Body).Decode(target)
    return target, err
}

func encodeResponse(_ context.Context, w http.ResponseWriter, response interface{}) error {
    return json.NewEncoder(w).Encode(response)
}
