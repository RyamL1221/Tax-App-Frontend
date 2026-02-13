#!/bin/bash

# Test script to verify PDF download flow
# This script tests the complete flow: login -> generate document -> download PDF

echo "=== Testing PDF Download Flow ==="
echo ""

# Step 1: Login to get JWT token
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Extract token from response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get JWT token. Creating test user..."
  
  # Register test user
  REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "name": "Test User",
      "password": "TestPassword123!"
    }')
  
  echo "Register response: $REGISTER_RESPONSE"
  
  # Try login again
  sleep 1
  LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "TestPassword123!"
    }')
  
  echo "Second login response: $LOGIN_RESPONSE"
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get JWT token after registration"
  exit 1
fi

echo "✅ Got JWT token (length: ${#TOKEN})"
echo ""

# Step 2: Generate document
echo "Step 2: Generating 1099-DIV document..."
GENERATE_RESPONSE=$(curl -s -X POST http://localhost:3000/documents/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "documentType": "1099-DIV",
    "formData": {
      "calendarYear": "2024",
      "payerName": "Test Corporation",
      "payerTIN": "12-3456789",
      "recipientName": "John Doe",
      "recipientTIN": "123-45-6789",
      "totalOrdinaryDividends": 1000.00
    }
  }')

echo "Generate response: $GENERATE_RESPONSE"

# Extract jobId
JOB_ID=$(echo $GENERATE_RESPONSE | grep -o '"jobId":"[^"]*' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
  echo "❌ Failed to generate document"
  exit 1
fi

echo "✅ Document generated (jobId: $JOB_ID)"
echo ""

# Step 3: Download PDF via backend directly
echo "Step 3: Testing backend PDF download..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/documents/download/$JOB_ID)

echo "Backend download status: $BACKEND_STATUS"

if [ "$BACKEND_STATUS" = "200" ]; then
  echo "✅ Backend PDF download successful"
else
  echo "❌ Backend PDF download failed with status $BACKEND_STATUS"
fi
echo ""

# Step 4: Download PDF via proxy
echo "Step 4: Testing proxy PDF download..."
PROXY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/proxy/download/$JOB_ID)

echo "Proxy download status: $PROXY_STATUS"

if [ "$PROXY_STATUS" = "200" ]; then
  echo "✅ Proxy PDF download successful"
else
  echo "❌ Proxy PDF download failed with status $PROXY_STATUS"
  
  # Get error details
  echo "Error details:"
  curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:3001/api/proxy/download/$JOB_ID
  echo ""
fi
echo ""

echo "=== Test Complete ==="
