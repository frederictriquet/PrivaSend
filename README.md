# PrivaSend

Secure file sharing application for VPC and local networks - An open-source alternative to WeTransfer for private infrastructure.

[![CI](https://github.com/frederictriquet/PrivaSend/workflows/CI/badge.svg)](https://github.com/frederictriquet/PrivaSend/actions/workflows/ci.yml)
[![Docker](https://github.com/frederictriquet/PrivaSend/workflows/Docker/badge.svg)](https://github.com/frederictriquet/PrivaSend/actions/workflows/docker.yml)
[![Security](https://github.com/frederictriquet/PrivaSend/workflows/Security%20Scan/badge.svg)](https://github.com/frederictriquet/PrivaSend/actions/workflows/security.yml)

**Version**: v0.4.0 | **Status**: Production Ready with CI/CD

## Current Status: Phase 2 - CI/CD & Quality ✅

### Implemented Features

- ✅ **File Upload Interface**
  - Modern drag & drop interface
  - File selection via button
  - Visual feedback during upload
  - Real-time progress tracking

- ✅ **Large File Support**
  - Chunked upload for files > 10MB
  - Support for files up to 5GB (configurable)
  - Efficient streaming handling
  - Progress bar with percentage

- ✅ **Secure Share Links** (New in 1.2)
  - Automatic link generation on upload
  - Copy-to-clipboard functionality
  - Secure tokens (32 characters)
  - Configurable expiration (7 days default)

- ✅ **Download Page** (New in 1.2)
  - Clean, informative download interface
  - File metadata display
  - Download progress tracking
  - Range requests support (resume downloads)

- ✅ **Server-side Storage**
  - Local filesystem storage
  - Unique file identification (nanoid)
  - Metadata management
  - Configurable storage paths

- ✅ **Database** (New in 1.2)
  - SQLite with WAL mode
  - Share link tracking
  - Download statistics
  - Automatic cleanup of expired links

- ✅ **Automatic Cleanup**
  - Files expire after 7 days (configurable)
  - Links expire after 7 days (configurable)
  - Automatic cleanup service
  - Background task every 1 hour (configurable)
  - No manual intervention required

- ✅ **Configuration System**
  - Environment-based configuration
  - Customizable file size limits
  - Adjustable chunk sizes
  - Flexible retention policies

## Tech Stack

- **Framework**: SvelteKit 2.x (full-stack)
- **Language**: TypeScript
- **Runtime**: Node.js
- **Database**: SQLite (better-sqlite3)
- **Storage**: Local filesystem
- **Adapter**: Node adapter (for deployment)
- **IDs**: nanoid (cryptographically secure)

## Installation

### Prerequisites

- Node.js 18+ or 20+
- npm or pnpm

### Setup

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Run production server
node build
```

## Configuration

Edit `.env` file to customize:

```env
# Storage Configuration
STORAGE_PATH=./storage              # Where files are stored
MAX_FILE_SIZE=5368709120           # 5GB in bytes
CHUNK_SIZE=5242880                 # 5MB chunks
ALLOWED_MIME_TYPES=                # Empty = all types allowed

# Retention Configuration
DEFAULT_EXPIRATION_DAYS=7          # Files expire after 7 days
CLEANUP_INTERVAL_HOURS=1           # Cleanup runs every hour
```

## Project Structure

```
PrivaSend/
├── src/
│   ├── lib/
│   │   └── server/
│   │       ├── config.ts       # Configuration management
│   │       ├── storage.ts      # File storage service
│   │       └── cleanup.ts      # Automatic cleanup service
│   ├── routes/
│   │   ├── api/
│   │   │   └── upload/
│   │   │       └── +server.ts  # Upload API endpoint
│   │   └── +page.svelte        # Main upload UI
│   ├── hooks.server.ts         # Server initialization
│   ├── app.html                # HTML template
│   └── app.d.ts                # TypeScript definitions
├── storage/                    # File storage (gitignored)
│   ├── metadata/              # File metadata (JSON)
│   └── [fileId]               # Actual files
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
├── .env.example
└── ROADMAP.md                 # Full project roadmap
```

## API Documentation

### POST `/api/upload`

Upload a file to the server.

#### Standard Upload (for files < 10MB)

```bash
curl -X POST http://localhost:5173/api/upload \
  -F "file=@/path/to/file.pdf"
```

Response:

```json
{
	"success": true,
	"fileId": "abc123...",
	"fileName": "file.pdf",
	"fileSize": 1234567,
	"expiresAt": "2025-12-06T12:00:00.000Z"
}
```

#### Chunked Upload (for large files)

```bash
# Upload chunk
curl -X POST http://localhost:5173/api/upload \
  -H "Content-Type: application/octet-stream" \
  -H "X-File-Id: unique-file-id" \
  -H "X-Chunk-Index: 0" \
  -H "X-Total-Chunks: 10" \
  -H "X-File-Name: largefile.zip" \
  -H "X-Mime-Type: application/zip" \
  --data-binary @chunk0.bin
```

Response (intermediate chunk):

```json
{
	"success": true,
	"complete": false,
	"chunkIndex": 0,
	"totalChunks": 10
}
```

Response (final chunk):

```json
{
	"success": true,
	"complete": true,
	"fileId": "abc123...",
	"fileName": "largefile.zip",
	"fileSize": 52428800,
	"expiresAt": "2025-12-06T12:00:00.000Z"
}
```

## Usage

1. **Start the application**:

   ```bash
   npm run dev
   ```

2. **Open your browser** to `http://localhost:5173`

3. **Upload a file**:
   - Drag and drop a file onto the upload zone
   - Or click to browse and select a file

4. **Track progress**:
   - See real-time upload progress
   - Get file ID upon completion

5. **File management**:
   - Files are stored in `./storage/`
   - Metadata in `./storage/metadata/`
   - Automatic cleanup after expiration

## Development

### Run in Development Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run check
```

### Build for Production

```bash
npm run build
npm run preview
```

## Deployment

### Docker (Recommended)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "build"]
```

Build and run:

```bash
docker build -t privasend .
docker run -p 3000:3000 -v $(pwd)/storage:/app/storage privasend
```

### Traditional Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Copy `build/`, `package.json`, and `.env` to your server

3. Install production dependencies:

   ```bash
   npm ci --production
   ```

4. Start the server:
   ```bash
   NODE_ENV=production node build
   ```

## Next Steps (Roadmap)

See [ROADMAP.md](ROADMAP.md) for the complete feature roadmap.

**Upcoming in Phase 1.2 - Secure Link Generation:**

- Generate secure, shareable download links
- Configurable expiration times
- Token-based access control
- Copy-to-clipboard functionality

## Security Considerations (Phase 1.1)

- ✅ File size validation
- ✅ Unique file IDs (nanoid - 21 chars)
- ✅ Automatic file expiration
- ⚠️ No authentication yet (Phase 2)
- ⚠️ No encryption yet (Phase 2)
- ⚠️ No download links yet (Phase 1.2)

**Note**: This is Phase 1.1 MVP. Security features like authentication, encryption, and access control will be added in subsequent phases.

## Contributing

This is a personal/internal project. Contributions welcome once the core features are complete.

## License

MIT (or your preferred license)

---

**Current Phase**: 1.1 - File Upload & Storage ✅
**Next Phase**: 1.2 - Secure Link Generation
**Project Status**: In Active Development
