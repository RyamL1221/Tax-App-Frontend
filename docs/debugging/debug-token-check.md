# Debug Token Check

## Check if JWT Token Exists in Browser

Open your browser's DevTools console and run this command:

```javascript
console.log('JWT Token:', localStorage.getItem('jwt_token'));
```

### Expected Results:

**If you see a long string (JWT token):**
```
JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```
✅ Token exists - the issue is with the backend rejecting it

**If you see `null`:**
```
JWT Token: null
```
❌ No token - you need to log in again

## Check Backend Logs

After trying to download the PDF, check your Next.js terminal for logs like:

```
[Proxy] Request received for path: outputs/test@test.org/...
[Proxy] Authorization header present: true
[Proxy] Authorization header (first 20 chars): Bearer eyJhbGciOiJI...
[Proxy] Forwarding request to backend: http://127.0.0.1:3000/documents/download/...
[Proxy] Backend response status: 403
[Proxy] Backend error response: {"message":"Missing Authentication Token"}
```

## Common Issues:

### 1. Token Not in localStorage
**Solution:** Log in again to get a fresh token

### 2. Backend Returning 403
**Possible causes:**
- Token expired
- Backend not recognizing the token format
- Backend expecting different authentication

### 3. Token Format Issue
**Check if token starts with "Bearer ":**
```javascript
const token = localStorage.getItem('jwt_token');
console.log('Token starts with Bearer:', token?.startsWith('Bearer'));
```

If it returns `true`, the token already has "Bearer " prefix, which means we're sending "Bearer Bearer token" to the backend.

**Fix:** The token should NOT have "Bearer " prefix in localStorage. It should be just the token string.

## Quick Fix to Test

Try this in the browser console:

```javascript
// Get current token
const token = localStorage.getItem('jwt_token');
console.log('Current token:', token);

// If it starts with "Bearer ", remove it
if (token && token.startsWith('Bearer ')) {
  const cleanToken = token.replace('Bearer ', '');
  localStorage.setItem('jwt_token', cleanToken);
  console.log('Fixed token:', cleanToken);
  console.log('Now refresh the page and try again');
}
```

Then refresh the page and try submitting the form again.
