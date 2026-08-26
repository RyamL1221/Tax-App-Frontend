# Backend CORS Configuration — Resolved

## Issue (Historical)

The PDF download feature was previously failing due to CORS (Cross-Origin Resource Sharing) errors. The backend at `http://127.0.0.1:3000` was not allowing requests from the frontend at `http://localhost:3001`.

A Next.js API proxy workaround (`/api/proxy/download/`, `/api/proxy/csv`, `/api/proxy/csv-upload`) was implemented to bypass CORS by routing requests through the Next.js server. This workaround has since been **removed** because the backend now has proper CORS headers configured.

## Current State

The backend has been updated with proper CORS configuration:

- `Access-Control-Allow-Origin` is set to allow the frontend origin
- `Access-Control-Allow-Methods` includes GET, POST, OPTIONS
- `Access-Control-Allow-Headers` includes Authorization, Content-Type, Accept
- OPTIONS preflight requests are handled correctly

The frontend now calls the backend API directly:

- **CSV previews**: Fetched directly from CloudFront URLs (public assets, no auth needed)
- **CSV uploads**: POST directly to `${NEXT_PUBLIC_API_URL}/documents/import/1099-div` with JWT Authorization header
- **PDF downloads**: Fetched directly from `${NEXT_PUBLIC_API_URL}/documents/download/{jobId}` with JWT Authorization header

## Proxy Removal Summary

The following proxy route files were deleted as they are no longer needed:

- `src/app/api/proxy/csv/route.ts` — was proxying CSV preview requests to CloudFront
- `src/app/api/proxy/csv-upload/route.ts` — was proxying CSV upload requests to the backend
- `src/app/api/proxy/download/[...path]/route.ts` — was proxying PDF download requests to the backend

All source files that referenced `/api/proxy/*` endpoints have been updated to use direct URLs.

## Original Error Messages (Historical)

```
Access to fetch at 'http://127.0.0.1:3000/documents/download/...' from origin 'http://localhost:3001'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Testing

After the backend CORS fix, direct API calls work without any proxy:

```bash
# Verify CORS headers on the backend
curl -X OPTIONS http://127.0.0.1:3000/documents/download/test \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -v

# Should return 200 with proper CORS headers
```
