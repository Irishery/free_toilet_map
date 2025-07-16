package service

import (
	models "free_toilet_map/toilet/model"
	"free_toilet_map/toilet/repository"

	"golang.org/x/crypto/bcrypt"
)

type Service interface {
    CreateUser(username, password string) (models.User, error)
    ListToilets() ([]models.Toilet, error)
    AddReview(review models.Review) error
    GetUserByUsername(username string) (models.User, error)
    AddToilet(toilet models.Toilet) (models.Toilet, error)
    GetReviewsByToilet(toiletID int) ([]models.Review, error) 
    DeleteToilet(toiletID, userID int) (error)
}



type ToiletService struct {
    repo repository.PostgresRepository
}

func (s *ToiletService) GetUserByUsername(username string) (models.User, error) {
    return s.repo.GetUserByUsername(username)
}

func (s *ToiletService) AddToilet(toilet models.Toilet) (models.Toilet, error) {
    return s.repo.AddToilet(toilet)
}

func (s *ToiletService) DeleteToilet(toiletID, userID int) error {
    return s.repo.DeleteToilet(toiletID, userID)
}


func NewService(repo repository.PostgresRepository) Service {
    return &ToiletService{repo: repo}
}

func (s *ToiletService) CreateUser(username, password string) (models.User, error) {
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return models.User{}, err
    }

    user := models.User{
        Username: username,
        Password: string(hashedPassword),
    }

    user, err = s.repo.CreateUser(user)
    if err != nil {
        return models.User{}, err
    }

    return user, nil
}



func (s *ToiletService) ListToilets() ([]models.Toilet, error) {
    return s.repo.GetAllToilets()
}

func (s *ToiletService) AddReview(r models.Review) error {
    return s.repo.AddReview(r)
}

func (s *ToiletService) GetReviewsByToilet(toiletID int) ([]models.Review, error) {
    return s.repo.GetReviewsByToilet(toiletID)
}
