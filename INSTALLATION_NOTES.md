# Installation Notes

## Node.js Version Requirement

⚠️ **Important**: PrivaSend requires Node.js 20 LTS due to native dependencies.

### Issue with Node.js 25+

The `better-sqlite3` package requires native compilation and is not yet compatible with Node.js 25+.

### Solution

Use Node.js 20 (LTS):

```bash
# If using nvm
nvm install 20
nvm use 20

# Or use the .nvmrc file
nvm use

# Then install dependencies
npm install
```

### Alternative Solutions

If you cannot use Node 20, you have two options:

#### Option 1: Use Node 20 LTS (Recommended)

This is the recommended approach as `better-sqlite3` offers:

- Best performance
- Native SQLite integration
- WAL mode support
- Full feature compatibility

#### Option 2: Switch to sql.js (Pure JavaScript)

If you must use Node 25+, we can modify the database layer to use `sql.js`:

1. Update `package.json`:

```json
{
	"dependencies": {
		"nanoid": "^5.0.0",
		"sql.js": "^1.10.0"
	}
}
```

2. Rewrite `src/lib/server/database.ts` to use sql.js API

**Note**: sql.js has some limitations:

- No WAL mode
- Slightly slower performance
- All in-memory (needs manual persistence)
- More complex API

## Current Setup

The project is configured for Node 20 LTS with `better-sqlite3`.

## Verification

After switching to Node 20, verify your installation:

```bash
# Check Node version
node --version
# Should show: v20.x.x

# Clean install
rm -rf node_modules package-lock.json
npm install

# Run the project
npm run dev
```

## Troubleshooting

### "npm install" still fails

1. Make sure you're using Node 20:

   ```bash
   node --version
   ```

2. Clear npm cache:

   ```bash
   npm cache clean --force
   ```

3. Remove node_modules and reinstall:

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. Make sure you have build tools installed:

   ```bash
   # macOS
   xcode-select --install

   # Linux
   sudo apt-get install build-essential
   ```

### Build tools missing

On macOS, you may need Xcode Command Line Tools:

```bash
xcode-select --install
```

### Python version issues

`node-gyp` requires Python 3. If you have issues:

```bash
# macOS with Homebrew
brew install python@3.11

# Or configure npm to use specific Python
npm config set python /usr/bin/python3
```

## Docker Alternative

If you can't resolve the Node version issue, use Docker:

```bash
# Build with Docker (uses Node 20 in container)
docker-compose up -d

# The container uses Node 20 internally
```

The `Dockerfile` is configured with Node 20 and will work regardless of your host Node version.

---

**Summary**: Use Node 20 LTS for best compatibility. The `.nvmrc` file is provided for convenience with nvm.
