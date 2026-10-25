package database

import (
	"context"
	"log/slog"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDB struct {
	Client *mongo.Client
}

func NewMongoDB() *MongoDB {
	instancia := &MongoDB{}
	err := instancia.Connect()
	if err != nil {
		slog.Error("Error fatal al conectar a MongoDB", slog.Any("error", err))
		os.Exit(1)
	}
	return instancia
}

func (mongoDB *MongoDB) Connect() error {
	// 1. Buscamos la variable de entorno
	uri := os.Getenv("MONGO_URI")

	// Si está vacía, usamos localhost (solo servirá en tu PC)
	if uri == "" {
		slog.Info("Usando conexión local a MongoDB", slog.String("uri", "mongodb://localhost:27017"))
		uri = "mongodb://localhost:27017"
	}

	clientOptions := options.Client().ApplyURI(uri)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return err
	}

	// Verificar con un Ping que realmente estamos conectados
	err = client.Ping(ctx, nil)
	if err != nil {
		return err
	}

	mongoDB.Client = client
	slog.Info("Conexión a MongoDB exitosa")
	return nil
}

// ... Resto de tus métodos (GetClient, Close, etc.) ...
func (mongoDB *MongoDB) GetClient() *mongo.Client {
	return mongoDB.Client
}

func (mongoDB *MongoDB) Disconnect() error {
	return mongoDB.Client.Disconnect(context.Background())
}
