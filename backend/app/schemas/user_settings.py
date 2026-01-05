"""Pydantic models for user settings validation."""

from pydantic import BaseModel, Field, field_validator
from typing import Optional


# ==================== PROFILE MODELS ====================


class UpdateProfileRequest(BaseModel):
    """Request model for updating user profile."""

    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


class ChangePasswordRequest(BaseModel):
    """Request model for changing password."""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate that passwords match."""
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v


# ==================== AGENT PREFERENCES MODELS ====================


class ModelParameters(BaseModel):
    """Model parameters for LLM generation."""

    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1, le=8192)
    top_p: Optional[float] = Field(None, ge=0.0, le=1.0)
    frequency_penalty: Optional[float] = Field(None, ge=0.0, le=2.0)
    presence_penalty: Optional[float] = Field(None, ge=0.0, le=2.0)


class AgentPreferencesRequest(BaseModel):
    """Request model for updating agent preferences."""

    default_provider: Optional[str] = None
    default_provider_id: Optional[str] = None
    default_model: Optional[str] = None
    system_prompt: Optional[str] = Field(None, max_length=5000)
    parameters: Optional[ModelParameters] = None
    response_mode: Optional[str] = Field(
        None, pattern="^(concise|detailed|academic|casual)$"
    )


# ==================== INTERFACE PREFERENCES MODELS ====================


class InterfacePreferencesRequest(BaseModel):
    """Request model for updating interface preferences."""

    theme: Optional[str] = Field(None, pattern="^(light|dark|auto)$")
    language: Optional[str] = Field(None, pattern="^(en|es)$")
    tts_voice: Optional[str] = None
    stt_language: Optional[str] = None
    message_density: Optional[str] = Field(
        None, pattern="^(compact|comfortable|spacious)$"
    )
    show_timestamps: Optional[bool] = None
    enable_markdown: Optional[bool] = None
    enable_code_highlighting: Optional[bool] = None


# ==================== PRIVACY PREFERENCES MODELS ====================


class PrivacyPreferencesRequest(BaseModel):
    """Request model for updating privacy preferences."""

    conversation_retention_days: Optional[int] = Field(None, ge=-1)  # -1 = forever
    auto_delete_enabled: Optional[bool] = None
    share_usage_data: Optional[bool] = None
