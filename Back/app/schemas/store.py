"""Store DTOs — api_spec §3."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

StoreSizeLit = Literal["SMALL", "MEDIUM", "LARGE"]
OperationLit = Literal["HALL", "DELIVERY", "BOTH"]


class StoreResponse(BaseModel):
    store_id: str
    store_name: str
    business_no: str
    business_type: str
    store_size: StoreSizeLit
    operation_type: OperationLit
    address: str | None
    phone: str | None
    onboarding_completed: bool
    created_at: datetime


class StoreUpdateRequest(BaseModel):
    store_name: str | None = Field(default=None, min_length=1, max_length=100)
    business_type: str | None = Field(default=None, min_length=1, max_length=50)
    store_size: StoreSizeLit | None = None
    operation_type: OperationLit | None = None
    address: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)


class OnboardingCompleteResponse(BaseModel):
    onboarding_completed: bool
    store_id: str
