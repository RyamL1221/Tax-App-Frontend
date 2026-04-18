# CORS Issue Fix - PDF Download

> **Update**: The proxy solution described below has been **superseded by proper backend CORS configuration**. The backend now returns correct CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`) and handles OPTIONS preflight requests. All three proxy routes (`/api/proxy/csv`, `/api/proxy/csv-upload`, `/api/proxy/download/[...path]`) have been **removed** from the codebase. The frontend now calls the backend API and CloudFront directly. See `docs/system/backend-cors-fix-needed.md` for current details.

## Status

✅ **RESOLVED** — Backend CORS properly configured. Proxy routes removed. Frontend calls APIs directly.

## Problem (Historical)

When trying to display the generated 1099-DIV PDF, the browser was blocking the request with a CORS error:

```
Access to fetch at 'http://127.0.0.1:3000/documents/download/...' from origin 'http://localhost:3001'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause

The backend at `http://127.0.0.1:3000` didn't have CORS headers configured for the `/documents/download` endpoint, preventing the frontend at `http://localhost:3001` from making cross-origin requests.

## Solution History

### Phase 1: Proxy Workaround (Now Removed)

A Next.js API proxy route was created as a temporary workaround that routed requests through the Next.js server to bypass CORS:

```
Frontend → Next.js API Proxy → Backend → Next.js API Proxy → Frontend
```

This approach worked but added latency, complexity, and the CSV proxy was actively causing 502 errors in production.

### Phase 2: Backend CORS Fix + Proxy Removal (Current)

The backend was updated with proper CORS headers. All proxy routes were removed and the frontend now communicates directly:

```
Frontend → Backend (with CORS headers)
Frontend → CloudFront (public assets)
```

**Files removed:**
- `src/app/api/proxy/csv/route.ts`
- `src/app/api/proxy/csv-upload/route.ts`
- `src/app/api/proxy/download/[...path]/route.ts`

**Files updated to use direct URLs:**
- `src/components/forms/InlinePreviewPanel.tsx` — fetches CloudFront URLs directly
- `src/lib/api/csvUploadService.ts` — POSTs to `${NEXT_PUBLIC_API_URL}/documents/import/1099-div`
- `src/lib/api/documentService.ts` — fetches from `${NEXT_PUBLIC_API_URL}/documents/download/{jobId}`
- `src/app/forms/1099-div/csv-upload/CsvUploadClient.tsx` — fetches from `${NEXT_PUBLIC_API_URL}/documents/download/{jobId}`

## Benefits of Direct API Calls

- ✅ No CORS errors (backend properly configured)
- ✅ Reduced latency (no proxy hop)
- ✅ Eliminated 502 errors from the CSV proxy
- ✅ Less code to maintain (three route files removed)
- ✅ Maintains authentication security (JWT still required for backend calls)
- ✅ Same user experience

## How to Test

1. Start the development server: `npm run dev`
2. Login with your credentials
3. Navigate to the 1099-DIV form
4. Fill out the form and submit — PDF should display without CORS errors
5. Try CSV upload — should upload directly to backend
6. Try CSV preview — should load directly from CloudFront
