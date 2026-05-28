"""Auth DTOs — api_spec §2."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=50)
    business_no: str
    store_name: str = Field(min_length=1, max_length=100)


class RegisterResponse(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    store_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    onboarding_completed: bool | None = None


class UserMeResponse(BaseModel):
    user_id: str
    # OAuth 사용자가 이메일 권한 미허용 시 fallback(`{provider}_{id}@social.example.com`)을
    # 저장하므로 EmailStr 대신 일반 str 사용 — 입력 검증은 register/login 단계에서만.
    email: str
    name: str
    auth_provider: Literal["LOCAL", "KAKAO", "GOOGLE"]
    store_name: str | None
    business_no: str | None
    onboarding_completed: bool
    created_at: datetime


class UpdateMeRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    store_name: str | None = Field(default=None, min_length=1, max_length=100)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class DeleteAccountRequest(BaseModel):
    password: str
