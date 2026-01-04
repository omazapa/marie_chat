"""
Settings routes - FastAPI version
Public settings, admin settings management, and provider testing.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.services.settings_service import settings_service
from app.utils.auth import get_current_admin_user

router = APIRouter()


class SettingsUpdate(BaseModel):
    """Settings update request"""

    white_label: dict[str, Any] | None = None
    llm: dict[str, Any] | None = None
    image_generation: dict[str, Any] | None = None


class ProviderTestRequest(BaseModel):
    """Provider test request"""

    provider: str
    config: dict[str, Any] = {}


@router.get("/public")
async def get_public_settings():
    """
    Get public system settings (white label).
    No authentication required.
    """
    config = settings_service.get_settings()
    return {"white_label": config.get("white_label", {})}


@router.get("")
async def get_settings(current_user: dict = Depends(get_current_admin_user)):
    """
    Get all system settings.
    Requires admin authentication.
    """
    config = settings_service.get_settings()
    return config


@router.put("")
async def update_settings(
    settings: SettingsUpdate, current_user: dict = Depends(get_current_admin_user)
):
    """
    Update system settings.
    Requires admin authentication.
    """
    data = settings.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data provided")

    success = settings_service.update_settings(data)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update settings",
        )

    # Re-initialize providers to apply new API keys/endpoints
    from app.services.provider_factory import initialize_providers

    initialize_providers()
    return {"message": "Settings updated successfully"}


@router.post("/test-provider")
async def test_provider(
    test_request: ProviderTestRequest, current_user: dict = Depends(get_current_admin_user)
):
    """
    Test a provider connection with provided configuration.
    Requires admin authentication.
    """
    provider_name = test_request.provider
    config = test_request.config

    try:
        from app.services.agent_provider import AgentProvider
        from app.services.huggingface_provider import HuggingFaceProvider
        from app.services.ollama_provider import OllamaProvider
        from app.services.openai_provider import OpenAIProvider

        provider_classes = {
            "ollama": OllamaProvider,
            "huggingface": HuggingFaceProvider,
            "openai": OpenAIProvider,
            "agent": AgentProvider,
        }

        if provider_name not in provider_classes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown provider: {provider_name}",
            )

        # Create a temporary instance to test
        provider_class = provider_classes[provider_name]
        temp_provider: Any = provider_class(config)  # type: ignore[abstract]
        health = temp_provider.health_check()

        return health
    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e), "available": False}
