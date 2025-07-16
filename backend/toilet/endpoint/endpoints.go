package endpoint

import (
	"context"
	"errors"
	"free_toilet_map/toilet/auth"
	models "free_toilet_map/toilet/model"
	"free_toilet_map/toilet/service"
	"log"
	"strconv"
	"time"

	"github.com/go-kit/kit/endpoint"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Endpoints struct {
	CreateUser         endpoint.Endpoint
	ListToilets        endpoint.Endpoint
	AddReview          endpoint.Endpoint
	AddToilet          endpoint.Endpoint
	Login              endpoint.Endpoint
	GetReviewsByToilet endpoint.Endpoint
	DeleteToilet       endpoint.Endpoint
}

func MakeEndpoints(svc service.Service) Endpoints {
	return Endpoints{
		CreateUser:         makeCreateUserEndpoint(svc),
		ListToilets:        makeListToiletsEndpoint(svc),
		AddReview:          makeAddReviewEndpoint(svc),
		AddToilet:          makeAddToiletEndpoint(svc),
		Login:              makeLoginEndpoint(svc),
		GetReviewsByToilet: makeGetReviewsByToiletEndpoint(svc),
		DeleteToilet:       makeDeleteToiletEndpoint(svc),
	}
}

// Login Endpoint
func makeLoginEndpoint(svc service.Service) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(*map[string]string)
		if !ok {
			return nil, errors.New("invalid request format")
		}

		username := (*req)["username"]
		password := (*req)["password"]

		// Validate user credentials
		user, err := svc.GetUserByUsername(username)
		if err != nil {
			return nil, err
		}

		// Validate password using bcrypt
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
			return nil, errors.New("invalid credentials")
		}

		// Generate JWT
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

// AddToilet Endpoint
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
			"id":        savedToilet.ID,
			"founder_id": savedToilet.FounderID,
			"name":      savedToilet.Name,
			"point":     savedToilet.Point,
		}, nil
	}
}
func makeDeleteToiletEndpoint(s service.Service) endpoint.Endpoint {
    return func(ctx context.Context, request interface{}) (interface{}, error) {
        // Декодируем запрос как map[string]int
        reqMap, ok := request.(map[string]int)  // Мы ожидаем, что запрос будет map[string]int
        if !ok {
            log.Printf("Failed to cast request to map[string]int. Got: %T\n", request)
            return nil, errors.New("invalid request format")
        }

		toiletID := reqMap["id"]  // Получаем id как целое число

        // Получаем userID из контекста
        userID, ok := auth.GetUserID(ctx)
        if !ok {
            log.Println("User not authenticated, unable to get user ID.")
            return nil, errors.New("unauthorized")
        }

        // Пытаемся удалить туалет
        err := s.DeleteToilet(toiletID, userID)
        if err != nil {
            log.Printf("Error deleting toilet with ID %d: %v", toiletID, err)
            return nil, err
        }

        // Возвращаем успешный ответ
        return map[string]string{"status": "deleted"}, nil
    }
}



// CreateUser Endpoint
// CreateUser Endpoint
func makeCreateUserEndpoint(s service.Service) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(*map[string]string)
		if !ok {
			return nil, errors.New("invalid request format")
		}

		// Получаем данные пользователя из запроса
		username := (*req)["username"]
		password := (*req)["password"]

		// Хэшируем пароль перед сохранением
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return nil, errors.New("failed to hash password")
		}

		// Создаем структуру пользователя с хэшированным паролем
		user := models.User{
			Username: username,
			Password: string(hashedPassword),
		}

		// Передаем структуру пользователя в сервис для сохранения в базе данных
		createdUser, err := s.CreateUser(user)
		if err != nil {
			return nil, err
		}

		// Возвращаем данные пользователя, не включая пароль
		return map[string]interface{}{
			"id":            createdUser.ID,
			"username":      createdUser.Username,
			"toilets_found": createdUser.ToiletsFound,
		}, nil
	}
}



// ListToilets Endpoint
func makeListToiletsEndpoint(s service.Service) endpoint.Endpoint {
	return func(ctx context.Context, _ interface{}) (interface{}, error) {
		return s.ListToilets()
	}
}

// AddReview Endpoint
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

// GetReviewsByToilet Endpoint
func makeGetReviewsByToiletEndpoint(s service.Service) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		toiletID, ok := request.(string) 
		if !ok {
			return nil, errors.New("invalid request format")
		}

		// Convert string to int
		toiletIDInt, err := strconv.Atoi(toiletID)
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
