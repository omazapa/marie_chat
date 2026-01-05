"""Pydantic models for user settings validation."""

from pydantic import BaseModel, Field, field_validator

# ==================== PROFILE MODELS ====================


class UpdateProfileRequest(BaseModel):
    """Request model for updating user profile."""

    full_name: str | None = Field(None, min_length=1, max_length=100)
    email: str | None = Field(None, pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


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

    temperature: float | None = Field(None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(None, ge=1, le=8192)
    top_p: float | None = Field(None, ge=0.0, le=1.0)
    frequency_penalty: float | None = Field(None, ge=0.0, le=2.0)
    presence_penalty: float | None = Field(None, ge=0.0, le=2.0)


class AgentPreferencesRequest(BaseModel):
    """Request model for updating agent preferences."""

    default_provider: str | None = None
    default_provider_id: str | None = None
    default_model: str | None = None
    system_prompt: str | None = Field(None, max_length=5000)
    parameters: ModelParameters | None = None
    response_mode: str | None = Field(None, pattern="^(concise|detailed|academic|casual)$")


# ==================== INTERFACE PREFERENCES MODELS ====================


class InterfacePreferencesRequest(BaseModel):
    """Request model for updating interface preferences."""

    theme: str | None = Field(None, pattern="^(light|dark|auto)$")
    language: str | None = Field(None, pattern="^(en|es)$")
    tts_voice: str | None = None
    stt_language: str | None = None
    message_density: str | None = Field(None, pattern="^(compact|comfortable|spacious)$")
    show_timestamps: bool | None = None
    enable_markdown: bool | None = None
    enable_code_highlighting: bool | None = None


# ==================== PRIVACY PREFERENCES MODELS ====================


class PrivacyPreferencesRequest(BaseModel):
    """Request model for updating privacy preferences."""

    conversation_retention_days: int | None = Field(None, ge=-1)  # -1 = forever
    auto_delete_enabled: bool | None = None
    share_usage_data: bool | None = None
