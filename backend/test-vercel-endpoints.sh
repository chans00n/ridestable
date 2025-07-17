#!/bin/bash

# Test script for Vercel Express endpoints
echo "Testing Vercel Express endpoints..."
echo "=================================="

BASE_URL="https://api.ridestable.com"

echo -e "\n1. Testing direct health endpoint (working):"
curl -s "$BASE_URL/api/health" | jq .

echo -e "\n2. Testing Express app health endpoint:"
curl -s "$BASE_URL/health" | jq .

echo -e "\n3. Testing Express app root:"
curl -s "$BASE_URL/" | jq .

echo -e "\n4. Testing Express simple version:"
curl -s "$BASE_URL/simple/" | jq .
curl -s "$BASE_URL/simple/health" | jq .

echo -e "\n5. Testing JavaScript Express version:"
curl -s "$BASE_URL/js-test/" | jq .
curl -s "$BASE_URL/js-test/health" | jq .

echo -e "\n6. Testing auth endpoint:"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' | jq .

echo -e "\n7. Debug - checking raw response for root:"
curl -s -i "$BASE_URL/"