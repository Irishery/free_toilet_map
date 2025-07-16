package models

type User struct {
    ID           int    `json:"id"`
    Username     string `json:"username"`
    Password     string `json:"-"`
    ToiletsFound int    `json:"toilets_found"`
}

type Toilet struct {
    ID        int    `json:"id"`
    FounderID int    `json:"founder_id"`
    Name      string `json:"name"`
    Point     string `json:"point"` // "lat,lng"
}

type Review struct {
    ID         int    `json:"id"`
    UserID     int    `json:"user_id"`
    ToiletID   int    `json:"toilet_id"`
    Title      string `json:"title"`
    ReviewText string `json:"review_text"`
    Score      float32    `json:"score"`
}
