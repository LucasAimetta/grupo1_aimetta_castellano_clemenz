package services

import (
	"burned/backend/models"
	"burned/backend/repositories"
	"context"
	"crypto/rand"
	"encoding/hex"
	"os"
	"strconv"
	"time"
)

type SessionServiceInterface interface {
	CreateSession(ctx context.Context, userID, email, role string) (string, error)
	GetSession(ctx context.Context, token string) (*models.Session, error)
	DeleteSession(ctx context.Context, token string) error
}

type SessionService struct {
	repo repositories.SessionRepositoryInterface
	ttl  time.Duration
}

func NewSessionService(repo repositories.SessionRepositoryInterface) *SessionService {
	hours, _ := strconv.Atoi(os.Getenv("SESSION_TTL_HOURS"))
	if hours <= 0 {
		hours = 3
	}

	return &SessionService{
		repo: repo,
		ttl:  time.Duration(hours) * time.Hour,
	}
}

// CreateSession genera un token criptográficamente seguro y almacena la sesión en Redis
func (s *SessionService) CreateSession(ctx context.Context, userID, email, role string) (string, error) {
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return "", err
	}
	token := hex.EncodeToString(tokenBytes)

	session := models.Session{
		UserID:    userID,
		Email:     email,
		Role:      role,
		CreatedAt: time.Now(),
	}

	if err := s.repo.Save(ctx, token, session, s.ttl); err != nil {
		return "", err
	}

	return token, nil
}

// GetSession busca y recupera la sesión activa desde Redis
func (s *SessionService) GetSession(ctx context.Context, token string) (*models.Session, error) {
	return s.repo.Get(ctx, token)
}

// DeleteSession elimina la sesión de Redis al cerrar sesión
func (s *SessionService) DeleteSession(ctx context.Context, token string) error {
	return s.repo.Delete(ctx, token)
}

