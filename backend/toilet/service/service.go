package service

import (
	"fmt"
	models "free_toilet_map/toilet/model"
	"free_toilet_map/toilet/repository"
	"log"
)

type Service struct {
    Repo repository.PostgresRepository
}

// NewService creates a new service instance with the provided repository
func NewService(repo repository.PostgresRepository) *Service {
    return &Service{Repo: repo}
}

// CreateUser creates a new user by interacting with the repository
func (s *Service) CreateUser(user models.User) (models.User, error) {
    return s.Repo.CreateUser(user)
}

// GetUserByUsername retrieves a user by their username
func (s *Service) GetUserByUsername(username string) (models.User, error) {
    return s.Repo.GetUserByUsername(username)
}

// ListToilets retrieves all toilets from the repository
func (s *Service) ListToilets() ([]models.Toilet, error) {
    return s.Repo.GetAllToilets()
}

// AddToilet adds a new toilet by interacting with the repository
func (s *Service) AddToilet(toilet models.Toilet) (models.Toilet, error) {
    return s.Repo.AddToilet(toilet)
}

// DeleteToilet deletes a toilet by interacting with the repository
func (s *Service) DeleteToilet(toiletID, userID int) error {
    log.Println("FLAG4")
    return s.Repo.DeleteToilet(toiletID, userID)
}

// AddReview adds a review for a toilet
func (s *Service) AddReview(review models.Review) error {

	// Ensure all required fields are provided
	if review.UserID == 0 || review.ToiletID == 0 {
		return fmt.Errorf("missing required fields")
	}

	// Add review to the database
	return s.Repo.AddReview(review)
}


// GetReviewsByToilet retrieves all reviews for a specific toilet
func (s *Service) GetReviewsByToilet(toiletID int) ([]models.Review, error) {
    return s.Repo.GetReviewsByToilet(toiletID)
}
