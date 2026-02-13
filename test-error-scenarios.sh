#!/bin/bash

echo "=== Testing Error Scenarios ==="
echo ""

# Get a valid token first
echo "Getting valid token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPassword123!"}')

VALID_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$VALID_TOKEN" ]; then
  echo "❌ Failed to get valid token"
  exit 1
fi

echo "✅ Got valid token"
echo ""

# Test 1: Invalid JWT token
echo "Test 1: Invalid JWT token (should show 401 auth error)"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer invalid_token_here" \
  http://localhost:3001/api/proxy/download/550e8400-e29b-41d4-a716-446655440000)

STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "Status: $STATUS"
echo "Response: $BODY"

if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
  echo "✅ Correctly returned auth error"
else
  echo "❌ Expected 401/403, got $STATUS"
fi
echo ""

# Test 2: Non-existent jobId
echo "Test 2: Non-existent jobId (should show 404 not found)"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  http://localhost:3001/api/proxy/download/00000000-0000-0000-0000-000000000000)

STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "Status: $STATUS"
echo "Response: $BODY"

if [ "$STATUS" = "404" ]; then
  echo "✅ Correctly returned 404 not found"
else
  echo "❌ Expected 404, got $STATUS"
fi
echo ""

# Test 3: Missing auth header
echo "Test 3: Missing auth header (should show 401)"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  http://localhost:3001/api/proxy/download/550e8400-e29b-41d4-a716-446655440000)

STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "Status: $STATUS"
echo "Response: $BODY"

if [ "$STATUS" = "401" ]; then
  echo "✅ Correctly returned 401 unauthorized"
else
  echo "❌ Expected 401, got $STATUS"
fi
echo ""

echo "=== Error Scenario Tests Complete ==="
