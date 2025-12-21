from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: Optional[str] = None
    roles: Optional[list[str]] = None
    permissions: Optional[dict] = None
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: str
    updated_at: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse
