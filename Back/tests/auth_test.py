"""auth_test (M3.B5) — 12 integration cases.

Coverage: register / login / refresh / logout / logout-all / get_me + 인증 가드.
spec: docs/spec/05_api/api_spec.md §2, plan: docs/plan/be/phase_03_auth.md M3.B1~B5.
"""
from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from tests.conftest import make_test_email


def _make_biz_no() -> str:
    n = uuid.uuid4().int
    return f"{n % 1000:03d}-{(n // 1000) % 100:02d}-{(n // 100000) % 100000:05d}"


def _register_payload(email: str, *, password: str = "Passw0rd!", biz_no: str | None = None) -> dict:
    return {
        "email": email,
        "password": password,
        "name": "테스트유저",
        "business_no": biz_no or _make_biz_no(),
        "store_name": "테스트매장",
    }


async def _register_and_login(client: AsyncClient, email: str, password: str = "Passw0rd!") -> dict:
    r = await client.post("/api/auth/register", json=_register_payload(email, password=password))
    assert r.status_code == 201, r.text
    r = await client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


# 1
@pytest.mark.asyncio
async def test_register_success(client: AsyncClient) -> None:
    email = make_test_email()
    r = await client.post("/api/auth/register", json=_register_payload(email))
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == email
    assert body["store_name"] == "테스트매장"
    assert "user_id" in body and body["user_id"]


# 2
@pytest.mark.asyncio
async def test_register_duplicate_email_returns_409(client: AsyncClient) -> None:
    email = make_test_email()
    r1 = await client.post("/api/auth/register", json=_register_payload(email))
    assert r1.status_code == 201
    biz2 = f"999-{uuid.uuid4().int % 100:02d}-{uuid.uuid4().int % 100000:05d}"
    r2 = await client.post("/api/auth/register", json=_register_payload(email, biz_no=biz2))
    assert r2.status_code == 409
    assert r2.json()["error"] == "AUTH_EMAIL_DUPLICATE"


# 3
@pytest.mark.asyncio
async def test_register_invalid_business_no_returns_400(client: AsyncClient) -> None:
    r = await client.post(
        "/api/auth/register",
        json=_register_payload(make_test_email(), biz_no="abc-xx-yyyyy"),
    )
    assert r.status_code == 400
    assert r.json()["error"] == "AUTH_BUSINESS_NO_INVALID"


# 4
@pytest.mark.asyncio
async def test_login_success_returns_token_and_sets_refresh_cookie(client: AsyncClient) -> None:
    email = make_test_email()
    await client.post("/api/auth/register", json=_register_payload(email))
    r = await client.post("/api/auth/login", json={"email": email, "password": "Passw0rd!"})
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["expires_in"] > 0
    assert "refresh_token" in r.cookies


# 5
@pytest.mark.asyncio
async def test_login_invalid_password_returns_401(client: AsyncClient) -> None:
    email = make_test_email()
    await client.post("/api/auth/register", json=_register_payload(email))
    r = await client.post("/api/auth/login", json={"email": email, "password": "WrongPass1!"})
    assert r.status_code == 401
    assert r.json()["error"] == "AUTH_INVALID_CREDENTIALS"


# 6
@pytest.mark.asyncio
async def test_login_unknown_email_returns_401(client: AsyncClient) -> None:
    r = await client.post(
        "/api/auth/login", json={"email": make_test_email("nobody"), "password": "Passw0rd!"}
    )
    assert r.status_code == 401
    assert r.json()["error"] == "AUTH_INVALID_CREDENTIALS"


# 7
@pytest.mark.asyncio
async def test_get_me_without_auth_header_returns_401(client: AsyncClient) -> None:
    r = await client.get("/api/auth/me")
    assert r.status_code == 401
    assert r.json()["error"] == "UNAUTHORIZED"


# 8
@pytest.mark.asyncio
async def test_get_me_with_bearer_returns_profile(client: AsyncClient) -> None:
    email = make_test_email()
    tokens = await _register_and_login(client, email)
    r = await client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == email
    assert body["auth_provider"] == "LOCAL"
    assert body["onboarding_completed"] is False


# 9
@pytest.mark.asyncio
async def test_refresh_rotates_token(client: AsyncClient) -> None:
    email = make_test_email()
    await _register_and_login(client, email)
    old_refresh = client.cookies.get("refresh_token")
    assert old_refresh
    r = await client.post("/api/auth/refresh")
    assert r.status_code == 200
    body = r.json()
    assert body["access_token"]
    new_refresh = r.cookies.get("refresh_token") or client.cookies.get("refresh_token")
    assert new_refresh and new_refresh != old_refresh

    # 회전 후 옛 refresh 재사용은 거부되어야 함.
    fresh_client_cookies = {"refresh_token": old_refresh}
    r2 = await client.post("/api/auth/refresh", cookies=fresh_client_cookies)
    assert r2.status_code == 401


# 10
@pytest.mark.asyncio
async def test_refresh_with_invalid_cookie_returns_401(client: AsyncClient) -> None:
    r = await client.post("/api/auth/refresh", cookies={"refresh_token": "not-a-real-token"})
    assert r.status_code == 401
    assert r.json()["error"] == "AUTH_REFRESH_TOKEN_INVALID"


# 11
@pytest.mark.asyncio
async def test_logout_revokes_current_refresh(client: AsyncClient) -> None:
    email = make_test_email()
    tokens = await _register_and_login(client, email)
    refresh_before = client.cookies.get("refresh_token")
    r = await client.post(
        "/api/auth/logout", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert r.status_code == 204
    r2 = await client.post("/api/auth/refresh", cookies={"refresh_token": refresh_before})
    assert r2.status_code == 401


# 12
@pytest.mark.asyncio
async def test_logout_all_revokes_every_session(client: AsyncClient) -> None:
    email = make_test_email()
    # 세션 A 로그인 → refresh 보관.
    tokens_a = await _register_and_login(client, email)
    refresh_a = client.cookies.get("refresh_token")

    # 세션 B 로그인 (동일 사용자, 다른 디바이스 시뮬레이션).
    r = await client.post("/api/auth/login", json={"email": email, "password": "Passw0rd!"})
    assert r.status_code == 200
    refresh_b = r.cookies.get("refresh_token") or client.cookies.get("refresh_token")
    assert refresh_a and refresh_b and refresh_a != refresh_b

    # logout-all
    r = await client.post(
        "/api/auth/logout-all",
        headers={"Authorization": f"Bearer {tokens_a['access_token']}"},
    )
    assert r.status_code == 204

    # 두 refresh 모두 401
    for tok in (refresh_a, refresh_b):
        rr = await client.post("/api/auth/refresh", cookies={"refresh_token": tok})
        assert rr.status_code == 401
