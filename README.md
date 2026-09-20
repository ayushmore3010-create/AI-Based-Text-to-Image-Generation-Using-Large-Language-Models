# AI-Based Text-to-Image Generation Using Large Language Models

This project is a full-stack React + Vite frontend and FastAPI backend for prompt enhancement, image generation, history, favorites, authentication, profile management, and admin monitoring.

## Required software

- VS Code
- Node.js 20+ or 22+ recommended
- Python 3.11+ recommended (3.14 was used here successfully)
- Git
- PostgreSQL 16 (optional for production, SQLite works for local demo mode)
- Docker Desktop optional for PostgreSQL startup

## Required VS Code extensions

- Python
- Pylance
- JavaScript/TypeScript or ES7+ React/Redux/React Native Snippets
- Docker (optional)

## Required accounts and API keys

- OpenAI API key optional; without it the app uses a built-in demo mode
- PostgreSQL database credentials only if you want to use the PostgreSQL path

## Environment variables

Create `backend/.env` from the example and add values like:

```env
DATABASE_URL=sqlite:///./ai_canvas.db
SECRET_KEY=replace-with-a-long-random-secret
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=dall-e-3
FRONTEND_ORIGIN=http://localhost:5173
```

For PostgreSQL:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/ai_canvas
```

## Windows PowerShell setup

Terminal 1 — backend

```powershell
cd "C:\Users\Admin\Desktop\web ayush 1"
C:\Python314\python.exe -m venv backend\.venv
& "C:\Users\Admin\Desktop\web ayush 1\backend\.venv\Scripts\python.exe" -m pip install --upgrade pip
& "C:\Users\Admin\Desktop\web ayush 1\backend\.venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
cd backend
& "C:\Users\Admin\Desktop\web ayush 1\backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2 — frontend

```powershell
cd "C:\Users\Admin\Desktop\web ayush 1\frontend"
npm.cmd install
npm.cmd run dev
```

Open http://localhost:5173.

Demo admin credentials:

- Email: admin@example.com
- Password: admin123

## Optional PostgreSQL setup

```powershell
docker compose up -d postgres
```

Then update `backend/.env` to:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/ai_canvas
```

## Run checks

```powershell
curl http://localhost:8000/api/health
```

If the backend is running correctly, it should return a JSON status object.

## Project structure

```text
web ayush 1/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── ai.py
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── .env
│   ├── .env.example
│   ├── requirements.txt
│   └── .venv/
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── ...
├── docker-compose.yml
├── .gitignore
├── README.md
└── ...
```

This app uses SQLite by default so it runs immediately without PostgreSQL. The frontend is designed to be clean, responsive, and production-ready, while the AI features remain demo-safe if no API key is configured.