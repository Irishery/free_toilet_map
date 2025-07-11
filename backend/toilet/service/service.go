package service

import (
	models "free_toilet_map/toilet/model"
	"free_toilet_map/toilet/repository"
)

type Service interface {
    CreateUser(username, password string) (models.User, error)
    ListToilets() ([]models.Toilet, error)
    AddReview(review models.Review) error
}

type toiletService struct {
    repo repository.Repository
}

func NewService(repo repository.Repository) Service {
    return &toiletService{repo: repo}
}

func (s *toiletService) CreateUser(username, password string) (models.User, error) {
    return s.repo.CreateUser(models.User{Username: username, Password: password})
}

func (s *toiletService) ListToilets() ([]models.Toilet, error) {
    return s.repo.GetAllToilets()
}

func (s *toiletService) AddReview(r models.Review) error {
    return s.repo.AddReview(r)
}
