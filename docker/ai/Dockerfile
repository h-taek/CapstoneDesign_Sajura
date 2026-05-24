# AI Server image — Phase 2 skeleton.
# Build context: repo root (compose: context=.)
# 모델 의존성(ml libs)은 Phase 6 ai_model 확정 후 별도 PR로 추가.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN pip install --no-cache-dir uv==0.5.11

COPY AI/pyproject.toml ./
RUN uv pip install --system --no-cache .

COPY AI/app ./app

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
