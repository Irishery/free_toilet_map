package repository

import (
	"database/sql"
	"errors"
	"fmt"
	models "free_toilet_map/toilet/model"
)

type PostgresRepository struct {
    db *sql.DB
}

// NewPostgresRepoWithDB creates a new repository using the provided DB connection
func NewPostgresRepoWithDB(db *sql.DB) *PostgresRepository {
    return &PostgresRepository{db: db}
}

// CreateUser creates a new user in the database
func (r *PostgresRepository) CreateUser(user models.User) (models.User, error) {
    query := `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id`
    err := r.db.QueryRow(query, user.Username, user.Password).Scan(&user.ID)
    if err != nil {
        if err.Error() == `pq: duplicate key value violates unique constraint "users_username_key"` {
            return models.User{}, errors.New("username already exists")
        }
        return models.User{}, err
    }
    return user, nil
}

// GetUserByUsername retrieves a user by their username
func (r *PostgresRepository) GetUserByUsername(username string) (models.User, error) {
    var user models.User
    query := `SELECT id, username, password, toilets_found FROM users WHERE username = $1`
    err := r.db.QueryRow(query, username).Scan(&user.ID, &user.Username, &user.Password, &user.ToiletsFound)
    if err == sql.ErrNoRows {
        return user, errors.New("user not found")
    }
    return user, err
}

// GetAllToilets retrieves all toilets from the database
func (r *PostgresRepository) GetAllToilets() ([]models.Toilet, error) {
    query := `SELECT id, founder_id, name, point FROM toilets`
    rows, err := r.db.Query(query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var toilets []models.Toilet
    for rows.Next() {
        var t models.Toilet
        if err := rows.Scan(&t.ID, &t.FounderID, &t.Name, &t.Point); err != nil {
            return nil, err
        }
        toilets = append(toilets, t)
    }
    return toilets, nil
}

// AddToilet adds a new toilet to the database
func (r *PostgresRepository) AddToilet(toilet models.Toilet) (models.Toilet, error) {
    query := `
        INSERT INTO toilets (founder_id, name, point)
        VALUES ($1, $2, $3)
        RETURNING id
    `
    err := r.db.QueryRow(query, toilet.FounderID, toilet.Name, toilet.Point).Scan(&toilet.ID)
    if err != nil {
        return models.Toilet{}, err
    }

    return toilet, nil
}

// DeleteToilet deletes a toilet from the database
func (r *PostgresRepository) DeleteToilet(toiletID, userID int) error {
    result, err := r.db.Exec(`
        DELETE FROM toilets
        WHERE id = $1 AND founder_id = $2
    `, toiletID, userID)

    if err != nil {
        return err
    }

    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return err
    }

    if rowsAffected == 0 {
        return errors.New("not authorized or toilet not found")
    }

    return nil
}

func (r *PostgresRepository) AddReview(review models.Review) error {
    query := `
        INSERT INTO reviews (user_id, toilet_id, title, review_text, score) 
        VALUES ($1, $2, $3, $4, $5)
    `
    _, err := r.db.Exec(query, review.UserID, review.ToiletID, review.Title, review.ReviewText, review.Score)
    if err != nil {
        return fmt.Errorf("could not insert review: %w", err)
    }

    return nil
}

// GetReviewsByToilet retrieves all reviews for a specific toilet
func (r *PostgresRepository) GetReviewsByToilet(toiletID int) ([]models.Review, error) {
    query := `SELECT id, user_id, toilet_id, title, review_text, score FROM reviews WHERE toilet_id = $1`
    rows, err := r.db.Query(query, toiletID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var reviews []models.Review
    for rows.Next() {
        var review models.Review
        if err := rows.Scan(&review.ID, &review.UserID, &review.ToiletID, &review.Title, &review.ReviewText, &review.Score); err != nil {
            return nil, err
        }
        reviews = append(reviews, review)
    }

    return reviews, nil
}


