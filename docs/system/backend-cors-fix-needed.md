# Backend CORS Configuration Fix Required

## Issue
The PDF download feature was failing due to CORS (Cross-Origin Resource Sharing) errors. The backend at `http://127.0.0.1:3000` was not allowing requests from the frontend at `http://localhost:3001`.

## Solution Implemented

**A Next.js API proxy route has been implemented as a workaround.** This bypasses CORS entirely by making the request server-side.

### How It Works

1. Frontend makes request to `/api/proxy/download/[path]` (same origin, no CORS)
2. Next.js server receives the request and extracts the JWT token
3. Next.js server makes request to backend at `http://127.0.0.1:3000` with JWT token
4. Backend responds with PDF (no CORS issue since it's server-to-server)
5. Next.js server streams PDF back to frontend

### Files Changed

- `src/app/api/proxy/download/[...path]/route.ts` - New proxy API route
- `src/lib/api/documentService.ts` - Updated to use proxy route instead of direct backend calls
- `src/lib/api/documentService.test.ts` - Updated tests to reflect proxy usage

### Benefits

- ✅ No CORS errors
- ✅ Works immediately without backend changes
- ✅ Maintains authentication security (JWT still required)
- ✅ Same user experience
- ✅ No changes needed to frontend components

## Original Error Messages
```
Access to fetch at 'http://127.0.0.1:3000/documents/download/...' from origin 'http://localhost:3001' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## Backend Fix (Still Recommended for Production)

While the proxy workaround solves the immediate issue, the backend should still implement proper CORS headers for production use. This will allow direct frontend-to-backend communication without the proxy overhead.

## What Needs to Be Fixed on the Backend

The backend needs to add CORS headers to the `/documents/download` endpoint (and ideally all endpoints).

### Required CORS Headers

The backend should return these headers for the `/documents/download` endpoint:

```
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, Accept
Access-Control-Max-Age: 86400
```

### Handle OPTIONS Preflight Request

The backend must handle the OPTIONS request (preflight) for the download endpoint:

```python
# Example for AWS Lambda/API Gateway
if event['httpMethod'] == 'OPTIONS':
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
            'Access-Control-Max-Age': '86400'
        },
        'body': ''
    }
```

### For All Responses

Every response from `/documents/download` should include:

```python
'headers': {
    'Access-Control-Allow-Origin': 'http://localhost:3001',
    'Access-Control-Allow-Credentials': 'false',  # We're using JWT, not cookies
    'Content-Type': 'application/pdf'
}
```

## Alternative Solutions

### Option 1: Use Wildcard (Development Only)
For development, you can use a wildcard:
```
Access-Control-Allow-Origin: *
```
**Warning:** Don't use this in production!

### Option 2: Configure API Gateway (if using AWS)
If using AWS API Gateway, enable CORS in the console:
1. Select the `/documents/download` resource
2. Click "Actions" → "Enable CORS"
3. Add `Authorization` to "Access-Control-Allow-Headers"
4. Deploy the API

### Option 3: Add CORS Middleware
If using a framework, add CORS middleware:

**Express.js:**
```javascript
const cors = require('cors');
app.use('/documents/download', cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept']
}));
```

**Flask:**
```python
from flask_cors import CORS
CORS(app, resources={
    r"/documents/download/*": {
        "origins": "http://localhost:3001",
        "methods": ["GET", "OPTIONS"],
        "allow_headers": ["Authorization", "Content-Type", "Accept"]
    }
})
```

## Testing the Fix

After implementing the fix, test with:

```bash
# Test OPTIONS preflight
curl -X OPTIONS http://127.0.0.1:3000/documents/download/test \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -v

# Should return 200 with CORS headers
```

## Frontend Changes Made

The frontend has been updated to:
1. Include proper headers (`Authorization`, `Accept: application/pdf`)
2. Use `credentials: 'omit'` since we're using JWT
3. Provide better error messages for CORS issues

## Next Steps

1. Update the backend to include CORS headers on `/documents/download`
2. Handle OPTIONS preflight requests
3. Test the download functionality
4. Consider adding CORS to all backend endpoints for consistency
