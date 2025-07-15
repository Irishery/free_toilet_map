package repository

import (
	"database/sql"
	"errors"
	models "free_toilet_map/toilet/model"
)

type PostgresRepository struct {
    db *sql.DB
}

func NewPostgresRepoWithDB(db *sql.DB) *PostgresRepository {
    return &PostgresRepository{db: db}
}

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

func (r *PostgresRepository) GetUserByUsername(username string) (models.User, error) {
    var user models.User
    query := `SELECT id, username, password, toilets_found FROM users WHERE username = $1`
    err := r.db.QueryRow(query, username).Scan(&user.ID, &user.Username, &user.Password, &user.ToiletsFound)
    if err == sql.ErrNoRows {
        return user, errors.New("user not found")
    }
    return user, err
}

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

func (r *PostgresRepository) AddToilet(toilet models.Toilet) error {
    _, err := r.db.Exec(`
        INSERT INTO toilets (founder_id, name, point)
        VALUES ($1, $2, $3)
    `, toilet.FounderID, toilet.Name, toilet.Point)

    return err
}


func (r *PostgresRepository) AddReview(review models.Review) error {
    query := `INSERT INTO reviews (user_id, toilet_id, title, review_text, score) VALUES ($1, $2, $3, $4, $5)`
    _, err := r.db.Exec(query, review.UserID, review.ToiletID, review.Title, review.ReviewText, review.Score)
    return err
}


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
