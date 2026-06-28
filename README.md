# Pomodoro

A self-hosted Pomodoro timer with session history, analytics, ambient audio, and a desktop-optimised dark UI.

**Stack:** React 19 + Vite 8 · FastAPI + SQLite · Podman

---

## Features

- Focus / Short Break / Long Break modes with configurable durations
- Animated circular timer — ring colour dims as time depletes
- Session history with date/mode filters and CSV export
- Daily analytics with streak tracking and bar charts
- Ambient audio player (upload MP3/WAV/OGG) + YouTube playlist
- Browser notifications on session end
- Automatic hourly database backups
- Sidebar navigation — timer keeps running while browsing other pages

---

## Prerequisites

Choose **Option A** (Podman container) or **Option B** (local dev). Each has different prerequisites.

### For Option A — Podman

| Tool | Min version |
|---|---|
| Podman | 4.0 |

**Linux — Ubuntu / Debian**
```bash
sudo apt update && sudo apt install -y podman
```

**Linux — Fedora / RHEL**
```bash
sudo dnf install -y podman
```

**macOS**
```bash
brew install podman
podman machine init
podman machine start
```

**Windows (WSL2 — Ubuntu shell)**
```bash
sudo apt update && sudo apt install -y podman
```

Verify: `podman --version` → should print `podman version 4.x` or higher.

---

### For Option B — Local development

| Tool | Min version | Notes |
|---|---|---|
| Node.js | 18 | Use nvm (see below) |
| npm | 9 | Bundled with Node.js |
| Python | 3.12 | Use pyenv (see below) |

**Install nvm (Node version manager)**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
# Restart your shell, then:
nvm install 18
nvm use 18
```

**Install pyenv (Python version manager)**
```bash
curl https://pyenv.run | bash
# Add pyenv to your shell profile (follow the on-screen instructions), then:
pyenv install 3.12
pyenv local 3.12     # sets 3.12 in this directory
```

Verify:
```bash
node --version    # v18.x or higher
python3 --version # Python 3.12.x
```

---

## Option A: Run with Podman (recommended)

### Step 1 — Clone the repository

```bash
git clone <repo-url>
cd pomodoro
```

### Step 2 — Start the container

```bash
bash start.sh
```

What this does:
1. Creates `~/Documents/pomodoro-data/{audio,backups}` on your host
2. Stops and removes any existing `pomodoro` container
3. Builds a fresh image — installs npm and pip dependencies, compiles React inside the container
4. Runs the container, mounting your data directory for persistence

> **First run takes 1–3 minutes** (npm ci + pip install + Vite build). Subsequent runs use layer cache and rebuild only changed layers.

### Step 3 — Open the app

[http://localhost:8000](http://localhost:8000)

---

### Container operations

```bash
# View live logs
podman logs -f pomodoro

# Stop the container (data is safe)
podman stop pomodoro

# Start again without rebuilding (instant)
podman start pomodoro

# Rebuild after code changes
bash start.sh

# Open a shell inside the running container
podman exec -it pomodoro bash

# Remove container entirely (data is preserved on host)
podman rm -f pomodoro

# Remove image to force a clean rebuild
podman rmi pomodoro-app:latest
bash start.sh
```

---

### Data persistence

All user data lives on your **host machine** at `~/Documents/pomodoro-data/` — never inside the container. Removing or recreating the container does not affect your data.

| Host path | What it contains |
|---|---|
| `~/Documents/pomodoro-data/pomodoro.db` | Sessions, settings, playlist entries, backup log |
| `~/Documents/pomodoro-data/audio/` | Uploaded ambient audio files |
| `~/Documents/pomodoro-data/backups/` | Hourly `.db` snapshot copies |

---

### Environment variables

Set inside the container by `start.sh`. Override them by editing the `podman run` command in `start.sh` if you need custom paths.

| Variable | Default | Description |
|---|---|---|
| `DB_PATH` | `/data/pomodoro.db` | SQLite database file location |
| `AUDIO_DIR` | `/data/audio` | Directory for uploaded audio files |
| `BACKUP_DIR` | `/data/backups` | Directory for hourly backup copies |

---

## Option B: Run locally (development)

You need **two terminals** running simultaneously — one for the backend, one for the frontend.

### Step 1 — Clone the repository

```bash
git clone <repo-url>
cd pomodoro
```

### Step 2 — Backend (Terminal 1)

```bash
# Create an isolated Python environment (recommended)
python3 -m venv .venv
source .venv/bin/activate        # Linux / macOS / WSL2
# .venv\Scripts\activate         # Windows PowerShell

# Install Python dependencies
pip install -r backend/requirements.txt

# Set data directories (optional — defaults write to /data/ which may not exist)
export DB_PATH="$HOME/Documents/pomodoro-data/pomodoro.db"
export AUDIO_DIR="$HOME/Documents/pomodoro-data/audio"
export BACKUP_DIR="$HOME/Documents/pomodoro-data/backups"
mkdir -p "$AUDIO_DIR" "$BACKUP_DIR"

# Start the API server with auto-reload
uvicorn backend.main:app --reload --port 8000
```

Backend API: [http://localhost:8000/api](http://localhost:8000/api)  
Swagger docs: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

### Step 3 — Frontend (Terminal 2)

```bash
npm install
npm run dev
```

Dev server: [http://localhost:5173](http://localhost:5173)

The Vite dev server proxies all `/api/*` requests to `http://localhost:8000` automatically — no CORS configuration needed.

### Step 4 — Production build (optional)

```bash
npm run build
```

Output goes to `dist/`. The FastAPI backend then serves the built app at [http://localhost:8000](http://localhost:8000).

---

## Running tests

### Backend tests

```bash
# Activate your virtual environment first
source .venv/bin/activate

# Install test dependencies (first time only)
pip install pytest pytest-asyncio httpx

# Run all backend tests with verbose output
pytest backend/tests/ -v

# Run a specific test file
pytest backend/tests/test_sessions.py -v

# Run tests matching a keyword
pytest backend/tests/ -v -k "analytics"
```

### Frontend tests

```bash
# Run all tests once
npm test

# Watch mode (re-runs on file changes)
npm run test:watch
```

---

## Project structure

```
pomodoro/
├── backend/
│   ├── main.py              # FastAPI app, static file serving, lifespan
│   ├── database.py          # SQLite schema, init, get_db context manager
│   ├── scheduler.py         # Hourly backup cron job (APScheduler)
│   ├── requirements.txt     # Python runtime + test dependencies
│   └── routers/
│       ├── sessions.py      # POST/GET/DELETE sessions; CSV export
│       ├── settings.py      # GET/PATCH timer and notification settings
│       ├── analytics.py     # Summary stats, daily breakdown, streak calc
│       ├── audio.py         # File listing; HTTP range streaming
│       ├── playlist.py      # YouTube playlist CRUD and reorder
│       └── backup.py        # Backup status, trigger, file download
├── backend/tests/
│   ├── conftest.py          # Shared pytest fixtures (isolated DB per test)
│   ├── test_settings.py
│   ├── test_sessions.py
│   ├── test_analytics.py
│   ├── test_playlist.py
│   └── test_backup.py
├── src/
│   ├── App.jsx              # Router + global timer state (persists across pages)
│   ├── hooks/               # useTimer, useSettings, useSessions, useAnalytics, ...
│   ├── pages/               # TimerPage, HistoryPage, AnalyticsPage, MediaPage, SettingsPage
│   ├── components/          # CircularTimer, TimerControls, ModeSelector, TaskLabel, ...
│   ├── utils/time.js        # formatMMSS, formatDuration, extractYouTubeId, todayISO, ...
│   └── test/                # Vitest test files
│       ├── setup.js         # jest-dom matchers
│       ├── api/             # client.test.js
│       ├── components/      # CircularTimer, ModeSelector, TaskLabel, TimerControls tests
│       ├── hooks/           # useTimer.test.js
│       └── utils/           # time.test.js
├── Containerfile            # Multi-stage build: Node → Python runtime
├── start.sh                 # One-command Podman build + run
├── pyproject.toml           # pytest configuration
├── vite.config.js           # Vite + Vitest configuration
└── README.md
```
