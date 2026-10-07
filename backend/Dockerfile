FROM golang:1.24-alpine

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go mod tidy
RUN go build -o api-server main.go

EXPOSE 8080

CMD ["./api-server"]