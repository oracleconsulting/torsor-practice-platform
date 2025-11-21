#!/bin/bash

# Check if Railway deployed the new build
# This script monitors the production URL for a new bundle hash

echo "🔍 Checking Railway deployment status..."
echo ""

PROD_URL="https://torsor-practice-platform-production.up.railway.app"
OLD_HASH="index-8648972c.js"

echo "📡 Fetching current deployment..."
RESPONSE=$(curl -s "$PROD_URL/team" | grep -o 'index-[a-f0-9]\{8\}\.js' | head -1)

if [ -z "$RESPONSE" ]; then
    echo "❌ Could not fetch bundle hash from production"
    echo "   URL might be down or network issue"
    exit 1
fi

echo "Current bundle: $RESPONSE"
echo "Expected OLD hash: $OLD_HASH"
echo ""

if [ "$RESPONSE" = "$OLD_HASH" ]; then
    echo "⚠️  STILL OLD DEPLOYMENT!"
    echo "   Railway hasn't deployed the fix yet."
    echo ""
    echo "   Check Railway dashboard:"
    echo "   https://railway.app/project/[your-project]"
    echo ""
    echo "   Wait a few more minutes and run this again:"
    echo "   bash check-deployment.sh"
else
    echo "✅ NEW DEPLOYMENT DETECTED!"
    echo "   Bundle hash changed to: $RESPONSE"
    echo ""
    echo "   🎉 The fix should be live now!"
    echo ""
    echo "   Next steps:"
    echo "   1. Hard refresh your browser (Cmd+Shift+R)"
    echo "   2. Check if error is gone"
    echo "   3. Verify Advisory Skills page loads"
fi

echo ""
echo "⏱️  Last checked: $(date)"

