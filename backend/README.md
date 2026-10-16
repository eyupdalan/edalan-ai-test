# Backend

FastAPI uygulaması, [uv](https://docs.astral.sh/uv/) ile yönetilir.

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

- API dokümantasyonu: http://localhost:8000/docs
- Testler: `uv run pytest`
- Lint: `uv run ruff check .`
