package endpoint

import (
	"context"
	"errors"
	"free_toilet_map/toilet/auth"
	models "free_toilet_map/toilet/model"
	"free_toilet_map/toilet/service"
	"time"

	"github.com/go-kit/kit/endpoint"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Endpoints struct {
	CreateUser  endpoint.Endpoint
	ListToilets endpoint.Endpoint
	AddReview   endpoint.Endpoint
    AddToilet endpoint.Endpoint
	Login       endpoint.Endpoint
}

func MakeEndpoints(svc service.Service) Endpoints {
	return Endpoints{
		CreateUser:  makeCreateUserEndpoint(svc),
		ListToilets: makeListToiletsEndpoint(svc),
		AddReview:   makeAddReviewEndpoint(svc),
        AddToilet: makeAddToiletEndpoint(svc),
		Login:       makeLoginEndpoint(svc),
	}
}

func makeLoginEndpoint(svc service.Service) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(*map[string]string)
        if !ok {
            return nil, errors.New("invalid request format")
        }

		username := (*req)["username"]
		password := (*req)["password"]

		user, err := svc.GetUserByUsername(username)
		if err != nil {
			return nil, err
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
			return nil, errors.New("invalid credentials")
		}

		// создаём JWT
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"user_id": user.ID,
			"exp":     time.Now().Add(72 * time.Hour).Unix(),
		})

		tokenString, err := token.SignedString([]byte("secret_key"))
		if err != nil {
			return nil, err
		}

		return map[string]string{"token": tokenString}, nil
	}
}

func makeAddToiletEndpoint(s service.Service) endpoint.Endpoint {
    return func(ctx context.Context, request interface{}) (interface{}, error) {
        toiletPtr, ok := request.(*models.Toilet)
        if !ok {
            return nil, errors.New("invalid request format")
        }
        toilet := *toiletPtr

        userID, ok := auth.GetUserID(ctx)
        if !ok {
            return nil, errors.New("unauthorized")
        }

        toilet.FounderID = userID
        if err := s.AddToilet(toilet); err != nil {
            return nil, err
        }

        return map[string]string{"status": "ok"}, nil
    }
}



func makeCreateUserEndpoint(s service.Service) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(*map[string]string)
        if !ok {
            return nil, errors.New("invalid request format")
        }

		user, err := s.CreateUser((*req)["username"], (*req)["password"])
		if err != nil {
			return nil, err
		}
		// не возвращаем пароль
		return map[string]interface{}{
			"id":            user.ID,
			"username":      user.Username,
			"toilets_found": user.ToiletsFound,
		}, nil
	}
}

func makeListToiletsEndpoint(s service.Service) endpoint.Endpoint {
	return func(ctx context.Context, _ interface{}) (interface{}, error) {
		return s.ListToilets()
	}
}

func makeAddReviewEndpoint(s service.Service) endpoint.Endpoint {
    return func(ctx context.Context, request interface{}) (interface{}, error) {
        reviewPtr := request.(*models.Review)

        userID, ok := auth.GetUserID(ctx)
        if !ok {
            return nil, errors.New("unauthorized")
        }

        reviewPtr.UserID = userID

        err := s.AddReview(*reviewPtr)
        if err != nil {
            return nil, err
        }

        return map[string]string{"status": "ok"}, nil

    }
}
