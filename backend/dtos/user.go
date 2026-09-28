package dtos

import (
	"burned/backend/models"
	"time"
)

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=60"`
	Email    string `json:"email" binding:"required,email,max=120"`
	Password string `json:"password" binding:"required,min=8,max=72"`
}
type GoogleUserDTO struct {
	Email    string `json:"email"`
	Name     string `json:"name"`
	GoogleID string `json:"id"`
}

type UserResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Password  string    `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email,max=120"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type UpdatePasswordRequest struct {
	NewPassword string `json:"newPassword" binding:"required,min=8,max=72"`
	OldPassword string `json:"oldPassword" binding:"required,min=8,max=72"`
}

func UserRequestToModel(dto RegisterRequest) models.User {
	var model models.User
	model.CreatedAt = time.Now()
	model.Email = dto.Email
	model.Name = dto.Name
	model.Role = "user"
	//FALTA HASHED PASSWORD
	return model
}

func UserModelToResponse(model models.User) UserResponse {
	var response UserResponse
	response.ID = model.ID.Hex()
	response.Name = model.Name
	response.Email = model.Email
	response.Role = model.Role
	response.UpdatedAt = model.UpdatedAt
	response.CreatedAt = model.CreatedAt
	response.Password = model.HashedPassword
	return response
}
