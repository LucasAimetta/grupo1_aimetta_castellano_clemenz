package models

import "time"

type Session struct {
	UserID    string    `json:"userId"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
}

