package repository

import (
	"database/sql"
	"fmt"
	models "free_toilet_map/toilet/model"
	"os"

	_ "github.com/lib/pq"
)

type PostgresRepo struct {
    db *sql.DB
}

func NewPostgresRepoWithDB(db *sql.DB) *PostgresRepo {
    return &PostgresRepo{db: db}
}


func NewPostgresRepo() (*PostgresRepo, error) {
    connStr := fmt.Sprintf(
        "host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
        os.Getenv("DB_HOST"),
        os.Getenv("DB_PORT"),
        os.Getenv("DB_USER"),
        os.Getenv("DB_PASSWORD"),
        os.Getenv("DB_NAME"),
    )

    db, err := sql.Open("postgres", connStr)
    if err != nil {
        return nil, err
    }

    return &PostgresRepo{db: db}, nil
}

func (r *PostgresRepo) CreateUser(user models.User) (models.User, error) {
    row := r.db.QueryRow(`
        INSERT INTO users (username, password, toilets_found)
        VALUES ($1, $2, $3)
        RETURNING id
    `, user.Username, user.Password, user.ToiletsFound)

    err := row.Scan(&user.ID)
    return user, err
}

func (r *PostgresRepo) GetAllToilets() ([]models.Toilet, error) {
    rows, err := r.db.Query(`SELECT id, founder_id, name, point FROM toilets`)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var result []models.Toilet
    for rows.Next() {
        var t models.Toilet
        if err := rows.Scan(&t.ID, &t.FounderID, &t.Name, &t.Point); err != nil {
            return nil, err
        }
        result = append(result, t)
    }
    return result, nil
}

func (r *PostgresRepo) AddReview(rw models.Review) error {
    _, err := r.db.Exec(`
        INSERT INTO reviews (user_id, toilet_id, title, review_text, score)
        VALUES ($1, $2, $3, $4, $5)
    `, rw.UserID, rw.ToiletID, rw.Title, rw.ReviewText, rw.Score)
    return err
}
