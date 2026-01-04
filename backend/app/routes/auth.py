"""
Authentication routes - FastAPI version
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse
from app.services.opensearch_service import OpenSearchService
from app.services.settings_service import settings_service
from app.utils.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_active_user,
)

router = APIRouter()
opensearch_service = OpenSearchService()


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest):
    """Register a new user"""
    # Check if registration is enabled
    config = settings_service.get_settings()
    if not config.get("white_label", {}).get("registration_enabled", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is currently disabled",
        )

    # Check if user already exists
    existing_user = opensearch_service.get_user_by_email(data.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    # Create user
    try:
        user = opensearch_service.create_user(
            email=data.email, password=data.password, full_name=data.full_name
        )

        # Create tokens
        access_token = create_access_token(
            data={"sub": user["id"], "role": user.get("role", "user")}
        )
        refresh_token = create_refresh_token(data={"sub": user["id"]})

        # Update last login
        opensearch_service.update_last_login(user["id"])

        # Remove password_hash from response
        user.pop("password_hash", None)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": UserResponse(**user).model_dump(),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}",
        ) from e


@router.post("/login", response_model=dict)
async def login(data: LoginRequest):
    """Login user"""
    # Get user
    user = opensearch_service.get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Verify password
    password_hash = user.get("password_hash")
    if not password_hash or not opensearch_service.verify_password(
        data.password.strip(), password_hash
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    # Create tokens
    access_token = create_access_token(data={"sub": user["id"], "role": user.get("role", "user")})
    refresh_token = create_refresh_token(data={"sub": user["id"]})

    # Update last login
    opensearch_service.update_last_login(user["id"])

    # Remove password_hash from response
    user.pop("password_hash", None)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": UserResponse(**user).model_dump(),
    }


@router.post("/refresh", response_model=dict)
async def refresh(refresh_token: str):
    """Refresh access token"""
    try:
        payload = decode_token(refresh_token)
        token_type = payload.get("type")

        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        # Create new access token
        access_token = create_access_token(data={"sub": user_id})

        return {"access_token": access_token}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        ) from e


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_active_user)):
    """Logout user"""
    # In a stateless JWT setup, logout is handled on the client side
    # For a more secure implementation, you could maintain a blocklist
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """Get current user info"""
    # Remove password_hash if present
    current_user.pop("password_hash", None)

    return UserResponse(**current_user)
