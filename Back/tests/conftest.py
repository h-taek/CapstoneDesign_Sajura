"""pytest fixtures — auth_test 통합 테스트.

ASGITransport로 in-process FastAPI 호출. DB는 compose 내 실 MySQL 사용,
테스트 이메일은 `@auth-test.local` 도메인으로 고정해 세션 종료 시 일괄 정리.
"""
from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

import app.db as app_db
from app.config import get_settings
from app.main import app
from app.models.user import User

# 운영용 engine을 NullPool 기반 engine으로 교체 — pytest-asyncio가 함수별
# 이벤트 루프를 만들더라도 connection이 매번 새로 열려/닫혀 loop 바인딩
# 문제가 발생하지 않음. import 시점에 한 번만 실행.
_test_engine = create_async_engine(
    get_settings().database_url_async, poolclass=NullPool, future=True
)
_test_session_local = async_sessionmaker(
    _test_engine, expire_on_commit=False, autoflush=False
)
app_db.engine = _test_engine
app_db.SessionLocal = _test_session_local

TEST_EMAIL_PREFIX = "pytest-auth-"
TEST_EMAIL_DOMAIN = "example.com"


def make_test_email(tag: str = "u") -> str:
    return f"{TEST_EMAIL_PREFIX}{tag}-{uuid.uuid4().hex[:10]}@{TEST_EMAIL_DOMAIN}"


@pytest_asyncio.fixture(loop_scope="session")
async def client() -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://localhost") as c:
        yield c


@pytest_asyncio.fixture(autouse=True, loop_scope="session")
async def _cleanup_test_users() -> AsyncIterator[None]:
    yield
    async with app_db.SessionLocal() as session:
        await session.execute(
            delete(User).where(User.email.like(f"{TEST_EMAIL_PREFIX}%@{TEST_EMAIL_DOMAIN}"))
        )
        await session.commit()
