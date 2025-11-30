# Phase 1.5 - Step 2: TODO

## Ce qui a été fait (Step 1)

✅ Backend foundation complete:
- config.ts with sharedVolume section
- database.ts with sourceType and sharedPath fields
- sharedvolume.ts service with security
- API endpoints created:
  - GET /api/shared/browse
  - POST /api/shared/link

## Ce qu'il reste à faire (Step 2)

### 1. Update Download Handler

File: `src/routes/download/[token]/+server.ts`

Needs modification to handle `sourceType`:

```typescript
// After getting shareLink:
if (shareLink.sourceType === 'shared') {
  // Get file from shared volume
  const service = new SharedVolumeService();
  const fullPath = service.validatePath(shareLink.sharedPath!);

  // Use fullPath instead of metadata.path
  const stat = statSync(fullPath);
  const stream = createReadStream(fullPath);
  // ... rest of streaming logic
} else {
  // Existing logic for uploaded files
}
```

### 2. Add Unit Tests

Create: `tests/unit/routes/shared-api.test.ts`

Test both API endpoints with mocked filesystem.

### 3. Add E2E Tests

Create: `tests/e2e/shared-volume.spec.ts`

Test the browse and share flow.

### 4. Frontend (Step 3)

Create UI for browsing and sharing - separate commit.

## Quick Implementation

Due to token limits, the implementation is split.
Download handler modification and tests to be added in next session.
