"""Store ORM — schema.md §3 stores."""
from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CHAR, Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, new_uuid

if TYPE_CHECKING:
    from app.models.user import User


class StoreSize(str, enum.Enum):
    SMALL = "SMALL"
    MEDIUM = "MEDIUM"
    LARGE = "LARGE"


class OperationType(str, enum.Enum):
    HALL = "HALL"
    DELIVERY = "DELIVERY"
    BOTH = "BOTH"


class Store(Base):
    __tablename__ = "stores"

    store_id: Mapped[str] = mapped_column(CHAR(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(
        CHAR(36), ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False
    )
    store_name: Mapped[str] = mapped_column(String(100), nullable=False)
    business_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    business_type: Mapped[str] = mapped_column(String(50), nullable=False)
    store_size: Mapped[StoreSize] = mapped_column(Enum(StoreSize, name="store_size"), nullable=False)
    operation_type: Mapped[OperationType] = mapped_column(
        Enum(OperationType, name="operation_type"), nullable=False
    )
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp()
    )

    user: Mapped["User"] = relationship(back_populates="store")
