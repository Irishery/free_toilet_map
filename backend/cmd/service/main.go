package main

import (
	"log"
	"net/http"
	"time"

	"free_toilet_map/toilet/endpoint"
	"free_toilet_map/toilet/repository"
	"free_toilet_map/toilet/service"
	"free_toilet_map/toilet/transport"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"database/sql"

	_ "github.com/lib/pq"
)

func waitForDB(db *sql.DB) {
    for i := 0; i < 10; i++ {
        if err := db.Ping(); err == nil {
            return
        }
        log.Println("Waiting for database to be ready...")
        time.Sleep(2 * time.Second)
    }
    log.Fatal("Database not ready after 20s")
}


func runMigrations(db *sql.DB) {
    driver, err := postgres.WithInstance(db, &postgres.Config{})
    if err != nil {
        log.Fatalf("Could not create migrate driver: %v", err)
    }

    m, err := migrate.NewWithDatabaseInstance(
        "file:///app/migrations",
        "postgres", driver)
    if err != nil {
        log.Fatalf("Could not create migrate instance: %v", err)
    }

    err = m.Up()
    if err != nil && err != migrate.ErrNoChange {
        log.Fatalf("Migration failed: %v", err)
    }

    log.Println("Migrations applied successfully")
}

func main() {
    connStr := "host=db port=5432 user=toilet password=toilet dbname=toilet_db sslmode=disable"
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        log.Fatalf("Cannot connect to DB: %v", err)
    }

    waitForDB(db)
    runMigrations(db)

    repo := repository.NewPostgresRepoWithDB(db)
    svc := service.NewService(*repo)
    eps := endpoint.MakeEndpoints(svc)
    handler := transport.NewHTTPHandler(eps)

    log.Println("🚀 Listening on :8080...")
    log.Fatal(http.ListenAndServe(":8080", handler))
}
