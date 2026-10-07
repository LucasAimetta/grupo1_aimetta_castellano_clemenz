package repositories

import (
	"burned/backend/models"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type SessionRepositoryInterface interface {
	Save(ctx context.Context, token string, session models.Session, ttl time.Duration) error
	Get(ctx context.Context, token string) (*models.Session, error)
	Delete(ctx context.Context, token string) error
}

type SessionRepository struct {
	client *redis.Client
}

func NewSessionRepository(client *redis.Client) *SessionRepository {
	return &SessionRepository{client: client}
}

func (r *SessionRepository) Save(ctx context.Context, token string, session models.Session, ttl time.Duration) error {
	data, err := json.Marshal(session)
	if err != nil {
		return err
	}
	key := fmt.Sprintf("session:%s", token)
	return r.client.Set(ctx, key, data, ttl).Err()
}

func (r *SessionRepository) Get(ctx context.Context, token string) (*models.Session, error) {
	key := fmt.Sprintf("session:%s", token)
	data, err := r.client.Get(ctx, key).Bytes()
	if err != nil {
		return nil, err
	}
	var session models.Session
	if err := json.Unmarshal(data, &session); err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *SessionRepository) Delete(ctx context.Context, token string) error {
	key := fmt.Sprintf("session:%s", token)
	return r.client.Del(ctx, key).Err()
}

