# ARQ worker image — service_design.md §11.1 (`arq-worker` 컨테이너).
# Build context: ./Back
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN pip install --no-cache-dir uv==0.5.11

COPY pyproject.toml ./
RUN uv pip install --system --no-cache .

COPY app ./app

CMD ["arq", "app.worker.WorkerSettings"]
