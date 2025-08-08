# Backend Deployment Notes

Environment variables:
- `ALLOWED_ORIGINS`: comma-separated list of allowed origins for CORS (e.g., `https://app.example.com,https://vercel.app`)
- `POCKETBASE_URL` (optional for future use if centralizing PB config)

Run with uvicorn:
```
uvicorn server:app --host 0.0.0.0 --port 8001
```

Docker build (from repo root):
```
docker build -f backend/Dockerfile -t fhm-backend:latest .
docker run -p 8001:8001 -e ALLOWED_ORIGINS="http://localhost:3000" fhm-backend:latest
```


