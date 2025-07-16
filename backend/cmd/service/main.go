package main

import (
	"database/sql"
	"free_toilet_map/cmd/db"
	"free_toilet_map/toilet/endpoint"
	"free_toilet_map/toilet/repository"
	"free_toilet_map/toilet/service"
	"free_toilet_map/toilet/transport"
	"log"
	"net/http"
)

func initService(db *sql.DB) (endpoint.Endpoints, error) {
    repo := repository.NewPostgresRepoWithDB(db)
    svc := service.NewService(*repo)  // Initialize the service with the repository
    return endpoint.MakeEndpoints(*svc), nil  // Dereference svc here to pass the value to MakeEndpoints
}

func initHTTPHandler(eps endpoint.Endpoints) http.Handler {
    return transport.NewHTTPHandler(eps)
}

func main() {
    // Initialize the database
    dbConn, err := db.InitDB()
    if err != nil {
        log.Fatalf("Cannot connect to DB: %v", err)
    }

    // Wait for the DB to be ready and apply migrations
    db.WaitForDB(dbConn)
    db.RunMigrations(dbConn)

    // Initialize service and HTTP handler
    eps, err := initService(dbConn)
    if err != nil {
        log.Fatalf("Error initializing service: %v", err)
    }
    handler := initHTTPHandler(eps)

    // Start the HTTP server
    log.Println("🚀 Listening on :8080")
    log.Fatal(http.ListenAndServe(":8080", handler))
}
