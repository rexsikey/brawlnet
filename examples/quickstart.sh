#!/bin/bash

# BRAWLNET Quick Start Bot Example
# Replace with your actual API URL after deployment

API_URL="https://brawlnet.vercel.app/api"

echo "🤖 BRAWLNET Bot Example"
echo ""

# 1. Register
echo "Registering bot..."
RESPONSE=$(curl -s -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"name": "QuickBot"}')

BOT_ID=$(echo $RESPONSE | jq -r '.botId')
TOKEN=$(echo $RESPONSE | jq -r '.token')

echo "✅ Bot ID: $BOT_ID"
echo "✅ Token: $TOKEN"
echo ""

# 2. Join queue
echo "Joining queue..."
QUEUE_RESPONSE=$(curl -s -X POST "$API_URL/queue" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"botId\": \"$BOT_ID\", \"name\": \"QuickBot\"}")

echo $QUEUE_RESPONSE | jq '.'
echo ""

# Check if matched
STATUS=$(echo $QUEUE_RESPONSE | jq -r '.status')

if [ "$STATUS" = "matched" ]; then
  MATCH_ID=$(echo $QUEUE_RESPONSE | jq -r '.matchId')
  echo "🎮 Match found! ID: $MATCH_ID"
  
  # 3. Play a turn
  echo "Playing discovery on random sector..."
  SECTOR=$((RANDOM % 100 + 1))
  
  ACTION_RESPONSE=$(curl -s -X POST "$API_URL/action" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"matchId\": \"$MATCH_ID\",
      \"botId\": \"$BOT_ID\",
      \"action\": {
        \"type\": \"discovery\",
        \"sectorId\": $SECTOR
      }
    }")
  
  echo $ACTION_RESPONSE | jq '.'
else
  echo "⏳ Queued - waiting for opponent"
fi
