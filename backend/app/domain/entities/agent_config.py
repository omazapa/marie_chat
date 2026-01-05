"""
Agent Configuration Domain Entities
Defines configuration structures for external agents
"""

from typing import Any, Literal

from pydantic import BaseModel, Field


class ConfigField(BaseModel):
    """
    Represents a single configurable field for an agent.

    Attributes:
        key: Unique identifier for the configuration field
        label: Human-readable label for UI display
        type: Data type of the field (string, number, integer, boolean, enum)
        default: Default value if not configured
        description: Optional description/help text
        min: Minimum value for numeric types
        max: Maximum value for numeric types
        enum_values: List of allowed values for enum type
        required: Whether this field is required
    """

    key: str = Field(..., description="Configuration field key")
    label: str = Field(..., description="Display label")
    type: Literal["string", "number", "integer", "boolean", "enum", "array"] = Field(
        ..., description="Field data type"
    )
    default: Any = Field(None, description="Default value")
    description: str | None = Field(None, description="Field description")
    min: float | None = Field(None, description="Minimum value (for numbers)")
    max: float | None = Field(None, description="Maximum value (for numbers)")
    enum_values: list[str] | None = Field(None, description="Allowed values (for enum)")
    items_type: str | None = Field(None, description="Type of array items (for array type)")
    required: bool = Field(default=False, description="Whether field is required")

    class Config:
        frozen = True


class AgentConfig(BaseModel):
    """
    Represents a saved agent configuration.

    Attributes:
        id: Unique configuration ID
        user_id: ID of the user who owns this configuration
        provider: Provider name (e.g., 'agent', 'ollama')
        model_id: Model/agent identifier
        scope: Configuration scope (global or conversation-specific)
        conversation_id: Conversation ID (if scope is 'conversation')
        config_values: Dictionary of configuration key-value pairs
        created_at: Timestamp when config was created
        updated_at: Timestamp when config was last updated
    """

    id: str = Field(..., description="Configuration ID")
    user_id: str = Field(..., description="User ID")
    provider: str = Field(..., description="Provider name")
    model_id: str = Field(..., description="Model/agent ID")
    scope: Literal["global", "conversation"] = Field(..., description="Configuration scope")
    conversation_id: str | None = Field(None, description="Conversation ID (if scoped)")
    config_values: dict[str, Any] = Field(default_factory=dict, description="Configuration values")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

    class Config:
        frozen = False


class ConfigSchemaResponse(BaseModel):
    """
    Response containing configuration schema and available fields.

    Attributes:
        provider: Provider name
        model_id: Model/agent identifier
        fields: List of configurable fields
        raw_schema: Optional raw JSON schema from service
    """

    provider: str
    model_id: str
    fields: list[ConfigField]
    raw_schema: dict[str, Any] | None = None
