# edalan-test2

Monorepo:

| Klasör      | Teknoloji                          | Port |
|-------------|------------------------------------|------|
| `frontend/` | Next.js (App Router, TS, Tailwind) | 3000 |
| `backend/`  | Python 3.12, FastAPI, uv           | 8000 |

## Geliştirme

```bash
# Backend
cd backend && uv sync && uv run uvicorn app.main:app --reload --port 8000

# Frontend (ayrı terminalde)
cd frontend && npm install && npm run dev
```

Frontend, backend adresini `NEXT_PUBLIC_API_URL` ile alır (`frontend/.env.local`).
Backend CORS ayarları `backend/.env` içindeki `CORS_ORIGINS` ile yönetilir.
