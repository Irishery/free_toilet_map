FROM golang:1.24.5

WORKDIR /app
COPY . .

RUN go mod tidy
RUN go build -o toilet_map ./cmd/service

EXPOSE 8080

CMD ["./toilet_map"]
