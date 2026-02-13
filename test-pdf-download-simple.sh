#!/bin/bash

# Simple test script to verify PDF download flow

echo "=== Testing PDF Download Flow ==="
echo ""

# Step 1: Login
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPassword123!"}')

# Extract token using python
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in successfully"
echo "Token length: ${#TOKEN}"
echo ""

# Step 2: Generate document
echo "Step 2: Generating document..."
GENERATE_RESPONSE=$(curl -s -X POST http://localhost:3000/documents/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "documentType": "1099-DIV",
    "formData": {
      "calendarYear": "2024",
      "payerName": "Test Corp",
      "payerTIN": "12-3456789",
      "recipientName": "John Doe",
      "recipientTIN": "123-45-6789",
      "totalOrdinaryDividends": 1000.00
    }
  }')

JOB_ID=$(echo "$GENERATE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('jobId', ''))" 2>/dev/null)

if [ -z "$JOB_ID" ]; then
  echo "❌ Failed to generate document"
  echo "Response: $GENERATE_RESPONSE"
  exit 1
fi

echo "✅ Document generated"
echo "Job ID: $JOB_ID"
echo ""

# Step 3: Test backend download
echo "Step 3: Testing backend download..."
BACKEND_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/test-backend.pdf \
  http://localhost:3000/documents/download/$JOB_ID)

BACKEND_STATUS=$(echo "$BACKEND_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$BACKEND_STATUS" = "200" ]; then
  echo "✅ Backend download successful"
  FILE_SIZE=$(wc -c < /tmp/test-backend.pdf)
  echo "   PDF size: $FILE_SIZE bytes"
else
  echo "❌ Backend download failed (status: $BACKEND_STATUS)"
fi
echo ""

# Step 4: Test proxy download
echo "Step 4: Testing proxy download..."
PROXY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/test-proxy.pdf \
  http://localhost:3001/api/proxy/download/$JOB_ID)

PROXY_STATUS=$(echo "$PROXY_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$PROXY_STATUS" = "200" ]; then
  echo "✅ Proxy download successful"
  FILE_SIZE=$(wc -c < /tmp/test-proxy.pdf)
  echo "   PDF size: $FILE_SIZE bytes"
  
  # Verify it's a valid PDF
  if file /tmp/test-proxy.pdf | grep -q "PDF"; then
    echo "✅ Valid PDF file"
  else
    echo "❌ Not a valid PDF file"
    echo "   File type: $(file /tmp/test-proxy.pdf)"
  fi
else
  echo "❌ Proxy download failed (status: $PROXY_STATUS)"
  echo "Response:"
  cat /tmp/test-proxy.pdf
  echo ""
fi

echo ""
echo "=== Test Complete ==="
