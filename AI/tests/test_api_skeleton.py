"""M7.A1 골격 검증 — OpenAPI 노출 + 계약 경로 + stub 동작 (api_spec.md §8)."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app

client = TestClient(create_app())

SPEC_PATHS = {
    "/ai/health": "get",
    "/ai/forecast/predict": "post",
    "/ai/forecast/train": "post",
    "/ai/forecast/status": "get",
    "/ai/orders/recommend": "post",
}


def test_openapi_exposes_all_spec_paths():
    spec = client.get("/openapi.json").json()
    for path, method in SPEC_PATHS.items():
        assert path in spec["paths"], path
        assert method in spec["paths"][path], (path, method)


def test_health_matches_spec_shape():
    r = client.get("/ai/health")
    assert r.status_code == 200
    body = r.json()
    assert body == {"status": "ok", "model_loaded": False, "last_trained_at": None}


def test_unimplemented_endpoints_return_501():
    assert client.get("/ai/forecast/status", params={"job_id": "u"}).status_code == 501
    recommend_body = {"store_id": "u", "target_date": "2026-05-07",
                      "forecast_results": [], "recipes": [], "inventory": []}
    assert client.post("/ai/orders/recommend", json=recommend_body).status_code == 501
    train_body = {"store_id": "u", "training_data": []}
    assert client.post("/ai/forecast/train", json=train_body).status_code == 501


def test_predict_validates_request_schema():
    r = client.post("/ai/forecast/predict", json={"store_id": "u"})  # 필수 필드 누락
    assert r.status_code == 422
