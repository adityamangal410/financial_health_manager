# Financial Health Manager - Deployment & Operations Runbook

This runbook documents the manual steps to complete Phases 4 and 5 from `TECH_STACK.md`: containerization, deployment (OCI + Vercel), CI/CD, and testing/optimization. Use it as a checklist.

## 1) Local Containerized Dev (Docker Compose)

Prereqs: Docker Desktop (or Podman), Node 18+, Python 3.10+.

Steps:
- Copy `.env` values if needed (defaults are fine for local):
  - Backend expects PocketBase at `http://pocketbase:8090` in compose
  - Frontend uses `VITE_API_URL=http://localhost:8001` and `VITE_POCKETBASE_URL=http://localhost:8090`
- Start all services:
  - `docker compose up -d --build`
- Visit:
  - Frontend: http://localhost:3000
  - Backend: http://localhost:8001/health
  - PocketBase Admin UI: http://localhost:8090/_/
- Initialize PocketBase collections:
  - Login to admin UI, create admin user
  - Run `backend/setup_pocketbase.py` against `http://localhost:8090` to auto-create collections or use migrations in `pocketbase/pb_migrations/`

## 2) Production Backend on OCI VM (Ubuntu)

Prereqs: Ubuntu 22.04+ VM, DNS A records for `api.example.com` and `pb.example.com`.

Steps:
1. SSH to VM and install Docker & Caddy
   - `sudo apt-get update && sudo apt-get install -y docker.io docker-compose caddy`
2. Create project directory and copy repo (or pull via git)
   - `git clone https://github.com/<you>/financial_health_manager.git`
3. Configure Caddy reverse proxy (HTTPS via ACME):
   - `/etc/caddy/Caddyfile`:
     ```
     api.example.com {
       reverse_proxy localhost:8001
     }
     pb.example.com {
       reverse_proxy localhost:8090
     }
     }
     ```
   - `sudo systemctl restart caddy`
4. Start PocketBase and Backend as services (compose or systemd)
   - With compose: `docker compose up -d backend pocketbase`
5. Verify health:
   - `curl -f https://api.example.com/health`
   - `curl -f https://pb.example.com/api/health`

## 3) Frontend on Vercel

Steps:
1. Create a new Vercel project from `frontend/` (set framework to Vite)
2. Environment variables:
   - `VITE_API_URL=https://api.example.com`
   - `VITE_POCKETBASE_URL=https://pb.example.com`
3. Build & Deploy (Vercel does this automatically)

## 4) CI/CD

We added `.github/workflows/ci.yml`:
- Backend: installs `requirements.txt`, runs tests (`pytest`)
- Frontend: `npm ci`, typecheck, build

Suggested Enhancements:
- Add deploy jobs (Vercel GitHub app for frontend, SSH/deploy script for backend)
- Add Dependabot and CodeQL Security scanning

## 5) Data Backups

PocketBase backups:
- Schedule daily snapshot of `pocketbase/pb_data` directory
- Use cron + rclone to push to cloud storage

## 6) Monitoring & Logs

- Enable Caddy access/error logs
- For backend, configure Uvicorn logging to JSON and ship to CloudWatch/Loki
- Health checks: `GET /health` on backend; PocketBase: `/api/health`

## 7) Performance Tuning

Backend:
- Enable Uvicorn workers (e.g., `--workers 2`) on larger instances
- Profile CSV parsing for very large files; consider chunked streaming if needed

Frontend:
- Consider dynamic imports for AI chatbot and charts to reduce bundle size
- Use React Query cache times appropriately for perceived speed

## 8) Security

- Ensure HTTPS enforced on Caddy
- Limit PocketBase admin exposure; use strong credentials
- Configure CORS in `backend/server.py` to production origins

## 9) Rollback

- Keep previous images tagged; use `docker compose pull && docker compose up -d` to roll forward/back
- Vercel keeps previous deployments; promote older build if needed

## 10) Smoke Test Checklist

- Login/Register flows via PocketBase
- CSV upload succeeds; duplicate file skipped
- Transactions list renders; filtering works
- Financial summary computes; charts render (time-series, YoY, categories)
- Delete all transactions endpoint works
- AI Chatbot shows simulated responses


