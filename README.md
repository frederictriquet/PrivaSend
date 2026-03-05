# PrivaSend

**Self-hosted secure file sharing for private networks** — an open-source alternative to WeTransfer designed for VPCs and local infrastructure.

[![CI](https://github.com/frederictriquet/PrivaSend/workflows/CI/badge.svg)](https://github.com/frederictriquet/PrivaSend/actions/workflows/ci.yml)
[![Docker](https://github.com/frederictriquet/PrivaSend/workflows/Docker/badge.svg)](https://github.com/frederictriquet/PrivaSend/actions/workflows/docker.yml)
[![Security](https://github.com/frederictriquet/PrivaSend/workflows/Security%20Scan/badge.svg)](https://github.com/frederictriquet/PrivaSend/actions/workflows/security.yml)
[![codecov](https://codecov.io/gh/frederictriquet/PrivaSend/graph/badge.svg)](https://codecov.io/gh/frederictriquet/PrivaSend)

---

## Features

- **Drag & drop upload** — intuitive interface, click or drop to upload
- **Large file support** — chunked upload up to 5 GB, with real-time progress
- **Secure share links** — cryptographic tokens, configurable expiry (default 7 days)
- **Clean download page** — file metadata, progress bar, range request support (resumable)
- **Shared volume mode** — browse and share pre-existing files without uploading
- **Optional authentication** — password-protected admin access with rate-limited login
- **Automatic cleanup** — files and links expire automatically, no manual intervention
- **Dark mode** — respects system preference, toggleable
- **Admin dashboard** — transfer logs and file management

---

## Highlights

|                            |                                                                    |
| -------------------------- | ------------------------------------------------------------------ |
| **Truly private**          | No cloud, no tracking, runs entirely on your infrastructure        |
| **Zero config by default** | Works out of the box, every option is optional                     |
| **Security-ready**         | Rate limiting, secure sessions, Traefik + CrowdSec stack available |
| **Flexible deployment**    | Docker Compose, HTTPS with Let's Encrypt, or bare Node.js          |
| **5 GB files**             | Chunked upload handles large files reliably                        |
| **Self-expiring**          | Files delete themselves — no storage accumulation                  |

---

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/frederictriquet/PrivaSend.git
cd PrivaSend
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000).

> Files are stored in `./storage/`. Mount a volume to persist data across restarts.

### Manual

```bash
git clone https://github.com/frederictriquet/PrivaSend.git
cd PrivaSend
npm install
cp .env.example .env
npm run build
node build
```

---

## Installation Options

### Option 1 — Docker (simple)

```bash
docker compose up -d
```

Uses `docker-compose.yml`. Runs on port 3000, stores files in `./storage/`.

### Option 2 — Docker with HTTPS

```bash
# Edit DOMAIN and email in docker/docker-compose.https.yml first
docker compose -f docker/docker-compose.https.yml up -d
```

Adds automatic TLS via Let's Encrypt (Traefik).

### Option 3 — Production stack (Traefik + CrowdSec)

```bash
# Edit DOMAIN, ADMIN_PASSWORD and API keys in docker/docker-compose.secure.yml
docker compose -f docker/docker-compose.secure.yml up -d
```

Full security stack: reverse proxy, automatic HTTPS, intrusion prevention system (WAF).

---

## Configuration

Copy `.env.example` to `.env` and adjust as needed. All settings have sensible defaults.

```env
# Storage
STORAGE_PATH=./storage           # Where files are stored
MAX_FILE_SIZE=5368709120         # 5 GB max file size
DEFAULT_EXPIRATION_DAYS=7        # Files expire after 7 days
CLEANUP_INTERVAL_HOURS=1         # Cleanup runs every hour

# Modes
UPLOAD_ENABLED=true              # Set false to browse shared files only
SHARED_VOLUME_ENABLED=false      # Enable browsing of a pre-mounted volume

# Authentication (disabled by default)
AUTH_ENABLED=false
ADMIN_PASSWORD=changeme123       # Required if AUTH_ENABLED=true
SESSION_TIMEOUT_HOURS=24
LOGIN_RATE_LIMIT=3               # Max login attempts per minute
```

---

## Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Framework  | SvelteKit 2 (full-stack, SSR)     |
| Language   | TypeScript                        |
| Runtime    | Node.js 20+                       |
| Database   | SQLite (better-sqlite3, WAL mode) |
| Storage    | Local filesystem                  |
| Deployment | Docker / Node adapter             |

---

## License

MIT
