package repository

import (
	"errors"
	models "free_toilet_map/toilet/model"
	"sync"
)

type Repository interface {
    CreateUser(user models.User) (models.User, error)
    GetAllToilets() ([]models.Toilet, error)
    AddReview(review models.Review) error
}

type inMemoryRepo struct {
    mu      sync.Mutex
    users   []models.User
    toilets []models.Toilet
    reviews []models.Review
}

func NewInMemoryRepo() Repository {
    return &inMemoryRepo{}
}

func (r *inMemoryRepo) CreateUser(user models.User) (models.User, error) {
    r.mu.Lock()
    defer r.mu.Unlock()
    user.ID = len(r.users) + 1
    r.users = append(r.users, user)
    return user, nil
}

func (r *inMemoryRepo) GetAllToilets() ([]models.Toilet, error) {
    r.mu.Lock()
    defer r.mu.Unlock()
    return r.toilets, nil
}

func (r *inMemoryRepo) AddReview(review models.Review) error {
    if review.Score < 1 || review.Score > 5 {
        return errors.New("score must be 1–5")
    }
    r.mu.Lock()
    defer r.mu.Unlock()
    review.ID = len(r.reviews) + 1
    r.reviews = append(r.reviews, review)
    return nil
}
