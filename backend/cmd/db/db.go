package db

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file" // Import the file source for migrations
	_ "github.com/lib/pq"                                // Import the Postgres driver for Go
)

const (
	DBHost     = "db"
	DBPort     = 5432
	DBUser     = "toilet"
	DBPassword = "toilet"
	DBName     = "toilet_db"
	SSLMode    = "disable"
	RetryCount = 30   // Increase retry count to 30 attempts
	RetryDelay = 5 * time.Second // Increase delay to 5 seconds between retries
)

// InitDB initializes the database connection
func InitDB() (*sql.DB, error) {
	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s", DBHost, DBPort, DBUser, DBPassword, DBName, SSLMode)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("could not open database connection: %w", err)
	}

	// Check if the connection is established
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("could not ping database: %w", err)
	}

	log.Println("Database connection established successfully")
	return db, nil
}

// WaitForDB waits for the database to be ready, retrying on failure
func WaitForDB(db *sql.DB) {
	for i := 0; i < RetryCount; i++ {
		if err := db.Ping(); err == nil {
			log.Println("Database is ready!")
			return
		}
		log.Printf("Attempt %d: Database not ready. Retrying...\n", i+1)
		time.Sleep(RetryDelay)
	}

	log.Fatal("Database not ready after retrying for 150 seconds")
}

// RunMigrations runs database migrations
func RunMigrations(db *sql.DB) error {
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("could not create migrate driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file:///app/migrations", "postgres", driver)
	if err != nil {
		return fmt.Errorf("could not create migrate instance: %w", err)
	}

	// Apply migrations
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Println("Migrations applied successfully")
	return nil
}
