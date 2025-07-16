package endpoint

import (
	"context"
	"errors"
	"free_toilet_map/toilet/auth"
	models "free_toilet_map/toilet/model"
	"free_toilet_map/toilet/service"
	"strconv"
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
	GetReviewsByToilet  endpoint.Endpoint
	DeleteToilet endpoint.Endpoint
}

func MakeEndpoints(svc service.Service) Endpoints {
	return Endpoints{
		CreateUser:  makeCreateUserEndpoint(svc),
		ListToilets: makeListToiletsEndpoint(svc),
		AddReview:   makeAddReviewEndpoint(svc),
        AddToilet: makeAddToiletEndpoint(svc),
		Login:       makeLoginEndpoint(svc),
		GetReviewsByToilet:   makeGetReviewsByToiletEndpoint(svc),
		DeleteToilet: makeDeleteToiletEndpoint(svc),

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

        userID, ok := auth.GetUserID(ctx)
        if !ok {
            return nil, errors.New("unauthorized")
        }

        toilet := *toiletPtr
        toilet.FounderID = userID

        savedToilet, err := s.AddToilet(toilet)
        if err != nil {
            return nil, err
        }

        return map[string]interface{}{
            "id":    savedToilet.ID,
			"founder_id": savedToilet.FounderID,
            "name":  savedToilet.Name,
            "point": savedToilet.Point,
        }, nil
    }
}

func makeDeleteToiletEndpoint(s service.Service) endpoint.Endpoint {
    return func(ctx context.Context, request interface{}) (interface{}, error) {
        reqMap, ok := request.(map[string]interface{})
        if !ok {
            return nil, errors.New("invalid request format")
        }

        idFloat, ok := reqMap["id"].(float64) // JSON числа приходят как float64
        if !ok {
            return nil, errors.New("invalid id format")
        }
        toiletID := int(idFloat)

        userID, ok := auth.GetUserID(ctx)
        if !ok {
            return nil, errors.New("unauthorized")
        }

        err := s.DeleteToilet(toiletID, userID)
        if err != nil {
            return nil, err
        }

        return map[string]string{"status": "deleted"}, nil
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

// В файле 'endpoint/endpoints.go'

func makeGetReviewsByToiletEndpoint(s service.Service) endpoint.Endpoint {
    return func(ctx context.Context, request interface{}) (interface{}, error) {
        toiletID, ok := request.(string)  // Получаем ID туалета как строку
        if !ok {
            return nil, errors.New("invalid request format")
        }

        // Преобразуем строку в int
        toiletIDInt, err := strconv.Atoi(toiletID)
		println(toiletID)
        if err != nil {
            return nil, errors.New("invalid toilet ID")
        }

        reviews, err := s.GetReviewsByToilet(toiletIDInt)
        if err != nil {
            return nil, err
        }

        return reviews, nil
    }
}
