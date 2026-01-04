from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None = None
    role: str | None = None
    roles: list[str] | None = None
    permissions: dict | None = None
    is_active: bool
    avatar_url: str | None = None
    created_at: str
    updated_at: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse
