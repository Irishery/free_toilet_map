package endpoint

import (
	"context"
	models "free_toilet_map/toilet/model"
	"free_toilet_map/toilet/service"

	kit "github.com/go-kit/kit/endpoint"
)

type Endpoints struct {
    CreateUser   kit.Endpoint
    ListToilets  kit.Endpoint
    AddReview    kit.Endpoint
}


func MakeEndpoints(svc service.Service) Endpoints {
    return Endpoints{
        CreateUser: makeCreateUserEndpoint(svc),
        ListToilets: makeListToiletsEndpoint(svc),
        AddReview: makeAddReviewEndpoint(svc),
    }
}

func makeCreateUserEndpoint(s service.Service) kit.Endpoint {
    return func(ctx context.Context, request interface{}) (interface{}, error) {
        req := request.(map[string]string)
        return s.CreateUser(req["username"], req["password"])
    }
}

func makeListToiletsEndpoint(s service.Service) kit.Endpoint {
    return func(ctx context.Context, _ interface{}) (interface{}, error) {
        return s.ListToilets()
    }
}

func makeAddReviewEndpoint(s service.Service) kit.Endpoint {
    return func(ctx context.Context, request interface{}) (interface{}, error) {
        review := request.(models.Review)
        err := s.AddReview(review)
        return map[string]string{"status": "ok"}, err
    }
}
