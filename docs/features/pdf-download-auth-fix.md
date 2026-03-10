# PDF Download Authentication Fix

## Problem
After submitting the 1099-DIV form, the PDF preview was showing the error:
```
Failed to Load PDF
Missing Authentication Token
```

## Root Cause
The `downloadDocument()` method in `documentService.ts` was sending an empty Authorization header when the JWT token was not found in localStorage. The proxy route was correctly checking for the Authorization header and returning a 401 error when it was missing or empty.

## Solution
Updated the `downloadDocument()` method to:
1. Check if the JWT token exists in localStorage before making the request
2. Throw a clear error message if the token is missing
3. Only proceed with the fetch request if a valid token is present

### Code Changes

**File: `src/lib/api/documentService.ts`**

Before:
```typescript
const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;

try {
  const response = await fetch(downloadUrl, {
    method: 'GET',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',  // Empty string if no token
      'Accept': 'application/pdf'
    }
  });
```

After:
```typescript
const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;

// Check if token exists
if (!token) {
  throw {
    status: 401,
    message: 'Authentication required. Please log in again.'
  };
}

try {
  const response = await fetch(downloadUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,  // Always has a token now
      'Accept': 'application/pdf'
    }
  });
```

## Why This Happens
This error occurs when:
1. The user's JWT token has expired
2. The user logged out but stayed on the form page
3. The JWT token was never stored (login issue)
4. localStorage was cleared

## User Experience
When this error occurs, the user will see a clear message:
```
Failed to Load PDF
Authentication required. Please log in again.
```

This prompts them to log in again to restore their session.

## Testing
- Added new test case: "should throw error when token is missing"
- All 28 tests passing
- No TypeScript errors

## Files Modified
1. `src/lib/api/documentService.ts` - Added token validation
2. `src/lib/api/documentService.test.ts` - Added test for missing token

## Next Steps
To prevent this issue:
1. Ensure users are logged in before accessing the form
2. Implement token refresh mechanism for long sessions
3. Add session timeout warnings
4. Redirect to login page when token is missing

## How to Test
1. Log in to the application
2. Submit a 1099-DIV form
3. PDF should display correctly
4. To test the error: Clear localStorage and try to submit again
